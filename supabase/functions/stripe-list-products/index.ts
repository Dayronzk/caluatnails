import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

    // Fetch active products with their default prices expanded
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
      limit: 100,
    });

    // Also fetch all active prices to get the latest price per product
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    });

    // Build a map: productId -> latest price
    const latestPriceMap = new Map<string, Stripe.Price>();
    for (const price of prices.data) {
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      const existing = latestPriceMap.get(productId);
      // Keep the most recently created price
      if (!existing || price.created > existing.created) {
        latestPriceMap.set(productId, price);
      }
    }

    const result = products.data.map((product) => {
      const price = latestPriceMap.get(product.id);
      return {
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        images: product.images ?? [],
        metadata: product.metadata ?? {},
        price_id: price?.id ?? null,
        unit_amount: price?.unit_amount ?? null,
        currency: price?.currency ?? "eur",
      };
    });

    return new Response(JSON.stringify({ products: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
