import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TARGET_PRODUCT_ID = "prod_UG5ehG9IrGh4hl";

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

async function loadBrandConfig(supabaseAdmin: any): Promise<BrandConfig> {
  try {
    const { data } = await supabaseAdmin
      .from("center_settings")
      .select("email_brand_name,site_url,contact_email,sender_email,email_footer_text,notification_email")
      .eq("id", "main")
      .maybeSingle();
    const config = data as any;
    if (!config) return DEFAULT_BRAND;
    return {
      email_brand_name: config.email_brand_name || DEFAULT_BRAND.email_brand_name,
      site_url: config.site_url || DEFAULT_BRAND.site_url,
      contact_email: config.contact_email || DEFAULT_BRAND.contact_email,
      sender_email: config.sender_email || DEFAULT_BRAND.sender_email,
      email_footer_text: config.email_footer_text || DEFAULT_BRAND.email_footer_text,
      notification_email: config.notification_email || "",
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
  console.log(`📡 [stripe-webhook] Requesting email [${type}] for ${to.email}...`);
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
      console.error(`❌ [stripe-webhook] resend-email function error (${res.status}):`, errText);
      return;
    }

    const result = await res.json() as { success: boolean; error?: string; skipped?: boolean; reason?: string };
    if (result.skipped) {
      console.log(`⚠️ [stripe-webhook] Email [${type}] skipped: ${result.reason ?? "no recipient"}`);
    } else if (!result.success) {
      console.error(`❌ [stripe-webhook] resend-email logic error:`, result.error);
    } else {
      console.log(`✅ [stripe-webhook] Email [${type}] trigger successful for ${to.email}`);
    }
  } catch (err) {
    console.error(`❌ [stripe-webhook] Resend fetch fatal error for [${type}]:`, err);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
      },
    });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();

  if (!stripeKey || !supabaseUrl || !serviceRoleKey) {
    console.error("❌ [stripe-webhook] Missing environment variables:", { 
      stripeKey: !!stripeKey, 
      supabaseUrl: !!supabaseUrl, 
      serviceRoleKey: !!serviceRoleKey 
    });
    return new Response(JSON.stringify({ error: "Environment variables not configured" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`🔍 [stripe-webhook] Env check: SupabaseUrl=${!!supabaseUrl}, ServiceRoleKeyLength=${serviceRoleKey.length}`);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Initialize Stripe SDK
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });

  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
    } else {
      event = JSON.parse(rawBody) as Stripe.Event;
      console.warn("⚠️  Webhook received without signature verification.");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature error:", msg);
    return new Response(JSON.stringify({ error: `Signature error: ${msg}` }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const brand = await loadBrandConfig(supabaseAdmin);

    try {
      // ── PREPAID BONOS / SUBSCRIPTION PAYMENT ─────────────────────────────
      if (session.metadata?.type === "subscription" || (session.metadata?.plan_id && session.metadata?.client_account_id)) {
        const planId = session.metadata.plan_id;
        const clientAccountId = session.metadata.client_account_id;
        console.log(`💳 Processing prepaid subscription: Plan=${planId}, ClientAccount=${clientAccountId}`);

        const { data: plan } = await supabaseAdmin
          .from("subscription_plans")
          .select("*")
          .eq("id", planId)
          .maybeSingle();

        if (plan) {
          const durationMonths = plan.duration_months;
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + durationMonths);

          const { data: clientSub, error: subErr } = await supabaseAdmin
            .from("client_subscriptions")
            .insert({
              client_account_id: clientAccountId,
              plan_id: planId,
              status: "active",
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              sessions_total: plan.total_sessions,
              sessions_used: 0,
              stripe_session_id: session.id
            })
            .select()
            .single();

          if (subErr) {
            console.error("❌ Error inserting client subscription:", subErr.message);
          } else {
            console.log(`✅ Client subscription created with id: ${clientSub.id} for ${plan.total_sessions} sessions`);

            // Send email confirmation using purchase_confirmation template
            const email = session.customer_details?.email ?? session.customer_email ?? null;
            if (email) {
              const customerName = session.customer_details?.name ?? email;
              const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
              await sendViaResend(supabaseUrl, serviceRoleKey, "purchase_confirmation",
                { email, name: customerName },
                {
                  name: customerName,
                  courseName: `Bono prepagado: ${plan.name} (${plan.total_sessions} sesiones)`,
                  amount: amountTotal,
                  orderId: session.id.slice(-12).toUpperCase(),
                }
              );
            }
          }
        }

        return new Response(JSON.stringify({ received: true, type: "subscription" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // ── GIFT CARD PAYMENT ──────────────────────────────────────────────
      if (session.metadata?.type === "gift_card") {
        const giftMode = session.metadata.gift_mode || "single";
        const adminEmail = brand.notification_email || brand.contact_email;

        // Gift card points reward: 100 pts per 10€ spent (for buyer AND recipient)
        const calcGiftPoints = (amount: number) => Math.floor(amount / 10) * 100;

        const awardGiftPoints = async (
          email: string | null | undefined,
          name: string | null | undefined,
          points: number,
          reason: string,
          giftCardCode: string
        ) => {
          if (!email || points <= 0) return;
          const cleanEmail = email.toLowerCase().trim();
          try {
            // 1) Try profile (auth user) by email
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("id, points")
              .eq("email", cleanEmail)
              .maybeSingle();
            if (profile) {
              await supabaseAdmin.from("points_transactions").insert({
                user_id: profile.id,
                points,
                type: "gift_card",
                description: reason,
                reference_id: giftCardCode,
              });
              await supabaseAdmin
                .from("profiles")
                .update({ points: (profile.points ?? 0) + points })
                .eq("id", profile.id);
              console.log(`🪙 +${points} pts to profile ${cleanEmail}`);
              return;
            }
            // 2) Try / create client_account by email
            let { data: client } = await supabaseAdmin
              .from("client_accounts")
              .select("id, points")
              .ilike("email", cleanEmail)
              .maybeSingle();
            if (!client) {
              const { data: newClient } = await supabaseAdmin
                .from("client_accounts")
                .insert({ email: cleanEmail, name: name || "Cliente", points: 0 })
                .select("id, points")
                .single();
              client = newClient;
            }
            if (client) {
              await supabaseAdmin.from("client_points_transactions").insert({
                client_account_id: client.id,
                points,
                type: "gift_card",
                description: reason,
                reference_id: giftCardCode,
              });
              await supabaseAdmin
                .from("client_accounts")
                .update({ points: (client.points ?? 0) + points })
                .eq("id", client.id);
              console.log(`🪙 +${points} pts to client_account ${cleanEmail}`);
            }
          } catch (err) {
            console.error("[gift points] Error awarding:", err);
          }
        };

        // Helper: activate + email one gift card
        const activateCard = async (gcId: string) => {
          await supabaseAdmin.from("gift_cards").update({ status: "active", stripe_session_id: session.id }).eq("id", gcId);
          const { data: gc } = await supabaseAdmin.from("gift_cards").select("*").eq("id", gcId).single();
          if (!gc) return;

          // Email to buyer
          await sendViaResend(supabaseUrl, serviceRoleKey, "gift_card_confirmation",
            { email: gc.buyer_email, name: gc.buyer_name },
            { buyerName: gc.buyer_name, recipientName: gc.recipient_name || gc.buyer_name, amount: gc.amount, code: gc.code, message: gc.message || "", expiresAt: gc.expires_at }
          );
          // Email to recipient
          if (gc.recipient_email && gc.recipient_email !== gc.buyer_email) {
            await sendViaResend(supabaseUrl, serviceRoleKey, "gift_card_received",
              { email: gc.recipient_email, name: gc.recipient_name || "Amiga" },
              { senderName: gc.buyer_name, recipientName: gc.recipient_name || "Amiga", amount: gc.amount, code: gc.code, message: gc.message || "", expiresAt: gc.expires_at }
            );
          }
          // Email to admin
          await sendViaResend(supabaseUrl, serviceRoleKey, "gift_card_admin",
            { email: adminEmail, name: "Admin" },
            { buyerName: gc.buyer_name, buyerEmail: gc.buyer_email, recipientName: gc.recipient_name || "—", amount: gc.amount, code: gc.code, giftType: gc.gift_type }
          );

          // Reward points: 100 pts per 10€ to buyer AND recipient
          const points = calcGiftPoints(Number(gc.amount));
          if (points > 0) {
            await awardGiftPoints(gc.buyer_email, gc.buyer_name, points, `Bonus tarjeta regalo ${gc.amount}€ (compra)`, gc.code);
            if (gc.recipient_email && gc.recipient_email.toLowerCase() !== gc.buyer_email.toLowerCase()) {
              await awardGiftPoints(gc.recipient_email, gc.recipient_name, points, `Bonus tarjeta regalo ${gc.amount}€ (recibida)`, gc.code);
            }
          }
        };

        if (giftMode === "single") {
          console.log(`🎁 Processing single gift card: ${session.metadata.gift_card_code}`);
          await activateCard(session.metadata.gift_card_id);
        } else if (giftMode === "bulk") {
          const ids = (session.metadata.gift_card_ids || "").split(",").filter(Boolean);
          console.log(`🎁 Processing bulk gift cards: ${ids.length} cards`);
          for (const id of ids) {
            await activateCard(id);
          }
        } else if (giftMode === "group") {
          const gcId = session.metadata.gift_card_id;
          const contribution = Number(session.metadata.contribution_amount || 0);
          console.log(`🎁 Processing group contribution: ${contribution} € for card ${session.metadata.gift_card_code}`);

          // Activate the card with the contribution amount (first contributor creates it)
          await supabaseAdmin.from("gift_cards").update({
            status: "active",
            stripe_session_id: session.id,
            remaining_amount: contribution,
            group_collected: contribution,
          }).eq("id", gcId);

          // Send confirmation to contributor
          const { data: gc } = await supabaseAdmin.from("gift_cards").select("*").eq("id", gcId).single();
          if (gc) {
            await sendViaResend(supabaseUrl, serviceRoleKey, "gift_card_confirmation",
              { email: gc.buyer_email, name: gc.buyer_name },
              { buyerName: gc.buyer_name, recipientName: gc.recipient_name || "—", amount: contribution, code: gc.code, message: `Aportación grupal de ${contribution} € (objetivo: ${gc.group_target} €)`, expiresAt: gc.expires_at }
            );
            await sendViaResend(supabaseUrl, serviceRoleKey, "gift_card_admin",
              { email: adminEmail, name: "Admin" },
              { buyerName: gc.buyer_name, buyerEmail: gc.buyer_email, recipientName: gc.recipient_name || "—", amount: contribution, code: gc.code, giftType: "group", targetAmount: gc.group_target }
            );

            // Reward points to contributor: 100 pts per 10€ contributed
            const points = calcGiftPoints(contribution);
            if (points > 0) {
              await awardGiftPoints(gc.buyer_email, gc.buyer_name, points, `Bonus aportación tarjeta grupal ${contribution}€`, gc.code);
            }
          }
        }

        return new Response(JSON.stringify({ received: true, type: "gift_card", mode: giftMode }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const bookingId = session.metadata?.booking_id;

      // ── BOOKING PAYMENT ──────────────────────────────────────────────────
      if (bookingId) {
        console.log(`📅 Processing booking payment: ${bookingId}`);
        const bookingIds = bookingId.split(",");

        const GENERIC_PASSWORD = "Nailox1234*";

        // Update deposit paid and status for all bookings in the list
        await supabaseAdmin
          .from("bookings")
          .update({ deposit_paid: true, status: "confirmed" })
          .in("id", bookingIds);

        for (const singleId of bookingIds) {
          const { data: booking } = await supabaseAdmin
            .from("bookings")
            .select("*, booking_services(service_name, service_id)")
            .eq("id", singleId)
            .maybeSingle();

          if (booking) {
            console.log(`📖 [stripe-webhook] Booking found for: ${booking.client_email}`);
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

            // ── EMAIL FALLBACK ──────────────────────────────────────────────
            // The client_email field is optional during booking. Fall back to
            // client_accounts (by phone) or a previous booking's email so the
            // confirmation can still be sent.
            let clientEmail = (booking.client_email ?? "").trim();
            if (!clientEmail && booking.client_phone) {
              const { data: acct } = await supabaseAdmin
                .from("client_accounts")
                .select("email")
                .eq("phone", booking.client_phone)
                .maybeSingle();
              if (acct?.email) {
                clientEmail = acct.email.trim();
                console.log(`📧 [stripe-webhook] Recovered email from client_accounts: ${clientEmail}`);
              } else {
                const { data: prev } = await supabaseAdmin
                  .from("bookings")
                  .select("client_email")
                  .eq("client_phone", booking.client_phone)
                  .neq("id", singleId)
                  .not("client_email", "is", null)
                  .neq("client_email", "")
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (prev?.client_email) {
                  clientEmail = prev.client_email.trim();
                  console.log(`📧 [stripe-webhook] Recovered email from previous booking: ${clientEmail}`);
                }
              }
              if (clientEmail) {
                await supabaseAdmin.from("bookings").update({ client_email: clientEmail }).eq("id", singleId);
              }
            }

            // ── 1. Send booking confirmation to CLIENT ───────────────────────
            if (!clientEmail) {
              console.warn(`⚠️ [stripe-webhook] Booking ${singleId} has no email — skipping client confirmation`);
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
              .neq("id", singleId);

            const isNewClient = (priorBookings ?? 0) === 0;
            console.log(`ℹ️ Client [${booking.client_phone}] is ${isNewClient ? "NEW" : "EXISTING"} (Prior bookings: ${priorBookings})`);

            let proEmail: string | null = null;
            if (booking.professional_id) {
              const { data: proAuthUser } = await supabaseAdmin.auth.admin.getUserById(booking.professional_id);
              proEmail = proAuthUser?.user?.email ?? null;
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
              bookingId: singleId,
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
            if (clientEmail) {
              const emailToUse = clientEmail.toLowerCase();
              const clientName = booking.client_name;

              const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
              const existingUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === emailToUse);

              let finalUserId = booking.user_id || existingUser?.id;

              if (!existingUser) {
                console.log(`👤 Creating new account for: ${emailToUse}...`);
                const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                  email: emailToUse,
                  password: GENERIC_PASSWORD,
                  email_confirm: true,
                  user_metadata: { name: clientName },
                });

                if (createErr) {
                  console.error("❌ Error creating user:", createErr.message);
                } else if (newUser?.user) {
                  console.log(`✅ Account created for ${emailToUse} with generic password`);
                  finalUserId = newUser.user.id;

                  await supabaseAdmin.from("profiles").upsert({
                    id: newUser.user.id,
                    name: clientName,
                    email: emailToUse,
                    points: 0,
                    signup_source: "booking",
                  }, { onConflict: "id" });

                  await supabaseAdmin.from("bookings").update({ user_id: newUser.user.id }).eq("id", singleId);

                  // Welcome email with password
                  console.log(`✉️ Sending welcome email to: ${emailToUse}`);
                  await sendViaResend(supabaseUrl, serviceRoleKey, "welcome",
                    { email: emailToUse, name: clientName },
                    { 
                      name: clientName, 
                      email: emailToUse,
                      password: GENERIC_PASSWORD 
                    }
                  );
                }
              } else {
                console.log(`ℹ️ User already exists: ${emailToUse}`);
                if (!booking.user_id) {
                  await supabaseAdmin.from("bookings").update({ user_id: existingUser.id }).eq("id", singleId);
                }
              }

              // ── 4. Award reward points ────────────────────────────────────────
              try {
                if (finalUserId) {
                  const bServices = booking.booking_services as { service_id: string | null }[];
                  const serviceIds = bServices.map((bs) => bs.service_id).filter(Boolean) as string[];

                  if (serviceIds.length > 0) {
                    const { data: svcData } = await supabaseAdmin.from("services").select("reward_points").in("id", serviceIds);
                    const earnedPoints = (svcData ?? []).reduce(
                      (sum: number, s: { reward_points: number | null }) => sum + (s.reward_points ?? 0), 0
                    );

                    if (earnedPoints > 0) {
                      console.log(`🪙 Awarding ${earnedPoints} points to user ${finalUserId}`);
                      await supabaseAdmin.from("points_transactions").insert({
                        user_id: finalUserId,
                        points: earnedPoints,
                        type: "booking",
                        description: `Puntos por reserva del ${booking.booking_date}`,
                        reference_id: singleId,
                      });
                      const { data: profData } = await supabaseAdmin.from("profiles").select("points").eq("id", finalUserId).maybeSingle();
                      if (profData) {
                        await supabaseAdmin.from("profiles").update({ points: (profData.points ?? 0) + earnedPoints }).eq("id", finalUserId);
                      }
                    }
                  }
                }
              } catch (ptErr) {
                console.error("⚠️ Error awarding points (non-fatal):", ptErr);
              }
            }

            // ── 5. Complete referral ──────────────────────────────────────────
            try {
              const { data: referral } = await supabaseAdmin
                .from("referrals")
                .select("id, referrer_id, points_awarded")
                .eq("reference_id", singleId)
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
                  reference_id: singleId,
                });
                const { data: refProfile } = await supabaseAdmin.from("profiles").select("points").eq("id", referral.referrer_id).maybeSingle();
                if (refProfile) {
                  await supabaseAdmin.from("profiles").update({ points: (refProfile.points ?? 0) + referral.points_awarded }).eq("id", referral.referrer_id);
                }
              }
            } catch (refErr) {
              console.error("⚠️ Error completing referral (non-fatal):", refErr);
            }
        }
      }

      return new Response(JSON.stringify({ received: true, type: "booking" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

      // ── COURSE PURCHASE ──────────────────────────────────────────────────
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ["data.price.product"],
        limit: 100,
      });

      const hasTargetProduct = lineItems.data.some((item: any) => {
        const product = item.price?.product;
        if (!product) return false;
        const productId = typeof product === "string" ? product : product.id;
        return productId === TARGET_PRODUCT_ID;
      });

      if (hasTargetProduct) {
        const email = session.customer_details?.email ?? session.customer_email ?? null;
        if (email) {
          const { error } = await supabaseAdmin.from("purchases").upsert(
            {
              email: email.toLowerCase().trim(),
              product_id: TARGET_PRODUCT_ID,
              session_id: session.id,
              amount_total: session.amount_total,
              currency: session.currency ?? "eur",
              status: "completed",
            },
            { onConflict: "session_id" }
          );

          if (error) {
            console.error("Supabase insert error:", error.message);
          } else {
            console.log(`✅ Access granted for ${email}`);
            const customerName = session.customer_details?.name ?? email;
            const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
            await sendViaResend(supabaseUrl, serviceRoleKey, "purchase_confirmation",
              { email, name: customerName },
              {
                name: customerName,
                courseName: "Curso Profesional NAILOX",
                amount: amountTotal,
                orderId: session.id.slice(-12).toUpperCase(),
              }
            );
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error processing checkout:", msg);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});