import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE";
const GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET_HERE";
const REDIRECT_URI = "https://expbduyqklpnnkyoapvi.supabase.co/functions/v1/google-calendar-auth";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

// After OAuth, redirect to this page so the popup closes and parent detects it
const SUCCESS_HTML = `<!DOCTYPE html>
<html>
<head><title>Conectado</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;">
  <div style="text-align:center;padding:2rem;">
    <div style="width:64px;height:64px;background:#ecfdf5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
    <h2 style="color:#111827;margin:0 0 0.5rem;">¡Google Calendar conectado!</h2>
    <p style="color:#6b7280;margin:0 0 1.5rem;">Esta ventana se cerrará automáticamente.</p>
    <script>setTimeout(() => window.close(), 1500);</script>
  </div>
</body>
</html>`;

const ERROR_HTML = (msg: string) => `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;">
  <div style="text-align:center;padding:2rem;">
    <div style="width:64px;height:64px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </div>
    <h2 style="color:#111827;margin:0 0 0.5rem;">Error al conectar</h2>
    <p style="color:#6b7280;margin:0 0 1.5rem;max-width:300px;">${msg}</p>
    <button onclick="window.close()" style="padding:0.5rem 1.5rem;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;">Cerrar</button>
  </div>
</body>
</html>`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // profile_id

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Generate OAuth URL
  if (action === "authorize" && req.method === "POST") {
    const body = await req.json();
    const profileId = body.profileId;

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", profileId);

    return new Response(JSON.stringify({ url: authUrl.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Step 2: Handle OAuth callback (Google redirects here with ?code=...)
  if (code && state) {
    const profileId = state;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return new Response(ERROR_HTML(errText), {
        headers: { "Content-Type": "text/html" },
      });
    }

    const tokens = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Upsert token in DB
    const { error: upsertErr } = await supabase
      .from("google_calendar_tokens")
      .upsert({
        profile_id: profileId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || "",
        token_expiry: expiry,
        calendar_id: "primary",
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });

    if (upsertErr) {
      return new Response(ERROR_HTML(upsertErr.message), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Also update professional_settings to mark as connected
    await supabase
      .from("professional_settings")
      .update({ google_calendar_connected: true, updated_at: new Date().toISOString() })
      .eq("profile_id", profileId);

    // Return success HTML that auto-closes the popup
    return new Response(SUCCESS_HTML, {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Step 3: Disconnect Google Calendar
  if (action === "disconnect" && req.method === "POST") {
    const body = await req.json();
    const profileId = body.profileId;

    // Get current token to revoke it
    const { data: tokenRow } = await supabase
      .from("google_calendar_tokens")
      .select("access_token")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (tokenRow?.access_token) {
      // Revoke token with Google
      await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenRow.access_token}`, {
        method: "POST",
      });
    }

    // Delete from DB
    await supabase
      .from("google_calendar_tokens")
      .delete()
      .eq("profile_id", profileId);

    // Update professional_settings
    await supabase
      .from("professional_settings")
      .update({ google_calendar_connected: false, updated_at: new Date().toISOString() })
      .eq("profile_id", profileId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid request" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
