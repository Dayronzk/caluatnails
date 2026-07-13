// Soft follow-up nudge for stalled WhatsApp conversations.
//
// Called by pg_cron every 10 minutes. Finds conversations where the bot was
// the last to speak between 15-45 min ago, the customer didn't reply, no
// booking happened, and we haven't nudged them recently. Sends one short
// friendly message via whatsapp-outbound and stamps last_followup_at.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Conversations where bot was last to speak between 15-45 min ago, not
  // escalated to human, no recent nudge.
  const { data: candidates, error } = await supabase.rpc("get_stalled_whatsapp_convs");
  if (error) {
    console.error("RPC error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const conv of (candidates ?? []) as Array<{ id: string; phone: string; client_name: string | null }>) {
    const firstName = (conv.client_name || "").split(" ")[0];
    const greeting = firstName ? `, ${firstName}` : "";
    const text = `¿Sigues por aquí${greeting}? 💕 Si quieres que avancemos con la cita, me dices y te ayudo.`;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/whatsapp-outbound`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ conversationId: conv.id, text }),
      });
      const result = await res.json();
      if (result.success) {
        sent++;
        await supabase
          .from("whatsapp_conversations")
          .update({ last_followup_at: new Date().toISOString() })
          .eq("id", conv.id);
      } else {
        errors.push(`${conv.phone}: ${result.error}`);
        // Also stamp last_followup_at so we don't retry immediately on transient errors
        await supabase
          .from("whatsapp_conversations")
          .update({ last_followup_at: new Date().toISOString() })
          .eq("id", conv.id);
      }
    } catch (e) {
      errors.push(`${conv.phone}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return new Response(JSON.stringify({ candidates: (candidates ?? []).length, sent, errors }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
