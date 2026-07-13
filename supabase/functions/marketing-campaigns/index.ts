import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getEmailHtml = (name: string, content: string, imageUrl?: string, subject?: string, logId?: string, baseUrl?: string) => {
  const trackingPixel = `${baseUrl}/functions/v1/track-campaign?type=open&logId=${logId}`;
  const trackingClick = `${baseUrl}/functions/v1/track-campaign?type=click&logId=${logId}&url=https://nailox.com/reservar`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .header { padding: 40px 20px; text-align: center; background: #fff; }
    .logo { font-size: 28px; font-weight: 900; color: #e11d48; text-decoration: none; }
    .hero-image { width: 100%; max-height: 400px; object-fit: cover; display: block; }
    .content { padding: 40px; color: #1f2937; line-height: 1.6; }
    .greeting { font-size: 24px; font-weight: 700; margin-bottom: 20px; }
    .button-container { text-align: center; margin-top: 30px; }
    .button { background-color: #e11d48; color: #ffffff !important; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 700; display: inline-block; }
    .footer { padding: 40px; text-align: center; font-size: 12px; color: #9ca3af; background-color: #f9fafb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><a href="https://nailox.com" class="logo">NAILOX</a></div>
    ${imageUrl ? `<img src="${imageUrl}" class="hero-image">` : ""}
    <div class="content">
      <div class="greeting">¡Hola ${name}! 💅</div>
      <div style="white-space: pre-line;">${content.replace("{{name}}", name)}</div>
      <div class="button-container">
        <a href="${trackingClick}" class="button">Reservar mi cita ahora</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2024 Nailox Barcelona. Instagram: @nailox.bcn</p>
      <img src="${trackingPixel}" width="1" height="1" style="display:none !important;">
    </div>
  </div>
</body>
</html>
`;
};

// Last 9 digits — robust match between contact phones and booking phones.
const normPhone = (p?: string | null) => (p || "").replace(/\D/g, "").slice(-9);
const firstName = (n?: string | null) => (n || "").split(" ").filter(Boolean)[0] || "";

const formatBookingDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  const dayName = d.toLocaleDateString("es-ES", { weekday: "long" });
  const dayNum = d.getDate();
  const monthName = d.toLocaleDateString("es-ES", { month: "long" });
  return `${dayName} ${dayNum} de ${monthName}`;
};

interface BookingInfo {
  lastPastDate?: string;
  next?: { date: string; time: string; proName: string };
}
type VarSource = "name" | "next_booking_date" | "last_booking_date" | "next_booking_time" | "professional" | "fixed";
interface VarConfig { source: VarSource; value?: string; fallback?: string }

// Resolve each {{n}} body parameter for one recipient. Returns null if any
// required variable ends up empty (recipient is skipped to avoid sending a
// broken template that Meta would reject).
function resolveVars(
  recipient: { name?: string },
  info: BookingInfo | undefined,
  vars: VarConfig[],
): string[] | null {
  const out: string[] = [];
  for (const v of vars) {
    let val = "";
    switch (v.source) {
      case "name": val = firstName(recipient.name); break;
      case "next_booking_date": val = formatBookingDate(info?.next?.date); break;
      case "last_booking_date": val = formatBookingDate(info?.lastPastDate); break;
      case "next_booking_time": val = info?.next?.time || ""; break;
      case "professional": val = info?.next?.proName || ""; break;
      case "fixed": val = v.value || ""; break;
    }
    if (!val) val = (v.fallback || "").trim();
    if (!val) return null;
    out.push(val);
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { campaignId } = await req.json();
    const baseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    const { data: campaign, error: cError } = await supabaseClient.from("marketing_campaigns").select("*").eq("id", campaignId).single();
    if (cError || !campaign) throw new Error("Campaign not found");

    await supabaseClient.from("marketing_campaigns").update({ status: "sending" }).eq("id", campaignId);

    // Get recipients (Logic remains same)
    let recipients = [];
    if (campaign.target_segment === "specific") {
      const { data: clients } = await supabaseClient.from("client_accounts").select("id, phone, email, name").in("id", campaign.specific_recipient_ids || []);
      const { data: students } = await supabaseClient.from("students").select("id, phone, email, name").in("id", campaign.specific_recipient_ids || []);
      recipients.push(...(clients || []).map(r => ({ ...r, type: "client" })));
      recipients.push(...(students || []).map(r => ({ ...r, type: "student" })));
    } else {
      if (campaign.target_segment === "all" || campaign.target_segment === "clients") {
        const { data: clients } = await supabaseClient.from("client_accounts").select("id, phone, email, name");
        recipients.push(...(clients || []).map(r => ({ ...r, type: "client" })));
      }
      if (campaign.target_segment === "all" || campaign.target_segment === "students") {
        const { data: students } = await supabaseClient.from("students").select("id, phone, email, name");
        recipients.push(...(students || []).map(r => ({ ...r, type: "student" })));
      }
    }

    if (campaign.type === "whatsapp" && campaign.use_24h_filter) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: active } = await supabaseClient.from("whatsapp_messages").select("customer_phone").eq("from_client", true).gt("created_at", yesterday);
      const phones = new Set(active?.map(m => m.customer_phone.replace(/\D/g, "")));
      recipients = recipients.filter(r => phones.has(r.phone?.replace(/\D/g, "")));
    }

    const seen = new Set();
    recipients = recipients.filter(r => {
      const key = campaign.type === "whatsapp" ? r.phone : r.email;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Build a per-phone booking map for recency filtering AND template
    // variable resolution. Keyed by the last 9 phone digits.
    const bookingMap = new Map<string, BookingInfo>();
    const templateVars: VarConfig[] = Array.isArray(campaign.template_variables) ? campaign.template_variables : [];
    const needBookings =
      (campaign.recency_mode && campaign.recency_mode !== "none") ||
      (campaign.type === "whatsapp" && templateVars.some(v =>
        v.source === "next_booking_date" || v.source === "last_booking_date" ||
        v.source === "next_booking_time" || v.source === "professional"));

    if (needBookings) {
      const todayISO = new Date().toISOString().slice(0, 10);
      const { data: bookings } = await supabaseClient
        .from("bookings")
        .select("client_phone, booking_date, booking_time, professional_id, status")
        .neq("status", "cancelled")
        .order("booking_date", { ascending: true });

      // Resolve professional names once.
      const proIds = [...new Set((bookings || []).map(b => b.professional_id).filter(Boolean))];
      const proName = new Map<string, string>();
      if (proIds.length) {
        const { data: pros } = await supabaseClient.from("profiles").select("id, name").in("id", proIds);
        (pros || []).forEach((p: { id: string; name: string }) => proName.set(p.id, p.name || ""));
      }

      for (const b of bookings || []) {
        const key = normPhone(b.client_phone);
        if (!key) continue;
        const info = bookingMap.get(key) || {};
        if (b.booking_date <= todayISO) {
          if (!info.lastPastDate || b.booking_date > info.lastPastDate) info.lastPastDate = b.booking_date;
        } else if (!info.next) {
          info.next = {
            date: b.booking_date,
            time: (b.booking_time || "").slice(0, 5),
            proName: b.professional_id ? (proName.get(b.professional_id) || "") : "",
          };
        }
        bookingMap.set(key, info);
      }
    }

    // Recency filter: target clients by how recently they last booked.
    if (campaign.recency_mode === "inactive" || campaign.recency_mode === "recent") {
      const days = campaign.recency_days || 30;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      recipients = recipients.filter(r => {
        const last = bookingMap.get(normPhone(r.phone))?.lastPastDate;
        const bookedRecently = !!last && last >= cutoff;
        // "inactive" = no booking in the last N days (includes never-booked).
        // "recent" = booked within the last N days.
        return campaign.recency_mode === "inactive" ? !bookedRecently : bookedRecently;
      });
    }

    await supabaseClient.from("marketing_campaigns").update({ total_targets: recipients.length }).eq("id", campaignId);

    let sentCount = 0;
    for (const recipient of recipients) {
      try {
        const { data: log } = await supabaseClient.from("campaign_logs").insert({
          campaign_id: campaignId,
          recipient_id: recipient.id,
          recipient_type: recipient.type,
          status: "pending"
        }).select().single();

        if (campaign.type === "whatsapp") {
          const cleanPhone = recipient.phone?.replace(/\D/g, "");
          if (cleanPhone) {
            const payload: any = { to: cleanPhone };
            if (campaign.meta_template_name) {
              const components: any[] = [];
              if (templateVars.length > 0) {
                const resolved = resolveVars(recipient, bookingMap.get(normPhone(recipient.phone)), templateVars);
                if (!resolved) {
                  // Missing data and no fallback — skip rather than send broken template.
                  await supabaseClient.from("campaign_logs").update({ status: "skipped" }).eq("id", log.id);
                  continue;
                }
                components.push({ type: "body", parameters: resolved.map(text => ({ type: "text", text })) });
              }
              payload.template = { name: campaign.meta_template_name, language: { code: campaign.template_language || "es" } };
              if (components.length) payload.template.components = components;
            } else {
              payload.text = campaign.content.replace("{{name}}", recipient.name || "amiga");
              if (campaign.image_url) payload.imageUrl = campaign.image_url;
            }
            await fetch(`${baseUrl}/functions/v1/whatsapp-outbound`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` }, body: JSON.stringify(payload) });
          }
        } else {
          if (recipient.email) {
            const html = getEmailHtml(recipient.name || "amiga", campaign.content, campaign.image_url, campaign.subject, log.id, baseUrl);
            await fetch(`${baseUrl}/functions/v1/resend-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
              body: JSON.stringify({ to: recipient.email, subject: campaign.subject || "Novedades de Nailox", html })
            });
          }
        }

        sentCount++;
        await supabaseClient.from("campaign_logs").update({ status: "sent" }).eq("id", log.id);
        if (sentCount % 5 === 0 || sentCount === recipients.length) {
          await supabaseClient.from("marketing_campaigns").update({ sent_count: sentCount }).eq("id", campaignId);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error:`, err);
      }
    }

    await supabaseClient.from("marketing_campaigns").update({ status: "completed", sent_count: sentCount }).eq("id", campaignId);
    return new Response(JSON.stringify({ success: true, sent: sentCount }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
