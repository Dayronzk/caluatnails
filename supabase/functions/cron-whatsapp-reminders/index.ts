// WhatsApp booking reminders — sends a message to the client via WhatsApp:
//   - 24 hours before the appointment
//   - 30 minutes before the appointment
//
// Called by pg_cron every 5 minutes. Uses approved Meta templates when
// outside the 24h customer-service window (which is almost always the
// case for the 24h-before reminder), and falls back to plain text if
// the client has an open conversation window.
//
// Duplicates are prevented via notification_logs — one entry per
// (booking_id, notification_type) pair.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Template names — must match approved templates in Meta Business Manager.
// If you haven't created them yet, the function falls back to plain text
// (which only works inside the 24h window).
const TEMPLATE_24H = Deno.env.get("WA_TEMPLATE_REMINDER_24H") || "recordatorio_cita_24h";
const TEMPLATE_30M = Deno.env.get("WA_TEMPLATE_REMINDER_30M") || "recordatorio_cita_30min";
const TEMPLATE_LANG = "es";

interface BookingCandidate {
  id: string;
  client_name: string;
  client_phone: string;
  booking_date: string;
  booking_time: string;
  professional_name: string | null;
  services: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // ── Gather candidates ─────────────────────────────────────────────
  const { data: candidates, error } = await supabase.rpc(
    "get_wa_reminder_candidates"
  );
  if (error) {
    console.error("RPC error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const c of (candidates ?? []) as (BookingCandidate & {
    reminder_type: "wa_reminder_24h" | "wa_reminder_30min";
  })[]) {
    const phone = c.client_phone.replace(/\D/g, "");
    const firstName = (c.client_name || "").split(" ")[0].trim();
    const proName = c.professional_name || "el equipo CALUATNAILS";

    // ── Resolve conversation (if any) to send via whatsapp-outbound ──
    const last9 = phone.slice(-9);
    const { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("id, last_message_at")
      .ilike("phone", `%${last9}`)
      .maybeSingle();

    // ── Check if we're inside the 24h customer-service window ──────
    let insideWindow = false;
    if (conv) {
      const { data: lastInbound } = await supabase
        .from("whatsapp_messages")
        .select("created_at")
        .eq("conversation_id", conv.id)
        .eq("direction", "inbound")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastInbound) {
        const elapsed = Date.now() - new Date(lastInbound.created_at).getTime();
        insideWindow = elapsed < 24 * 3600 * 1000;
      }
    }

    // ── Build payload ───────────────────────────────────────────────
    const is24h = c.reminder_type === "wa_reminder_24h";

    // Format date nicely: "jueves 22 de mayo"
    const dateObj = new Date(c.booking_date + "T00:00:00");
    const dayName = dateObj.toLocaleDateString("es-ES", { weekday: "long" });
    const dayNum = dateObj.getDate();
    const monthName = dateObj.toLocaleDateString("es-ES", { month: "long" });
    const prettyDate = `${dayName} ${dayNum} de ${monthName}`;

    // Clean time: "10:30" (remove seconds if present)
    const prettyTime = c.booking_time.slice(0, 5);

    // Plain-text fallback (only works inside 24h window)
    const plainText = is24h
      ? `Hola ${firstName || ""}! Te recordamos que tienes cita manana ${prettyDate} a las ${prettyTime} con ${proName}. Si necesitas cambiar algo, me escribes y te ayudo.`.trim()
      : `Hola ${firstName || ""}! Tu cita con ${proName} es en 30 minutos (${prettyTime}). Te esperamos en el salon!`.trim();

    // Template payload (works outside 24h window)
    // Variables: {{1}} = firstName, {{2}} = date, {{3}} = time, {{4}} = professional
    const templatePayload = {
      name: is24h ? TEMPLATE_24H : TEMPLATE_30M,
      language: { code: TEMPLATE_LANG },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: firstName || "cliente" },
            { type: "text", text: prettyDate },
            { type: "text", text: prettyTime },
            { type: "text", text: proName },
          ],
        },
      ],
    };

    // ── Send ────────────────────────────────────────────────────────
    try {
      // If we have a conversation & are inside the window → plain text.
      // Otherwise → template (works regardless of window state).
      const body: Record<string, unknown> = {};
      if (conv) {
        body.conversationId = conv.id;
      } else {
        body.to = phone;
      }

      if (insideWindow) {
        body.text = plainText;
      } else {
        body.template = templatePayload;
        // Also send a displayText so whatsapp-outbound stores the readable
        // body in whatsapp_messages.content (instead of a generic "Plantilla"
        // placeholder). Meta still receives the template; this is purely for
        // the admin panel to show the real reminder text.
        body.displayText = plainText;
      }

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/whatsapp-outbound`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify(body),
        }
      );
      const result = await res.json();

      if (result.success) {
        sent++;
      } else {
        // If template failed (maybe not approved yet), try plain text as fallback
        // only if inside the window
        if (!insideWindow && result.error) {
          console.warn(
            `Template ${is24h ? TEMPLATE_24H : TEMPLATE_30M} failed for ${phone}: ${result.error}. Trying plain text...`
          );
          if (conv) {
            // Even outside window, try plain text — it will fail gracefully
            // with a clear error if Meta rejects it
            const fallbackRes = await fetch(
              `${SUPABASE_URL}/functions/v1/whatsapp-outbound`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  conversationId: conv.id,
                  text: plainText,
                }),
              }
            );
            const fallbackResult = await fallbackRes.json();
            if (fallbackResult.success) {
              sent++;
            } else {
              errors.push(
                `${phone} (${c.reminder_type}): template failed + plain text failed: ${fallbackResult.error}`
              );
            }
          } else {
            errors.push(
              `${phone} (${c.reminder_type}): ${result.error} (no conversation, can't fallback to plain text)`
            );
          }
        } else {
          errors.push(
            `${phone} (${c.reminder_type}): ${result.error}`
          );
        }
      }

      // ── Log to notification_logs (prevent duplicates on next run) ──
      await supabase.from("notification_logs").insert({
        booking_id: c.id,
        channel: "whatsapp",
        notification_type: c.reminder_type,
        title: is24h
          ? "Recordatorio WhatsApp 24h"
          : "Recordatorio WhatsApp 30min",
        body: plainText.slice(0, 300),
        recipient_name: c.client_name,
        status: result.success ? "sent" : "failed",
        error_message: result.error || null,
        sent_at: new Date().toISOString(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${phone} (${c.reminder_type}): ${msg}`);
      // Still log the attempt so we don't retry
      await supabase.from("notification_logs").insert({
        booking_id: c.id,
        channel: "whatsapp",
        notification_type: c.reminder_type,
        title: is24h
          ? "Recordatorio WhatsApp 24h"
          : "Recordatorio WhatsApp 30min",
        body: plainText.slice(0, 300),
        recipient_name: c.client_name,
        status: "failed",
        error_message: msg,
        sent_at: new Date().toISOString(),
      });
    }
  }

  console.log(
    `[wa-reminders] candidates=${(candidates ?? []).length} sent=${sent} errors=${errors.length}`
  );

  return new Response(
    JSON.stringify({
      candidates: (candidates ?? []).length,
      sent,
      errors,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
