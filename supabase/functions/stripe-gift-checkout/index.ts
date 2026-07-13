import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "NX-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if (i === 3) code += "-";
  }
  return code;
}

interface Recipient { name: string; email: string }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing environment variables");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const {
      mode = "single",
      amount,
      buyerName,
      buyerEmail,
      message,
      occasion,
      successUrl,
      cancelUrl,
      delivery,
      deliveryDate,
      deliveryFee = 0,
      recipientPhone,
      postalAddress,
    } = body as {
      mode?: "single" | "bulk" | "group";
      amount: number;
      buyerName: string;
      buyerEmail: string;
      message?: string;
      occasion?: string;
      successUrl: string;
      cancelUrl: string;
      delivery?: "email" | "sms" | "whatsapp" | "postal";
      deliveryDate?: string;
      deliveryFee?: number;
      recipientPhone?: string;
      postalAddress?: { address: string; city: string; zip: string };
    };

    // ── SINGLE MODE ───────────────────────────────────────────────────────
    if (mode === "single") {
      const { recipientName, recipientEmail } = body as {
        recipientName?: string;
        recipientEmail?: string;
      };

      if (!amount || amount < 10 || amount > 500) throw new Error("Importe entre 10 y 500 €");

      const code = generateCode();

      const { data: gc, error: insertErr } = await supabase.from("gift_cards").insert({
        code,
        amount,
        remaining_amount: amount,
        buyer_name: buyerName,
        buyer_email: buyerEmail.toLowerCase().trim(),
        recipient_name: recipientName || null,
        recipient_email: recipientEmail?.toLowerCase().trim() || null,
        message: message || null,
        occasion: occasion || null,
        gift_type: "single",
        status: "pending",
        delivery_method: delivery || "email",
        delivery_date: deliveryDate || null,
        recipient_phone: recipientPhone || null,
        postal_address: postalAddress?.address || null,
        postal_city: postalAddress?.city || null,
        postal_zip: postalAddress?.zip || null,
      }).select("id").single();

      if (insertErr) throw new Error(`DB: ${insertErr.message}`);

      const totalAmount = amount + deliveryFee;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "eur",
            unit_amount: Math.round(totalAmount * 100),
            product_data: {
              name: `Tarjeta Regalo CALUATNAILS — ${amount} €`,
              description: recipientName ? `Para: ${recipientName}` : "Tarjeta regalo manicura y pedicura",
            },
          },
          quantity: 1,
        }],
        mode: "payment",
        customer_email: buyerEmail,
        success_url: `${successUrl}?code=${code}`,
        cancel_url: cancelUrl,
        metadata: { gift_card_id: gc.id, gift_card_code: code, type: "gift_card", gift_mode: "single", delivery_fee: String(deliveryFee) },
      });

      await supabase.from("gift_cards").update({ stripe_session_id: session.id }).eq("id", gc.id);

      return new Response(
        JSON.stringify({ url: session.url, session_id: session.id, code }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── BULK MODE ─────────────────────────────────────────────────────────
    if (mode === "bulk") {
      const { recipients } = body as { recipients: Recipient[] };

      if (!amount || amount < 10 || amount > 500) throw new Error("Importe entre 10 y 500 €");
      if (!recipients?.length) throw new Error("Añade al menos un destinatario");

      const codes: string[] = [];
      const gcIds: string[] = [];

      for (const r of recipients) {
        const code = generateCode();
        codes.push(code);

        const { data: gc, error: insertErr } = await supabase.from("gift_cards").insert({
          code,
          amount,
          remaining_amount: amount,
          buyer_name: buyerName,
          buyer_email: buyerEmail.toLowerCase().trim(),
          recipient_name: r.name || null,
          recipient_email: r.email?.toLowerCase().trim() || null,
          message: message || null,
          occasion: occasion || null,
          gift_type: "bulk",
          status: "pending",
          delivery_method: delivery || "email",
          delivery_date: deliveryDate || null,
          recipient_phone: recipientPhone || null,
          postal_address: postalAddress?.address || null,
          postal_city: postalAddress?.city || null,
          postal_zip: postalAddress?.zip || null,
        }).select("id").single();

        if (insertErr) throw new Error(`DB: ${insertErr.message}`);
        gcIds.push(gc.id);
      }

      const subtotal = amount * recipients.length;
      const totalAmount = subtotal + deliveryFee;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `Tarjeta Regalo CALUATNAILS — ${amount} €`,
              description: `Lote de ${recipients.length} tarjetas regalo`,
            },
          },
          quantity: recipients.length,
        }],
        mode: "payment",
        customer_email: buyerEmail,
        success_url: `${successUrl}?code=${codes[0]}&count=${recipients.length}`,
        cancel_url: cancelUrl,
        metadata: {
          gift_card_ids: gcIds.join(","),
          gift_card_codes: codes.join(","),
          type: "gift_card",
          gift_mode: "bulk",
          total_amount: String(totalAmount),
          delivery_fee: String(deliveryFee),
        },
      });

      // Update all gift cards with session id
      for (const id of gcIds) {
        await supabase.from("gift_cards").update({ stripe_session_id: session.id }).eq("id", id);
      }

      return new Response(
        JSON.stringify({ url: session.url, session_id: session.id, codes }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── GROUP MODE ────────────────────────────────────────────────────────
    if (mode === "group") {
      const { targetAmount, recipientName, recipientEmail, contributors } = body as {
        targetAmount: number;
        recipientName: string;
        recipientEmail?: string;
        contributors?: string[];
      };

      if (!amount || amount < 5) throw new Error("Aportación mínima de 5 €");
      if (!targetAmount || targetAmount < 20) throw new Error("Objetivo mínimo de 20 €");
      if (!recipientName?.trim()) throw new Error("Indica el nombre del destinatario");

      const code = generateCode();
      const contribText = contributors?.filter(Boolean).join(", ") || buyerName;

      const { data: gc, error: insertErr } = await supabase.from("gift_cards").insert({
        code,
        amount: targetAmount,
        remaining_amount: targetAmount,
        buyer_name: buyerName,
        buyer_email: buyerEmail.toLowerCase().trim(),
        recipient_name: recipientName,
        recipient_email: recipientEmail?.toLowerCase().trim() || null,
        message: message ? `${message}\n\nDe parte de: ${contribText}` : `De parte de: ${contribText}`,
        occasion: occasion || null,
        gift_type: "group",
        group_target: targetAmount,
        group_collected: amount, // first contribution
        status: "pending",
        delivery_method: delivery || "email",
        delivery_date: deliveryDate || null,
        recipient_phone: recipientPhone || null,
        postal_address: postalAddress?.address || null,
        postal_city: postalAddress?.city || null,
        postal_zip: postalAddress?.zip || null,
      }).select("id").single();

      if (insertErr) throw new Error(`DB: ${insertErr.message}`);

      const totalAmount = amount + deliveryFee;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "eur",
            unit_amount: Math.round(totalAmount * 100),
            product_data: {
              name: `Aportación Tarjeta Grupal CALUATNAILS`,
              description: `Tu aportación de ${amount} € para ${recipientName} (objetivo: ${targetAmount} €)`,
            },
          },
          quantity: 1,
        }],
        mode: "payment",
        customer_email: buyerEmail,
        success_url: `${successUrl}?code=${code}&group=1`,
        cancel_url: cancelUrl,
        metadata: {
          gift_card_id: gc.id,
          gift_card_code: code,
          type: "gift_card",
          gift_mode: "group",
          contribution_amount: String(amount),
          target_amount: String(targetAmount),
          delivery_fee: String(deliveryFee),
        },
      });

      await supabase.from("gift_cards").update({ stripe_session_id: session.id }).eq("id", gc.id);

      return new Response(
        JSON.stringify({ url: session.url, session_id: session.id, code }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Modo no válido: ${mode}`);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-gift-checkout] Error:", errMsg);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
