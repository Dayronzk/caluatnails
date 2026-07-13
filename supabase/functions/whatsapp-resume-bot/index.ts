// Resume the bot after human intervention.
//
// Called from the admin panel when "Devolver al bot" is pressed.
// 1) Clears needs_human flag
// 2) Finds the last inbound (client) message
// 3) Runs the Claude agent with full conversation context
// 4) Sends the reply via WhatsApp
//
// The agent sees the entire history — including admin "system" messages —
// so it knows what was already discussed and picks up naturally.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { runAgent } from "../_shared/whatsapp-agent.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID")!;
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;

async function sendWhatsApp(to: string, text: string): Promise<string | null> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
    {
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
    }
  );
  if (!res.ok) {
    console.error("WhatsApp send error:", await res.text());
    return null;
  }
  const data = await res.json();
  return data.messages?.[0]?.id ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { conversationId } = await req.json();
    if (!conversationId) throw new Error("conversationId is required");

    // ── 1. Load conversation ────────────────────────────────────────
    const { data: conv, error: convErr } = await supabase
      .from("whatsapp_conversations")
      .select("id, phone, client_name, needs_human")
      .eq("id", conversationId)
      .single();

    if (convErr || !conv) throw new Error("Conversation not found");

    // ── 2. Clear needs_human ────────────────────────────────────────
    await supabase
      .from("whatsapp_conversations")
      .update({ needs_human: false, human_note: null })
      .eq("id", conversationId);

    // ── 3. Find the last INBOUND message from the client ────────────
    const { data: lastInbound } = await supabase
      .from("whatsapp_messages")
      .select("content")
      .eq("conversation_id", conversationId)
      .eq("direction", "inbound")
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastInbound?.content) {
      return new Response(
        JSON.stringify({
          success: true,
          note: "No inbound message found — bot resumed but no reply sent.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 4. Load bot config ──────────────────────────────────────────
    const { data: config } = await supabase
      .from("whatsapp_bot_config")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    if (!config?.enabled) {
      return new Response(
        JSON.stringify({
          success: true,
          note: "Bot is disabled — needs_human cleared but no reply sent.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 5. Run Claude agent (skipSaveInbound = true) ────────────────
    let reply = "";
    let agentFailed = false;
    try {
      reply = await runAgent(
        supabase,
        conversationId,
        conv.phone,
        lastInbound.content,
        ANTHROPIC_API_KEY,
        config,
        true // skipSaveInbound — message is already in the DB
      );
    } catch (err) {
      console.error("runAgent threw:", err);
      agentFailed = true;
      reply =
        "Disculpa, tengo un problema técnico ahora mismo. Te respondo en cuanto se solucione 🙏";
    }

    // ── 6. Send reply via WhatsApp ──────────────────────────────────
    const waMsgId = await sendWhatsApp(conv.phone, reply);

    // If send failed, re-escalate
    if (!waMsgId || agentFailed) {
      const reason = !waMsgId
        ? "WhatsApp API rechazó el envío al resumir bot."
        : "Fallo interno del agente al resumir bot.";

      await supabase
        .from("whatsapp_conversations")
        .update({ needs_human: true, human_note: reason })
        .eq("id", conversationId);

      return new Response(
        JSON.stringify({ success: false, error: reason }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 7. Update last assistant message with WhatsApp ID ───────────
    const { data: lastMsg } = await supabase
      .from("whatsapp_messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastMsg) {
      await supabase
        .from("whatsapp_messages")
        .update({
          whatsapp_message_id: waMsgId,
          status: "sent",
        })
        .eq("id", lastMsg.id);
    }

    // Update last_message_at
    await supabase
      .from("whatsapp_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return new Response(
      JSON.stringify({ success: true, reply, whatsappMessageId: waMsgId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Resume-bot error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
