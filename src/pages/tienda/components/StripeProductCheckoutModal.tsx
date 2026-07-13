import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import BizumSuccessModal from "@/components/feature/BizumSuccessModal";
import type { User } from "@supabase/supabase-js";
import type { StripeProduct } from "@/pages/tienda/components/StripeProductsCarousel";
import type { ShopCartItem } from "@/hooks/useCart";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const SHOP_CHECKOUT_FN = `${SUPABASE_URL}/functions/v1/stripe-shop-checkout`;

interface CenterInfo {
  bizum_whatsapp?: string;
  center_name: string;
  address: string;
  city: string;
  postal_code: string;
  schedule: string;
}

interface Props {
  product: StripeProduct;
  user: User | null;
  getImage: (p: StripeProduct) => string;
  onClose: () => void;
  // Optional: when coming from cart with multiple items
  cartItems?: ShopCartItem[];
  stripeDisabled?: boolean;
  stripeDisabledMessage?: string;
  onSuccess?: () => void;
}

type DeliveryType = "pickup" | "delivery";

function formatPrice(amount: number | null, currency: string): string {
  if (amount === null) return "Consultar precio";
  const value = amount / 100;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency.toUpperCase() }).format(value);
}

export default function StripeProductCheckoutModal({ product, user, getImage, onClose, cartItems, stripeDisabled = false, stripeDisabledMessage = "", onSuccess }: Props) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [centerInfo, setCenterInfo] = useState<CenterInfo>({
    center_name: "CALUATNAILS Centro",
    address: "Calle Ejemplo 123",
    city: "Madrid",
    postal_code: "28001",
    schedule: "",
  });
  const [bizumWhatsapp, setBizumWhatsapp] = useState("");
  const [form, setForm] = useState({
    name: user?.user_metadata?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [bizumLoading, setBizumLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBizumSuccess, setShowBizumSuccess] = useState(false);

  // Determine if we're in "cart mode" (multiple items from cart)
  const isCartMode = cartItems && cartItems.length > 0;
  const cartTotal = isCartMode
    ? cartItems.reduce((s, i) => s + i.price * i.qty, 0)
    : (product.unit_amount ? product.unit_amount / 100 : 0);
  const finalTotal = cartTotal;
  const priceLabel = new Intl.NumberFormat("es-ES", { style: "currency", currency: "eur" }).format(finalTotal);

  useEffect(() => {
    supabase
      .from("center_settings")
      .select("center_name, address, city, postal_code, schedule, bizum_whatsapp")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCenterInfo(data as CenterInfo);
          if (data.bizum_whatsapp) setBizumWhatsapp(data.bizum_whatsapp);
        }
      });
  }, []);

  const isValid =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    (deliveryType === "pickup" || form.address.trim());

  const handleStripeCheckout = async () => {
    if (!isValid) return;
    if (!isCartMode && (!product.price_id || !product.unit_amount)) return;
    setLoading(true);
    setError("");
    try {
      const deliveryAddress =
        deliveryType === "pickup"
          ? `${centerInfo.address}, ${centerInfo.city} ${centerInfo.postal_code}`
          : form.address.trim();

      const orderItems = isCartMode
        ? cartItems.map((i) => ({ product_id: i.id.replace("stripe_", ""), name: i.title, qty: i.qty, price: i.price, source: "stripe" }))
        : [{ product_id: product.id, name: product.name, qty: 1, price: finalTotal, source: "stripe" }];

      const { data: order, error: orderErr } = await supabase
        .from("shop_orders")
        .insert({
          user_id: user?.id ?? null,
          client_name: form.name.trim(),
          client_email: form.email.trim().toLowerCase(),
          client_phone: form.phone.trim(),
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
          items: orderItems,
          total_price: finalTotal,
          points_earned: 0,
          status: "pending_payment",
          notes: form.notes.trim() || null,
        })
        .select("id")
        .single();

      if (orderErr || !order) throw new Error(orderErr?.message ?? "Error creando el pedido");

      const baseUrl = window.location.origin + "/tienda";

      const checkoutItems = isCartMode
        ? cartItems.map((i) => ({
            productId: i.id.replace("stripe_", ""),
            name: i.title,
            price: i.price,
            qty: i.qty,
            image: i.image,
          }))
        : [
            {
              productId: product.id,
              name: product.name,
              price: finalTotal,
              qty: 1,
              image: getImage(product),
              priceId: product.price_id,
            },
          ];

      const res = await fetch(SHOP_CHECKOUT_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checkoutItems,
          discountAmount: 0,
          finalTotal,
          successUrl: `${baseUrl}?payment=success&order=${order.id}`,
          cancelUrl: `${baseUrl}?payment=cancelled&order=${order.id}`,
          customerEmail: form.email.trim(),
          deliveryType,
          deliveryAddress,
        }),
      });

      const data = await res.json() as { url?: string; error?: string };
      if (data.error || !data.url) throw new Error(data.error ?? "Error al crear sesión de pago");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar el pago");
      setLoading(false);
    }
  };

  const handleBizumCheckout = async () => {
    if (!isValid) return;
    setBizumLoading(true);
    setError("");
    try {
      const deliveryAddress =
        deliveryType === "pickup"
          ? `${centerInfo.address}, ${centerInfo.city} ${centerInfo.postal_code}`
          : form.address.trim();

      const orderItems = isCartMode
        ? cartItems.map((i) => ({ product_id: i.id.replace("stripe_", ""), name: i.title, qty: i.qty, price: i.price, source: "stripe" }))
        : [{ product_id: product.id, name: product.name, qty: 1, price: finalTotal, source: "stripe" }];

      await supabase.from("shop_orders").insert({
        user_id: user?.id ?? null,
        client_name: form.name.trim(),
        client_email: form.email.trim().toLowerCase(),
        client_phone: form.phone.trim(),
        delivery_type: deliveryType,
        delivery_address: deliveryAddress,
        items: orderItems,
        total_price: finalTotal,
        points_earned: 0,
        status: "pending_payment",
        payment_method: "bizum",
        notes: form.notes.trim() || null,
      });

      const deliveryLabel =
        deliveryType === "pickup" ? "Recogida en centro" : `Envío a: ${deliveryAddress}`;

      const productsList = isCartMode
        ? cartItems.map((i) => `• ${i.title} x${i.qty} — ${(i.price * i.qty).toFixed(2)} €`).join("\n")
        : `• ${product.name} — ${priceLabel}`;

      const message = encodeURIComponent(
        `🛒 *Nuevo pedido - Pago por Bizum*\n\n` +
        `📦 *Productos:*\n${productsList}\n` +
        `💰 *Total: ${priceLabel}*\n\n` +
        `👤 *Cliente:* ${form.name.trim()}\n` +
        `📧 Email: ${form.email.trim()}\n` +
        `📱 Teléfono: ${form.phone.trim()}\n` +
        `🚚 Entrega: ${deliveryLabel}\n` +
        (form.notes.trim() ? `📝 Notas: ${form.notes.trim()}\n` : "") +
        `\n✅ El cliente quiere pagar por Bizum. Por favor, confirma el número de Bizum para completar el pago.`
      );

      const phone = bizumWhatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      setShowBizumSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar el pago por Bizum");
    } finally {
      setBizumLoading(false);
    }
  };

  if (showBizumSuccess) {
    return (
      <BizumSuccessModal
        type="tienda"
        total={priceLabel}
        onClose={() => { setShowBizumSuccess(false); if (onSuccess) onSuccess(); else onClose(); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">Finalizar pedido</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
            <i className="ri-close-line text-gray-500"></i>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Product summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            {isCartMode ? (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
                      <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                        <i className="ri-download-line text-xs"></i>Producto digital · x{item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 shrink-0">{(item.price * item.qty).toFixed(2)} €</p>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total a pagar</span>
                  <span className="text-lg font-bold text-rose-600">{priceLabel}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                  <img src={getImage(product)} alt={product.name} className="w-full h-full object-cover object-top" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <i className="ri-secure-payment-line text-rose-400 text-xs"></i>
                    <span className="text-xs text-rose-400 font-medium">Producto Stripe</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                  {product.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-900">{priceLabel}</p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery type */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Tipo de entrega</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeliveryType("pickup")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  deliveryType === "pickup" ? "border-teal-400 bg-teal-50" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <i className={`ri-store-line text-2xl ${deliveryType === "pickup" ? "text-teal-500" : "text-gray-400"}`}></i>
                <div className="text-center">
                  <p className={`text-sm font-semibold ${deliveryType === "pickup" ? "text-teal-700" : "text-gray-700"}`}>Recogida en centro</p>
                  <p className="text-xs text-gray-400 mt-0.5">Sin coste adicional</p>
                </div>
              </button>
              <button
                onClick={() => setDeliveryType("delivery")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  deliveryType === "delivery" ? "border-rose-400 bg-rose-50" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <i className={`ri-truck-line text-2xl ${deliveryType === "delivery" ? "text-rose-500" : "text-gray-400"}`}></i>
                <div className="text-center">
                  <p className={`text-sm font-semibold ${deliveryType === "delivery" ? "text-rose-700" : "text-gray-700"}`}>Envío a domicilio</p>
                  <p className="text-xs text-gray-400 mt-0.5">Introduce tu dirección</p>
                </div>
              </button>
            </div>

            {deliveryType === "pickup" && (
              <div className="mt-3 flex items-start gap-2 bg-teal-50 rounded-xl px-4 py-3">
                <i className="ri-map-pin-line text-teal-500 mt-0.5 shrink-0"></i>
                <div>
                  <p className="text-xs font-semibold text-teal-800">{centerInfo.center_name}</p>
                  <p className="text-xs text-teal-700 mt-0.5">{centerInfo.address}, {centerInfo.city} {centerInfo.postal_code}</p>
                  {centerInfo.schedule && <p className="text-xs text-teal-600 mt-0.5">{centerInfo.schedule}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Client form */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-600">Tus datos</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Tu nombre"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Teléfono *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+34 600 000 000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="tu@email.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
            {deliveryType === "delivery" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dirección de envío *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Calle, número, ciudad, código postal"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notas adicionales</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Instrucciones especiales, preferencias..."
                rows={2}
                maxLength={300}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400 resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-center gap-2">
              <i className="ri-error-warning-line"></i>{error}
            </div>
          )}

          {/* Stripe disabled notice OR Stripe button */}
          {stripeDisabled ? (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <i className="ri-information-line text-amber-500 text-base shrink-0 mt-0.5"></i>
              <p className="text-xs text-amber-800 leading-relaxed">{stripeDisabledMessage}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <i className="ri-shield-check-line text-gray-400 text-sm"></i>
                <p className="text-xs text-gray-500">Pago seguro con <strong>Stripe</strong>. Serás redirigido a la pasarela de pago.</p>
              </div>

              <button
                onClick={handleStripeCheckout}
                disabled={loading || bizumLoading || !isValid || (!isCartMode && !product.price_id)}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <><i className="ri-loader-4-line animate-spin"></i>Redirigiendo a Stripe...</>
                ) : (
                  <><i className="ri-secure-payment-line"></i>Pagar {priceLabel} con Stripe</>
                )}
              </button>
            </>
          )}

          {/* Bizum button */}
          {bizumWhatsapp && (
            <>
              <button
                onClick={handleBizumCheckout}
                disabled={loading || bizumLoading || !isValid}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {bizumLoading ? (
                  <><i className="ri-loader-4-line animate-spin"></i>Procesando...</>
                ) : (
                  <><i className="ri-smartphone-line"></i>Pagar {priceLabel} por Bizum</>
                )}
              </button>
              <p className="text-xs text-center text-gray-400">
                <i className="ri-whatsapp-line text-emerald-500 mr-1"></i>
                Se enviará el detalle por WhatsApp para coordinar el pago
              </p>
            </>
          )}

          {!user && (
            <p className="text-xs text-center text-gray-400">
              <i className="ri-information-line mr-1"></i>
              <a href="/login" className="text-rose-500 hover:underline cursor-pointer">Inicia sesión</a> para una experiencia más rápida
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
