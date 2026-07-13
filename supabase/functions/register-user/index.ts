/**
 * register-user edge function
 * Creates a user via Supabase Admin API (suppressing Supabase's native email)
 * then sends the branded confirmation email via resend-email edge function.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, name, phone } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Create user via Admin API
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: false,
        user_metadata: { name: name || "", phone: phone || "" },
      }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      const errorMsg = createData?.msg || createData?.message || createData?.error_description || createData?.error || "Registration failed";
      console.error("Admin create user error details:", createData);

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg,
          rawError: createData,
        }),
        { status: createRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = createData.id;

    // ── Step 2: Insert profile row
    try {
      await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Prefer": "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          id: userId,
          email,
          name: name || "",
          phone: phone || "",
          role: "student",
        }),
      });
    } catch (profileErr) {
      console.warn("Profile insert error (non-fatal):", profileErr);
    }

    // ── Step 2b: Auto-link existing guest client_account with the same phone
    // Prevents the "duplicate account" problem: a client who booked as a guest
    // via WhatsApp and then registers ends up with two disconnected accounts.
    // We silently link and migrate their points so the experience is seamless.
    if (phone) {
      try {
        const caRes = await fetch(
          `${supabaseUrl}/rest/v1/rpc/find_client_account_by_phone`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": serviceRoleKey,
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ p_phone: phone }),
          }
        );

        if (caRes.ok) {
          const caData = await caRes.json();
          // Only link if found and not already linked to another profile
          if (caData && caData.id && caData.auth_user_id === null) {
            const caId: string = caData.id;
            const caPoints = Number(caData.points ?? 0);

            // 1. Link the client_account to the new profile
            await fetch(`${supabaseUrl}/rest/v1/client_accounts?id=eq.${caId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "apikey": serviceRoleKey,
                "Authorization": `Bearer ${serviceRoleKey}`,
                "Prefer": "return=minimal",
              },
              body: JSON.stringify({ auth_user_id: userId }),
            });

            // 2. Transfer accumulated points from client_account → profile
            if (caPoints > 0) {
              // Credit profile via RPC (handles the UPDATE atomically)
              await fetch(`${supabaseUrl}/rest/v1/rpc/increment_profile_points`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": serviceRoleKey,
                  "Authorization": `Bearer ${serviceRoleKey}`,
                },
                body: JSON.stringify({ p_user_id: userId, p_points: caPoints }),
              });

              // Log credit on profile transaction history
              await fetch(`${supabaseUrl}/rest/v1/points_transactions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": serviceRoleKey,
                  "Authorization": `Bearer ${serviceRoleKey}`,
                  "Prefer": "return=minimal",
                },
                body: JSON.stringify({
                  user_id: userId,
                  points: caPoints,
                  type: "earned",
                  description: "Puntos transferidos desde cuenta de invitado al registrarse",
                  reference_id: caId,
                }),
              });

              // Zero out client_account points
              await fetch(`${supabaseUrl}/rest/v1/client_accounts?id=eq.${caId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": serviceRoleKey,
                  "Authorization": `Bearer ${serviceRoleKey}`,
                  "Prefer": "return=minimal",
                },
                body: JSON.stringify({ points: 0 }),
              });

              // Log debit on client_account history
              await fetch(`${supabaseUrl}/rest/v1/client_points_transactions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": serviceRoleKey,
                  "Authorization": `Bearer ${serviceRoleKey}`,
                  "Prefer": "return=minimal",
                },
                body: JSON.stringify({
                  client_account_id: caId,
                  points: -caPoints,
                  type: "redeemed",
                  description: "Puntos transferidos a cuenta registrada al crear perfil",
                  reference_id: userId,
                }),
              });
            }

            console.log(
              `Auto-linked client_account ${caId} → profile ${userId} (${caPoints} pts transferred)`
            );
          }
        }
      } catch (linkErr) {
        // Non-fatal — a linking failure must never block registration
        console.warn("Auto-link client_account (non-fatal):", linkErr);
      }
    }

    // ── Step 3: Generate confirmation link via Admin API
    // Load site_url from center_settings for the redirect
    let siteUrl = "https://caluatnails.com";
    try {
      const settingsRes = await fetch(
        `${supabaseUrl}/rest/v1/center_settings?id=eq.main&select=site_url`,
        { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
      );
      if (settingsRes.ok) {
        const rows = await settingsRes.json();
        if (rows?.[0]?.site_url) siteUrl = rows[0].site_url;
      }
    } catch { /* use default */ }

    const redirectTo = `${siteUrl}/confirmar-email`;

    let confirmationLink: string | null = null;
    try {
      const linkRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          type: "signup",
          email,
          options: { redirect_to: redirectTo },
        }),
      });
      if (linkRes.ok) {
        const linkData = await linkRes.json();
        confirmationLink = linkData.action_link || null;
      } else {
        const errText = await linkRes.text();
        console.warn("generate_link error:", errText);
      }
    } catch (linkErr) {
      console.warn("generate_link exception:", linkErr);
    }

    // ── Step 4: Send branded confirmation email via resend-email function
    //
    // We also log the attempt directly to notification_logs in case
    // resend-email is unreachable / errors out before its own logger
    // runs. This guarantees every signup attempt leaves a trail in the
    // admin Centro de Notificaciones.
    let emailOutcome: { status: "sent" | "failed" | "skipped"; error?: string } = {
      status: "failed",
      error: "Unknown",
    };

    try {
      const resendFnUrl = `${supabaseUrl}/functions/v1/resend-email`;
      const emailRes = await fetch(resendFnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          type: "signup_confirmation",
          to: { email, name: name || "" },
          data: {
            name: name || "",
            link: confirmationLink || redirectTo,
          },
        }),
      });
      // resend-email already inserts its own log; we only need a backup
      // record when the call itself fails (network / 5xx).
      if (emailRes.ok) {
        emailOutcome = { status: "sent" };
      } else {
        const errText = await emailRes.text().catch(() => `HTTP ${emailRes.status}`);
        emailOutcome = { status: "failed", error: errText.slice(0, 500) };
      }
    } catch (emailErr) {
      const message = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.warn("Resend email error (non-fatal):", message);
      emailOutcome = { status: "failed", error: message.slice(0, 500) };
    }

    // Always insert a backup log entry if the call failed — resend-email
    // didn't get a chance to log its own outcome.
    if (emailOutcome.status === "failed") {
      try {
        await fetch(`${supabaseUrl}/rest/v1/notification_logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            channel: "email",
            notification_type: "signup_confirmation",
            title: "Confirma tu cuenta CALUATNAILS",
            body: `Destinatario: ${email}`,
            recipient_email: email,
            recipient_name: name || null,
            status: "failed",
            error_message: `register-user no pudo invocar resend-email: ${emailOutcome.error}`,
            sent_at: new Date().toISOString(),
          }),
        });
      } catch (logErr) {
        console.warn("Backup log insert failed:", logErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("register-user error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
