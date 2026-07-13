// WhatsApp Cloud API webhook receiver.
// - GET: Meta verification challenge.
// - POST: receives inbound messages, runs the Claude agent, sends reply.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { runAgent } from "../_shared/whatsapp-agent.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID");
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

if (!PHONE_ID || !ACCESS_TOKEN || !VERIFY_TOKEN || !ANTHROPIC_API_KEY) {
  console.error("CRITICAL ERROR: Missing required environment variables!", {
    hasPhoneId: !!PHONE_ID,
    hasAccessToken: !!ACCESS_TOKEN,
    hasVerifyToken: !!VERIFY_TOKEN,
    hasAnthropicKey: !!ANTHROPIC_API_KEY
  });
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Fire-and-forget push to staff (admins + specific professional if provided).
// Strategic moments only — never for every customer message.
async function pushToStaff(opts: {
  title: string;
  body: string;
  notification_type: string;
  professional_email?: string | null;
  conversation_id?: string;
  urgent?: boolean;
}): Promise<void> {
  // Build deep-link to the conversation in the admin panel (if we know it).
  // Admins jump straight to the customer chat by tapping the notification.
  const url = opts.conversation_id
    ? `/admin/whatsapp?conv=${opts.conversation_id}`
    : "/admin/whatsapp";

  // Group by notification_type so urgent events don't get buried under a stack
  // of similar notifications. Browser will replace previous push with same tag.
  const tag = `wa:${opts.notification_type}:${opts.conversation_id ?? "no-conv"}`;

  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        target_roles: ["admin"],
        professional_email: opts.professional_email ?? undefined,
        title: opts.title,
        body: opts.body,
        notification_type: opts.notification_type,
        url,
        urgent: !!opts.urgent,
        tag,
      }),
    });
  } catch (e) {
    console.warn("pushToStaff failed (non-fatal):", e);
  }
}

// Arrival signals that should ping the staff so nobody is left waiting at
// the door (Wendy was lost because she asked 'qué piso es' and nobody saw it).
const ARRIVAL_REGEX = /^(estoy aqu[ií]|ya llegu[eé]|ya estoy|estoy abajo|estoy en la puerta|hemos llegado|estamos abajo|ya vine|aqu[ií] estoy|en la puerta)/i;

// Booking-management intent signals (admin should glance even if bot handles it).
const CANCEL_REGEX = /(quiero cancelar|cancelar mi cita|no podr[eé] ir|no voy a (poder )?ir|necesito cancelar|cancela)/i;
const RESCHEDULE_REGEX = /(cambiar (mi )?cita|reagendar|mover (mi )?cita|no puedo ese (d[ií]a|hora)|cambiar la fecha|cambiar la hora|adelantar|posponer)/i;

async function sendWhatsAppMessage(to: string, text: string): Promise<string | null> {
  const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("WhatsApp API Error:", {
      status: res.status,
      statusText: res.statusText,
      body: errorText
    });
    return null;
  }
  const data = await res.json();
  return data.messages?.[0]?.id ?? null;
}

async function getOrCreateConversation(rawPhone: string): Promise<{ id: string; needs_human: boolean; client_name?: string | null; last_message_at?: string | null } | null> {
  // Normalize to E.164 (always include leading +). Meta sometimes sends "34..." and
  // our DB has "+34...". Without this normalisation the lookup fails, a duplicate
  // insert is attempted, and the message is lost.
  const phone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;

  // Match both formats just in case (legacy rows might exist without +)
  const { data: existing, error: findError } = await supabase
    .from("whatsapp_conversations")
    .select("id, needs_human, client_name, last_message_at")
    .or(`phone.eq.${phone},phone.eq.${phone.replace("+", "")}`)
    .maybeSingle();
  
  if (findError) {
    console.error("Error finding conversation:", findError);
  }
  // Helper: resolve the best-known name+email for a phone, looking in both
  // client_accounts AND bookings (most recent). This means a customer who
  // ever booked online — even before they ever wrote to WhatsApp — shows up
  // in the admin panel with their real name on first message.
  const resolveContact = async (phoneE164: string) => {
    const last9 = phoneE164.slice(-9);
    const { data: account } = await supabase
      .from("client_accounts")
      .select("id, name, email")
      .ilike("phone", `%${last9}`)
      .maybeSingle();
    if (account && account.name && account.name.trim() !== "") {
      return { account_id: account.id, name: account.name, email: account.email };
    }
    // Fall back to the most recent booking with a name for this phone
    const { data: booking } = await supabase
      .from("bookings")
      .select("client_name, client_email")
      .ilike("client_phone", `%${last9}`)
      .not("client_name", "is", null)
      .neq("client_name", "")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return {
      account_id: account?.id ?? null,
      name: booking?.client_name?.trim() || account?.name || null,
      email: booking?.client_email || account?.email || null,
    };
  };

  if (existing) {
    // If we have an existing conv but no name, try to update it now
    if (!existing.client_name) {
      const contact = await resolveContact(phone);
      if (contact.name) {
        await supabase
          .from("whatsapp_conversations")
          .update({
            client_account_id: contact.account_id,
            client_name: contact.name,
            client_email: contact.email,
          })
          .eq("id", existing.id);
        existing.client_name = contact.name;
      }
    }
    // Auto-UNARCHIVE: every new inbound message brings the conversation back
    // to the active list (mirrors WhatsApp's behaviour). Admin moves things
    // to "Gestionadas" → client writes again → it pops back out.
    await supabase
      .from("whatsapp_conversations")
      .update({ archived_at: null })
      .eq("id", existing.id)
      .not("archived_at", "is", null);
    return existing;
  }

  // New conversation: resolve name+email from accounts/bookings before insert
  const contact = await resolveContact(phone);

  const { data: created, error: insertError } = await supabase
    .from("whatsapp_conversations")
    .insert({
      phone,
      client_account_id: contact.account_id,
      client_name: contact.name,
      client_email: contact.email,
    })
    .select("id, needs_human, last_message_at")
    .single();

  if (insertError) {
    console.error("Error creating conversation:", insertError);
    return null;
  }
  
  return created;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── GET: Meta webhook verification ──
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── POST: incoming message ──
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await req.json();
    console.log("Incoming WhatsApp Webhook Payload:", JSON.stringify(body, null, 2));

    // Debug: log EVERY webhook POST to notification_logs so we can verify Meta is
    // actually delivering customer messages (and not just test events).
    try {
      await supabase.from("notification_logs").insert({
        channel: "whatsapp",
        notification_type: "webhook_inbound_raw",
        title: "Webhook recibido de Meta",
        body: JSON.stringify(body).slice(0, 1500),
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.warn("Failed to log raw webhook:", logErr);
    }

    // WhatsApp wraps messages in entry[].changes[].value.messages[]
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages ?? [];
    const statuses = value?.statuses ?? [];

    // ── Handle Status Updates ──
    for (const status of statuses) {
      const waMsgId = status.id;
      const newStatus = status.status; // delivered, read, failed
      if (waMsgId && newStatus) {
        await supabase
          .from("whatsapp_messages")
          .update({ status: newStatus })
          .eq("whatsapp_message_id", waMsgId);
      }
    }

    // ── Handle Incoming Messages ──
    if (messages.length > 0) {
      // Check if bot is enabled
      const { data: config } = await supabase
        .from("whatsapp_bot_config")
        .select("*")
        .eq("id", "main")
        .single();

      for (const msg of messages) {
        // Only handle text messages for now
        if (msg.type !== "text") {
          await sendWhatsAppMessage(
            msg.from,
            "Por ahora solo entiendo mensajes de texto 🙏 ¿Podrías escribirme lo que necesitas?",
          );
          continue;
        }

        const phone = msg.from as string;
        const text = msg.text.body as string;

        // Get/create conversation
        let conv = await getOrCreateConversation(phone);
        if (!conv) {
          console.error(`Could not get or create conversation for phone: ${phone}`);
          continue;
        }

        // Check for session timeout (reset if too old)
        const lastMsg = conv.last_message_at ? new Date(conv.last_message_at).getTime() : 0;
        const now = Date.now();
        const timeoutMs = (config?.session_timeout_hours || 24) * 60 * 60 * 1000;
        
        if (lastMsg > 0 && (now - lastMsg) > timeoutMs) {
          console.log(`Session timeout for ${phone}. Resetting conversation state.`);
          await supabase
            .from("whatsapp_conversations")
            .update({ state: {}, needs_human: false })
            .eq("id", conv.id);
          // Refresh local conv object
          conv.needs_human = false;
        }

        // ── Always bump last_message_at so the admin panel shows the correct
        // "hace X" time for every inbound message.  This runs for all code
        // paths (bot reply, human escalation, frustration, bot-disabled).
        await supabase
          .from("whatsapp_conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conv.id);

        // If escalated to human OR bot is disabled, don't bot-reply (just log)
        if (conv.needs_human || !config?.enabled) {
          await supabase.from("whatsapp_messages").insert({
            conversation_id: conv.id,
            direction: "inbound",
            role: "user",
            content: text,
          });
          continue;
        }

        // Frustration / abandonment detection — escalate immediately when
        // the customer signals she's leaving or unhappy. The bot is not
        // going to recover this gracefully, a human needs to step in.
        const frustrationRegex = /(me voy|me marcho|me piro|me largo|no me responde|no me responden|no me contestas|vine de (muy )?lejos|esto es un desastre|que desorden|qué desorden|una verguenza|una vergüenza|déjalo|dejalo|olvídalo|olvidalo|no quiero|ya no quiero|me arrepiento|no me da tono|no me contestaste)/i;
        if (frustrationRegex.test(text)) {
          console.log(`🚨 [webhook] Frustration detected from ${phone}: "${text.slice(0, 80)}"`);
          await supabase.from("whatsapp_messages").insert({
            conversation_id: conv.id,
            direction: "inbound",
            role: "user",
            content: text,
          });
          await supabase
            .from("whatsapp_conversations")
            .update({
              needs_human: true,
              human_note: `Frustración detectada: "${text.slice(0, 120)}"`,
            })
            .eq("id", conv.id);
          // Log so it appears in /admin/notificaciones
          try {
            await supabase.from("notification_logs").insert({
              channel: "whatsapp",
              notification_type: "frustration_escalation",
              title: "Cliente frustrada — atención humana",
              body: `${phone}: "${text.slice(0, 200)}"`,
              recipient_name: phone,
              status: "failed",
              error_message: "Escalado automático por frase de frustración.",
              sent_at: new Date().toISOString(),
            });
          } catch { /* best effort */ }
          // Soft reply telling the customer we're passing her to a human
          const handoff =
            "Te paso con el equipo del salón ahora mismo, te responden enseguida 🙏";
          const waId = await sendWhatsAppMessage(phone, handoff);
          await supabase.from("whatsapp_messages").insert({
            conversation_id: conv.id,
            direction: "outbound",
            role: "assistant",
            content: handoff,
            whatsapp_message_id: waId || null,
            status: waId ? "sent" : "failed",
          });
          // Push to staff so they pick up the manual handoff fast
          pushToStaff({
            title: "🚨 Cliente frustrada en WhatsApp",
            body: `${conv.client_name || phone}: "${text.slice(0, 100)}"`,
            notification_type: "wa_frustration",
            conversation_id: conv.id,
            urgent: true, // 🚨 Hay que intervenir manualmente
          });
          continue;
        }

        // ── Strategic push triggers — fire BEFORE running the bot so the
        // staff are alerted in real time even while the bot is still typing.
        // These DO NOT block the bot flow; bot continues normally.

        // 1. Customer has arrived at the salon ("estoy aquí", "ya llegué"…)
        if (ARRIVAL_REGEX.test(text.trim())) {
          // Find today's booking for this phone to know the professional
          const last9 = phone.replace(/\D/g, "").slice(-9);
          const today = new Date().toISOString().slice(0, 10);
          const { data: todaysBooking } = await supabase
            .from("bookings")
            .select("professional_id, booking_time, profiles:professional_id(email,name)")
            .ilike("client_phone", `%${last9}`)
            .eq("booking_date", today)
            .neq("status", "cancelled")
            .order("booking_time", { ascending: true })
            .limit(1)
            .maybeSingle();
          const proEmail = (todaysBooking?.profiles as { email?: string } | null)?.email ?? null;
          const proName = (todaysBooking?.profiles as { name?: string } | null)?.name ?? "el equipo";
          pushToStaff({
            title: "📍 Cliente en el salón AHORA",
            body: `${conv.client_name || phone} dice: "${text.slice(0, 80)}"${todaysBooking ? ` · cita ${todaysBooking.booking_time} con ${proName}` : ""}`,
            notification_type: "wa_arrival",
            professional_email: proEmail,
            conversation_id: conv.id,
            urgent: true, // 🚨 No la entierres bajo otras notificaciones
          });
        }

        // 2. Cancellation intent
        if (CANCEL_REGEX.test(text)) {
          pushToStaff({
            title: "❌ Posible cancelación de cita",
            body: `${conv.client_name || phone}: "${text.slice(0, 100)}"`,
            notification_type: "wa_cancel_intent",
            conversation_id: conv.id,
          });
        }

        // 3. Reschedule intent
        if (RESCHEDULE_REGEX.test(text)) {
          pushToStaff({
            title: "🔁 Cliente quiere reagendar",
            body: `${conv.client_name || phone}: "${text.slice(0, 100)}"`,
            notification_type: "wa_reschedule_intent",
            conversation_id: conv.id,
          });
        }

        // Run Claude agent (catches its own errors, returns string)
        let reply = "";
        let agentFailed = false;
        try {
          reply = await runAgent(supabase, conv.id, phone, text, ANTHROPIC_API_KEY!, config);
        } catch (agentErr) {
          console.error("runAgent threw:", agentErr);
          agentFailed = true;
          reply = "Disculpa, tengo un problema técnico ahora mismo. Te respondo en cuanto se solucione 🙏";
        }

        // Send reply via WhatsApp
        const waMsgId = await sendWhatsAppMessage(phone, reply);

        // If send failed OR agent failed, mark conversation as needing human
        // attention so the salon team picks it up and the client doesn't sit
        // in silence. We also drop a log entry into notification_logs so the
        // admin /admin/notificaciones page surfaces the breakage.
        if (!waMsgId || agentFailed) {
          const reason = !waMsgId
            ? "WhatsApp API rechazó el envío (probable token caducado u otra restricción)."
            : "Fallo interno en el agente (Claude / herramientas).";

          await supabase
            .from("whatsapp_conversations")
            .update({
              needs_human: true,
              human_note: reason,
            })
            .eq("id", conv.id);

          // Best-effort log so admins see this in /admin/notificaciones
          try {
            await supabase.from("notification_logs").insert({
              channel: "whatsapp",
              notification_type: "bot_reply_failed",
              title: "Bot no pudo responder al cliente",
              body: `Cliente ${phone}: "${text.slice(0, 80)}"`,
              recipient_email: null,
              recipient_name: phone,
              status: "failed",
              error_message: reason,
              sent_at: new Date().toISOString(),
            });
          } catch { /* ignore */ }

          // 🚨 Push urgent al admin: el cliente está esperando, no se le ha respondido.
          pushToStaff({
            title: "🚨 Bot caído — cliente esperando",
            body: `${conv.client_name || phone}: "${text.slice(0, 100)}"`,
            notification_type: "bot_reply_failed",
            conversation_id: conv.id,
            urgent: true,
          });
        }

        // Update last assistant message in DB with WhatsApp ID + status.
        // If runAgent failed before saving the assistant turn, this update
        // is a no-op (no row matches) which is fine.
        const { data: lastAssistantMsg } = await supabase
          .from("whatsapp_messages")
          .select("id")
          .eq("conversation_id", conv.id)
          .eq("role", "assistant")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastAssistantMsg) {
          await supabase
            .from("whatsapp_messages")
            .update({
              whatsapp_message_id: waMsgId || null,
              status: waMsgId ? "sent" : "failed",
            })
            .eq("id", lastAssistantMsg.id);
        }
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500 });
  }
});
