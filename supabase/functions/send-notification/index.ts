import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

// Delegate all email sending to resend-email function
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

interface NotificationPayload {
  channels: string[];
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  bookingDate: string;
  bookingTime: string;
  services: string[];
  totalPrice: number;
  depositAmount: number;
  depositPaid: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as NotificationPayload;
    const results: Record<string, unknown> = {};

    if (payload.channels.includes("whatsapp")) {
      results.whatsapp = { status: "handled_client_side" };
    }

    if (payload.channels.includes("push")) {
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
      const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
      
      console.log(`📡 [send-notification] Delegating push reminder for ${payload.clientEmail}...`);
      
      // Get the client account ID to find their push subscriptions
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { data: client } = await supabaseAdmin
        .from("client_accounts")
        .select("id")
        .eq("email", payload.clientEmail)
        .maybeSingle();

      if (client) {
        const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
          },
          body: JSON.stringify({
            _send_all: false,
            endpoint: "", // Not used when searching by client email (need to fix send-push to support client_account_id)
            client_account_id: client.id,
            title: "Recordatorio de Cita 💅",
            body: `Hola ${payload.clientName}, te recordamos tu cita para el ${payload.bookingDate} a las ${payload.bookingTime}.`
          }),
        });
        results.push = await pushRes.json();
      }
    }

    if (payload.channels.includes("email")) {
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
      const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
      
      // Delegate to resend-email function with proper auth headers
      console.log(`📡 [send-notification] Delegating email reminder for ${payload.clientEmail}... (KeyLength: ${serviceRoleKey.length})`);
      const emailRes = await fetch(`${supabaseUrl}/functions/v1/resend-email`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
        },
        body: JSON.stringify({
          type: "booking_reminder",
          to: { email: payload.clientEmail, name: payload.clientName },
          data: {
            clientName: payload.clientName,
            bookingDate: payload.bookingDate,
            bookingTime: payload.bookingTime,
            services: payload.services,
            totalPrice: payload.totalPrice,
            depositAmount: payload.depositAmount,
            depositPaid: payload.depositPaid,
          },
        }),
      });

      const emailData = await emailRes.json() as { success: boolean; error?: string; details?: any };
      results.email = emailData;

      if (!emailRes.ok || !emailData.success) {
        const errMsg = emailData.error || `HTTP ${emailRes.status}`;
        console.error(`❌ [send-notification] email delegation failed:`, errMsg);
        throw new Error(errMsg);
      }
      console.log(`✅ [send-notification] email delegation successful for ${payload.clientEmail}`);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Notification error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
