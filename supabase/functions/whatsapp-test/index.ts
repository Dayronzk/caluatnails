// Local test endpoint to chat with the bot without needing WhatsApp Cloud API.
// POST { phone: "+34600000000", message: "Hola" } → returns the bot's reply.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { runAgent } from "../_shared/whatsapp-agent.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  const { phone, message } = await req.json();
  if (!phone || !message) {
    return new Response(JSON.stringify({ error: "phone and message required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get/create conversation
  const { data: existing } = await supabase
    .from("whatsapp_conversations")
    .select("id, needs_human")
    .eq("phone", phone)
    .maybeSingle();

  let convId: string;
  if (existing) {
    convId = existing.id;
    if (existing.needs_human) {
      return new Response(
        JSON.stringify({ reply: "[Conversación escalada a humano - el bot no responde]" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } else {
    const { data: created } = await supabase
      .from("whatsapp_conversations")
      .insert({ phone })
      .select("id")
      .single();
    convId = created!.id;
  }

  const reply = await runAgent(supabase, convId, phone, message, ANTHROPIC_API_KEY);

  return new Response(JSON.stringify({ reply, conversation_id: convId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
