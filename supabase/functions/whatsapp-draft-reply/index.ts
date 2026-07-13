// Draft a suggested bot reply for a HUMAN agent.
//
// Called from the admin panel when a conversation is in manual mode and the
// admin presses "Sugerir con bot". It runs the agent in draft mode:
//   • no tools (no bookings / availability checks)
//   • no DB writes, no needs_human changes, no WhatsApp send
// It just returns suggested text the admin can review, edit and send manually.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { draftReply } from "../_shared/whatsapp-agent.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { conversationId } = await req.json();
    if (!conversationId) throw new Error("conversationId is required");

    const { data: config } = await supabase
      .from("whatsapp_bot_config")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    const { text, toolCalls, provider } = await draftReply(
      supabase,
      conversationId,
      ANTHROPIC_API_KEY,
      config,
    );

    return new Response(
      JSON.stringify({ success: true, text, toolCalls, provider }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("draft-reply error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
