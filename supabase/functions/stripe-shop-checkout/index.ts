import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

interface ShopLineItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });

    const { items, successUrl, cancelUrl, customerEmail, deliveryType, deliveryAddress } = await req.json() as {
      items: ShopLineItem[];
      successUrl: string;
      cancelUrl: string;
      customerEmail?: string;
      deliveryType?: string;
      deliveryAddress?: string;
    };

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
      const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
        name: item.name,
        metadata: { product_id: item.productId },
      };
      if (item.image) {
        productData.images = [item.image];
      }
      return {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(item.price * 100),
          product_data: productData,
        },
        quantity: item.qty,
      };
    });

    const metadata: Record<string, string> = {
      order_type: "shop",
      delivery_type: deliveryType ?? "pickup",
    };
    if (deliveryAddress) {
      metadata.delivery_address = deliveryAddress;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
