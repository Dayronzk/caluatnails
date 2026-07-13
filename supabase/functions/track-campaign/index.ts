import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const logId = url.searchParams.get("logId");
  const type = url.searchParams.get("type"); // 'open' or 'click'
  const targetUrl = url.searchParams.get("url");

  if (!logId) return new Response("Missing logId", { status: 400 });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 1. Get campaign and log info
    const { data: log } = await supabaseClient
      .from("campaign_logs")
      .select("campaign_id, opened_at, clicked_at")
      .eq("id", logId)
      .single();

    if (log) {
      if (type === "open" && !log.opened_at) {
        await supabaseClient.from("campaign_logs").update({ opened_at: new Date().toISOString() }).eq("id", logId);
        await supabaseClient.rpc("increment_campaign_stat", { campaign_row_id: log.campaign_id, stat_column: "opened_count" });
      } 
      else if (type === "click" && !log.clicked_at) {
        await supabaseClient.from("campaign_logs").update({ clicked_at: new Date().toISOString() }).eq("id", logId);
        await supabaseClient.rpc("increment_campaign_stat", { campaign_row_id: log.campaign_id, stat_column: "clicked_count" });
      }
    }

    if (type === "open") {
      // Return 1x1 transparent pixel
      const pixel = b64ToUint8Array("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
      return new Response(pixel, { headers: { "Content-Type": "image/gif" } });
    } else {
      // Redirect to target URL
      return Response.redirect(targetUrl || "https://nailox.com", 302);
    }

  } catch (err) {
    console.error("Tracking error:", err);
    return new Response("OK");
  }
});

function b64ToUint8Array(b64: string) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
