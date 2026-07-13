import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

interface CartLineItem {
  title: string;
  price: number;
  image?: string;
  stripe_price_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });

    const { items, successUrl, cancelUrl, customerEmail, metadata } = await req.json() as {
      items: CartLineItem[];
      successUrl: string;
      cancelUrl: string;
      customerEmail?: string;
      metadata?: Record<string, string>;
    };

    const lineItems = items.map((item: CartLineItem) => {
      if (item.stripe_price_id) {
        return { price: item.stripe_price_id, quantity: 1 };
      }
      const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.title,
          },
        },
        quantity: 1,
      };
      if (item.image) {
        (lineItem.price_data!.product_data as { name: string; images?: string[] }).images = [item.image];
      }
      return lineItem;
    });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    if (metadata) {
      sessionParams.metadata = metadata;
    }

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
