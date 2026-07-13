import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { executeTool } from "../_shared/whatsapp-tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID")!;
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendWhatsAppMessage(to: string, payload: any): Promise<{ id: string | null; error: string | null }> {
  const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;

  const body: any = {
    messaging_product: "whatsapp",
    to,
  };

  if (payload.template) {
    body.type = "template";
    body.template = payload.template;
  } else if (payload.imageUrl) {
    body.type = "image";
    body.image = {
      link: payload.imageUrl,
      caption: payload.text
    };
  } else {
    body.type = "text";
    body.text = { body: payload.text };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("WhatsApp send error:", errText);
    let userMsg = `WhatsApp API error (${res.status}): ${errText.slice(0, 400)}`;
    try {
      const parsed = JSON.parse(errText);
      const code = parsed?.error?.code;
      const type = parsed?.error?.type;
      const subcode = parsed?.error?.error_subcode;
      const msg = parsed?.error?.message || parsed?.error?.error_user_msg;

      // Token problems (codes 0, 190 → expired/invalid token)
      if (code === 190 || subcode === 463 || subcode === 467 || msg === "Authentication Error") {
        userMsg = `Token caducado/invalido. Detalle Meta: ${msg ?? "Authentication Error"} (code ${code ?? "?"}/subcode ${subcode ?? "?"})`;
      }
      // OAuthException with code 100 = permission/phone-id mismatch
      else if (code === 100 && type === "OAuthException") {
        userMsg = `Permiso o WHATSAPP_PHONE_ID inválido. Detalle Meta: ${msg ?? errText.slice(0, 200)}`;
      }
      // 131030 = recipient not in allowed list (account in test/dev mode)
      else if (code === 131030) {
        userMsg = "Tu cuenta de WhatsApp Business está en modo prueba/desarrollo. Meta solo permite enviar a números autorizados. Soluciones: 1) Completa la verificación de empresa en business.facebook.com → Seguridad → Verificación de empresa, o 2) Añade el teléfono del cliente como destinatario autorizado en developers.facebook.com → WhatsApp → API Setup → Manage phone number list.";
      }
      // 131031 = recipient not opted in / template-only
      else if (code === 131031) {
        userMsg = "El destinatario no ha aceptado recibir mensajes o el número no está confirmado.";
      }
      // 131026 = no matching template
      else if (code === 131026) {
        userMsg = "No existe una plantilla aprobada con ese nombre/idioma.";
      }
      // 131047 = "Re-engagement message" — fuera de ventana de 24h
      else if (code === 131047) {
        userMsg = "Han pasado más de 24 h desde el último mensaje del cliente. WhatsApp solo permite enviar plantillas aprobadas fuera de la ventana de 24 h.";
      }
      // 131056 = pair rate limit
      else if (code === 131056) {
        userMsg = "WhatsApp está limitando los envíos a este número (rate limit). Espera unos minutos y vuelve a intentarlo.";
      }
      // 132000-132xxx = template / 24h window rejection
      else if (typeof code === "number" && code >= 132000 && code < 133000) {
        userMsg = `Plantilla rechazada por WhatsApp: ${msg ?? "código " + code}`;
      }
      else if (msg) {
        userMsg = msg;
      }
    } catch { /* keep default */ }
    return { id: null, error: userMsg };
  }
  const data = await res.json();
  return { id: data.messages?.[0]?.id ?? null, error: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  try {
    const { conversationId, to, text, imageUrl, template, displayText, toolCalls } = await req.json();

    let targetPhone = to;
    let targetConvId = conversationId;

    if (conversationId && !to) {
      const { data: conv } = await supabase
        .from("whatsapp_conversations")
        .select("phone")
        .eq("id", conversationId)
        .single();
      targetPhone = conv?.phone;
    }

    if (!targetPhone) throw new Error("Target phone or conversationId required");

    // If no conv but we have a phone, try to find or create one so the
    // outbound message lands in the panel timeline. Without this, reminders
    // sent to clients who never wrote first vanish from the admin view.
    if (!targetConvId && targetPhone) {
      const last9 = targetPhone.replace(/\D/g, "").slice(-9);
      const { data: existing } = await supabase
        .from("whatsapp_conversations")
        .select("id")
        .ilike("phone", `%${last9}`)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        targetConvId = existing.id;
      } else {
        // Create a minimal conversation so the message has somewhere to live.
        const normalised = targetPhone.startsWith("+") ? targetPhone : `+${targetPhone.replace(/\D/g, "")}`;
        const { data: created } = await supabase
          .from("whatsapp_conversations")
          .insert({ phone: normalised, last_message_at: new Date().toISOString() })
          .select("id")
          .single();
        targetConvId = created?.id;
      }
    }

    // Execute tool calls if provided from the draft before sending
    if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
      console.log(`Executing ${toolCalls.length} tool calls for conversation ${targetConvId}...`);
      for (const tc of toolCalls) {
        console.log(`Executing tool from draft: ${tc.name} with input:`, tc.input);
        const toolRes = await executeTool(tc.name, tc.input ?? {}, {
          supabase,
          conversationId: targetConvId || "",
          clientPhone: targetPhone,
        });
        console.log(`Tool ${tc.name} execution result:`, toolRes);
      }
    }

    // Send via WhatsApp (template wins over text if both provided)
    const { id: waMsgId, error: waError } = await sendWhatsAppMessage(targetPhone, { text, imageUrl, template });

    // Save to DB. Use displayText (or text) for content so the admin panel
    // shows the actual body — not a generic "Plantilla" placeholder.
    if (targetConvId) {
      const savedContent =
        displayText ||
        text ||
        (template ? `📋 ${template.name || "Plantilla"} enviada` : null) ||
        (imageUrl ? "Imagen" : "Mensaje");

      await supabase.from("whatsapp_messages").insert({
        conversation_id: targetConvId,
        direction: "outbound",
        role: "system",
        content: savedContent,
        whatsapp_message_id: waMsgId,
        status: waMsgId ? "sent" : "failed",
      });

      // Update last_message_at so the conversation list shows the correct
      // "hace X" time.  Also un-archive if this was in the "Gestionadas"
      // folder — sending a message means it's active again.
      await supabase
        .from("whatsapp_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          archived_at: null,
        })
        .eq("id", targetConvId);
    }

    return new Response(
      JSON.stringify({ success: !!waMsgId, whatsappMessageId: waMsgId, error: waError }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Outbound error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
