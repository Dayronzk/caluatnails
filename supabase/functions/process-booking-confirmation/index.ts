import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GENERIC_PASSWORD = "Nailox1234*";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

interface BrandConfig {
  email_brand_name: string;
  site_url: string;
  contact_email: string;
  sender_email: string;
  email_footer_text: string;
  notification_email: string;
}

const DEFAULT_BRAND: BrandConfig = {
  email_brand_name: "NAILOX",
  site_url: "https://nailox.com",
  contact_email: "hola@nailox.com",
  sender_email: "noreply@nailox.com",
  email_footer_text: "Curso Profesional de Manicura y Pedicura",
  notification_email: "",
};

async function loadBrandConfig(supabaseAdmin: ReturnType<typeof createClient>): Promise<BrandConfig> {
  try {
    const { data } = await supabaseAdmin
      .from("center_settings")
      .select("email_brand_name,site_url,contact_email,sender_email,email_footer_text,notification_email")
      .eq("id", "main")
      .maybeSingle();
    if (!data) return DEFAULT_BRAND;
    return {
      email_brand_name: data.email_brand_name || DEFAULT_BRAND.email_brand_name,
      site_url: data.site_url || DEFAULT_BRAND.site_url,
      contact_email: data.contact_email || DEFAULT_BRAND.contact_email,
      sender_email: data.sender_email || DEFAULT_BRAND.sender_email,
      email_footer_text: data.email_footer_text || DEFAULT_BRAND.email_footer_text,
      notification_email: data.notification_email || "",
    };
  } catch {
    return DEFAULT_BRAND;
  }
}

async function sendViaResend(
  supabaseUrl: string,
  serviceRoleKey: string,
  type: string,
  to: { email: string; name?: string },
  data: Record<string, unknown>
): Promise<void> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/resend-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
      },
      body: JSON.stringify({ type, to, data }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`resend-email error (${res.status}) for [${type}]:`, errText);
      return;
    }
    const result = await res.json() as { success: boolean; error?: string; skipped?: boolean; reason?: string };
    if (result.skipped) {
      console.log(`⚠️ Email [${type}] skipped: ${result.reason ?? "no recipient"}`);
    } else if (!result.success) {
      console.error(`❌ Resend logic error for [${type}]:`, result.error);
    } else {
      console.log(`✅ Email [${type}] trigger successful for ${to.email}`);
    }
  } catch (err) {
    console.error(`Resend fetch error for [${type}]:`, err);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("❌ [process-booking-confirmation] Missing environment variables");
      return new Response(JSON.stringify({ error: "Missing environment variables" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🔍 [process-booking-confirmation] Env check: Url=${!!supabaseUrl}, KeyLength=${serviceRoleKey.length}`);
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let body: { bookingId?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bookingId } = body;

    if (!bookingId) {
      return new Response(JSON.stringify({ error: "Booking ID is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📅 Processing booking confirmation: ${bookingId}`);

    // Update booking status
    const { error: updateErr } = await supabaseAdmin
      .from("bookings")
      .update({ deposit_paid: true, status: "confirmed" })
      .eq("id", bookingId);

    if (updateErr) {
      console.error("Error updating booking status:", updateErr.message);
    }

    // Load booking details
    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select("*, booking_services(service_name, service_id)")
      .eq("id", bookingId)
      .maybeSingle();

    if (bErr || !booking) {
      return new Response(JSON.stringify({ error: `Booking not found: ${bookingId}` }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brand = await loadBrandConfig(supabaseAdmin);
    const serviceNames = (booking.booking_services as { service_name: string }[]).map((s) => s.service_name);

    // Load professional info
    let professional: { name: string; address: string; instagram: string } | null = null;
    if (booking.professional_id) {
      const [{ data: proProfile }, { data: proUser }] = await Promise.all([
        supabaseAdmin.from("professional_profiles").select("address, instagram").eq("user_id", booking.professional_id).maybeSingle(),
        supabaseAdmin.from("profiles").select("name").eq("id", booking.professional_id).maybeSingle(),
      ]);
      if (proUser?.name) {
        professional = { name: proUser.name, address: proProfile?.address ?? "", instagram: proProfile?.instagram ?? "" };
      }
    }

    // ── EMAIL FALLBACK ────────────────────────────────────────────────
    // If the booking has no client_email (the field is optional during
    // booking), try to recover it from the client_account by phone, then
    // from a previous booking of the same phone. If found, also persist
    // it back on the booking so this lookup isn't needed next time.
    let clientEmail = (booking.client_email ?? "").trim();
    if (!clientEmail && booking.client_phone) {
      const { data: acct } = await supabaseAdmin
        .from("client_accounts")
        .select("email, name")
        .eq("phone", booking.client_phone)
        .maybeSingle();
      if (acct?.email) {
        clientEmail = acct.email.trim();
        console.log(`📧 Recovered email from client_accounts: ${clientEmail}`);
      } else {
        const { data: prevBooking } = await supabaseAdmin
          .from("bookings")
          .select("client_email")
          .eq("client_phone", booking.client_phone)
          .neq("id", bookingId)
          .not("client_email", "is", null)
          .neq("client_email", "")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (prevBooking?.client_email) {
          clientEmail = prevBooking.client_email.trim();
          console.log(`📧 Recovered email from previous booking: ${clientEmail}`);
        }
      }
      if (clientEmail) {
        await supabaseAdmin.from("bookings").update({ client_email: clientEmail }).eq("id", bookingId);
      }
    }

    // ── 1. Send booking confirmation to CLIENT ───────────────────────
    if (!clientEmail) {
      console.warn(`⚠️ Booking ${bookingId} has no email — skipping client confirmation email`);
    } else {
      console.log(`✉️ Sending booking confirmation to ${clientEmail}...`);
      await sendViaResend(supabaseUrl, serviceRoleKey, "booking_confirmation",
        { email: clientEmail, name: booking.client_name },
        {
          clientName: booking.client_name,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          services: serviceNames,
          totalPrice: Number(booking.total_price),
          depositAmount: Number(booking.deposit_amount),
          durationMinutes: booking.total_duration_minutes ?? 60,
          professionalName: professional?.name ?? "",
          professionalAddress: professional?.address ?? "",
          professionalInstagram: professional?.instagram ?? "",
        }
      );
    }

    // ── 2. Send notification to ADMIN / PROFESSIONAL ─────────────────
    const { count: priorBookings } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("client_phone", booking.client_phone)
      .neq("id", bookingId);

    const isNewClient = (priorBookings ?? 0) === 0;
    console.log(`ℹ️ Client [${booking.client_email}] is ${isNewClient ? "NEW" : "EXISTING"} (Prior bookings: ${priorBookings})`);

    let proEmail: string | null = null;
    if (booking.professional_id) {
      try {
        const { data: proAuthUser } = await supabaseAdmin.auth.admin.getUserById(booking.professional_id);
        proEmail = proAuthUser?.user?.email ?? null;
      } catch (e) {
        console.warn("Could not fetch professional email:", e);
      }
    }

    const adminNotifData = {
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      clientPhone: booking.client_phone ?? "",
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      services: serviceNames,
      totalPrice: Number(booking.total_price),
      depositAmount: Number(booking.deposit_amount),
      durationMinutes: booking.total_duration_minutes ?? 60,
      professionalName: professional?.name ?? "",
      bookingId,
      isNewClient,
    };

    const adminEmail = brand.notification_email || brand.contact_email;
    console.log(`✉️ Sending admin notification to: ${adminEmail}`);
    await sendViaResend(supabaseUrl, serviceRoleKey, "booking_new_admin",
      { email: adminEmail, name: "Admin" },
      adminNotifData
    );

    if (proEmail && proEmail !== adminEmail) {
      console.log(`✉️ Sending professional notification to: ${proEmail}`);
      await sendViaResend(supabaseUrl, serviceRoleKey, "booking_new_admin",
        { email: proEmail, name: professional?.name ?? "Profesional" },
        adminNotifData
      );
    }

    // ── 3. Create account for new clients ────────────────────────────
    const clientEmail = booking.client_email.toLowerCase().trim();
    const clientName = booking.client_name;

    // Use getUserByEmail instead of listUsers to avoid pagination issues
    let existingUserId: string | null = booking.user_id ?? null;

    if (!existingUserId) {
      try {
        const { data: existingUserData, error: lookupErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (!lookupErr && existingUserData?.users) {
          const found = existingUserData.users.find((u) => u.email?.toLowerCase() === clientEmail);
          if (found) existingUserId = found.id;
        }
      } catch (e) {
        console.warn("listUsers failed, will try to create user:", e);
      }
    }

    let finalUserId = existingUserId;

    if (!existingUserId) {
      console.log(`👤 Creating new account for: ${clientEmail}...`);
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: clientEmail,
        password: GENERIC_PASSWORD,
        email_confirm: true,
        user_metadata: { name: clientName },
      });

      if (createErr) {
        // If user already exists (duplicate), try to find them
        if (createErr.message?.includes("already") || createErr.message?.includes("exists")) {
          console.log(`ℹ️ User already exists (from error), skipping creation for: ${clientEmail}`);
        } else {
          console.error("❌ Error creating user:", createErr.message);
        }
      } else if (newUser?.user) {
        console.log(`✅ Account created for ${clientEmail} with generic password`);
        finalUserId = newUser.user.id;

        await supabaseAdmin.from("profiles").upsert({
          id: newUser.user.id,
          name: clientName,
          email: clientEmail,
          points: 0,
          signup_source: "booking",
        }, { onConflict: "id" });

        await supabaseAdmin.from("bookings").update({ user_id: newUser.user.id }).eq("id", bookingId);

        // Send welcome email with password
        console.log(`✉️ Sending welcome email to: ${clientEmail}`);
        await sendViaResend(supabaseUrl, serviceRoleKey, "welcome",
          { email: clientEmail, name: clientName },
          {
            name: clientName,
            email: clientEmail,
            password: GENERIC_PASSWORD,
          }
        );
      }
    } else {
      console.log(`ℹ️ User already exists: ${clientEmail}`);
      if (!booking.user_id) {
        await supabaseAdmin.from("bookings").update({ user_id: existingUserId }).eq("id", bookingId);
      }
    }

    // ── 4. Award reward points ────────────────────────────────────────
    try {
      const bServices = booking.booking_services as { service_id: string | null }[];
      const serviceIds = bServices.map((bs) => bs.service_id).filter(Boolean) as string[];

      if (serviceIds.length > 0) {
        const { data: svcData } = await supabaseAdmin.from("services").select("reward_points").in("id", serviceIds);
        const earnedPoints = (svcData ?? []).reduce(
          (sum: number, s: { reward_points: number | null }) => sum + (s.reward_points ?? 0), 0
        );

        if (earnedPoints > 0) {
          // Award to profiles (authenticated users)
          if (finalUserId) {
            console.log(`🪙 Awarding ${earnedPoints} points to profile ${finalUserId}`);
            await supabaseAdmin.from("points_transactions").insert({
              user_id: finalUserId,
              points: earnedPoints,
              type: "booking",
              description: `Puntos por reserva del ${booking.booking_date}`,
              reference_id: bookingId,
            });
            const { data: profData } = await supabaseAdmin.from("profiles").select("points").eq("id", finalUserId).maybeSingle();
            if (profData) {
              await supabaseAdmin.from("profiles").update({ points: (profData.points ?? 0) + earnedPoints }).eq("id", finalUserId);
            }
          }

          // Award to client_accounts (phone-based clients)
          const clientPhone = (booking.client_phone || "").replace(/\D/g, "");
          if (clientPhone.length >= 6) {
            const last9 = clientPhone.slice(-9);
            let { data: clientAcc } = await supabaseAdmin
              .from("client_accounts")
              .select("id, points")
              .ilike("phone", `%${last9}`)
              .maybeSingle();

            // If client_account doesn't exist, create one
            if (!clientAcc) {
              console.log(`👤 Creating client_account for phone +34${last9} (${clientName})`);
              const { data: newAcc, error: createAccErr } = await supabaseAdmin
                .from("client_accounts")
                .insert({
                  phone: `+34${last9}`,
                  name: clientName,
                  email: clientEmail || null,
                  points: 0,
                })
                .select("id, points")
                .single();
              if (createAccErr) {
                console.error("❌ Error creating client_account:", createAccErr.message);
              } else {
                clientAcc = newAcc;
              }
            }

            if (clientAcc) {
              console.log(`🪙 Awarding ${earnedPoints} points to client_account ${clientAcc.id}`);
              await supabaseAdmin.from("client_points_transactions").insert({
                client_account_id: clientAcc.id,
                points: earnedPoints,
                type: "booking",
                description: `Puntos por reserva del ${booking.booking_date}`,
                reference_id: bookingId,
              });
              await supabaseAdmin.from("client_accounts").update({
                points: (clientAcc.points ?? 0) + earnedPoints,
              }).eq("id", clientAcc.id);
            }
          }
        }
      }
    } catch (ptErr) {
      console.error("⚠️ Error awarding points (non-fatal):", ptErr);
    }

    // ── 5. Complete referral ──────────────────────────────────────────
    try {
      const { data: referral } = await supabaseAdmin
        .from("referrals")
        .select("id, referrer_id, points_awarded")
        .eq("reference_id", bookingId)
        .eq("event_type", "booking")
        .eq("status", "pending")
        .maybeSingle();

      if (referral) {
        console.log(`🤝 Completing referral for ID: ${referral.id}`);
        await supabaseAdmin.from("referrals").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", referral.id);
        await supabaseAdmin.from("points_transactions").insert({
          user_id: referral.referrer_id,
          points: referral.points_awarded,
          type: "referral_booking",
          description: `Referido completado — reserva de ${booking.client_name}`,
          reference_id: bookingId,
        });
        const { data: refProfile } = await supabaseAdmin.from("profiles").select("points").eq("id", referral.referrer_id).maybeSingle();
        if (refProfile) {
          await supabaseAdmin.from("profiles").update({ points: (refProfile.points ?? 0) + referral.points_awarded }).eq("id", referral.referrer_id);
        }
      }
    } catch (refErr) {
      console.error("⚠️ Error completing referral (non-fatal):", refErr);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Error confirming booking:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});