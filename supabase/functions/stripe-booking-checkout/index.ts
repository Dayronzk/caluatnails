import Stripe from "https://esm.sh/stripe@14.21.0";

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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });

    const {
      bookingId,
      clientName,
      clientEmail,
      services,
      totalPrice,
      depositAmount,
      paymentMode,
      bookingDate,
      bookingTime,
      successUrl,
      cancelUrl,
    } = await req.json();

    const serviceNames = services.map((s: { name: string }) => s.name).join(", ");

    const stripeProductName = paymentMode === "full"
      ? "Pago completo – Reserva de servicios"
      : "Anticipo 10% – Reserva de servicios";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: clientEmail,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(depositAmount * 100),
            product_data: {
              name: stripeProductName,
              description: `Servicios: ${serviceNames} | Fecha: ${bookingDate} a las ${bookingTime} | Total cita: €${totalPrice.toFixed(2)}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        booking_id: bookingId,
        client_name: clientName,
        booking_date: bookingDate,
        booking_time: bookingTime,
        total_price: String(totalPrice),
        deposit_amount: String(depositAmount),
        payment_mode: String(paymentMode || "deposit"),
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
