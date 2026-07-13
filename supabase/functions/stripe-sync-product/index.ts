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

    const { name, description, price_eur, stripe_product_id } = await req.json() as {
      name: string;
      description?: string;
      price_eur: number;
      stripe_product_id?: string;
    };

    let productId = stripe_product_id;

    if (productId) {
      await stripe.products.update(productId, {
        name,
        description: description ?? undefined,
      });
    } else {
      const product = await stripe.products.create({
        name,
        description: description ?? undefined,
      });
      productId = product.id;
    }

    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(price_eur * 100),
      currency: "eur",
    });

    return new Response(
      JSON.stringify({ stripe_product_id: productId, stripe_price_id: price.id }),
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
