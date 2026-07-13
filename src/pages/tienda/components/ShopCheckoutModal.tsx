import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePoints } from "@/hooks/usePoints";
import type { User } from "@supabase/supabase-js";
import BizumSuccessModal from "@/components/feature/BizumSuccessModal";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const SHOP_CHECKOUT_FN = `${SUPABASE_URL}/functions/v1/stripe-shop-checkout`;

// 100 points = 1 €
const POINTS_TO_EUR = 100;

export interface ShopCheckoutItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  category: string;
  reward_points: number;
}

interface Props {
  product: ShopCheckoutItem;
  qty: number;
  user: User | null;
  getImage: (p: ShopCheckoutItem) => string;
  onClose: () => void;
}

type DeliveryType = "pickup" | "delivery";

interface CenterInfo {
  center_name: string;
  address: string;
  city: string;
  postal_code: string;
  schedule: string;
}

export default function ShopCheckoutModal({ product, qty, user, getImage, onClose }: Props) {
  const { points, validateCoupon, applyCouponUse, redeemPoints } = usePoints();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [centerInfo, setCenterInfo] = useState<CenterInfo>({
    center_name: "NAILOX Centro",
    address: "Calle Ejemplo 123",
    city: "Madrid",
    postal_code: "28001",
    schedule: "",
  });

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
  const [bizumWhatsapp, setBizumWhatsapp] = useState("");
  const [showBizumSuccess, setShowBizumSuccess] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string; code: string; type: string; value: number; discount: number;
  } | null>(null);

  // Points redemption
  const [usePointsToggle, setUsePointsToggle] = useState(false);

  const baseTotal = Number(product.price) * qty;
  const totalPoints = product.reward_points * qty;

  const maxPointsDiscount = Math.min(
    Math.floor((points / POINTS_TO_EUR) * 100) / 100,
    baseTotal * 0.5
  );
  const pointsDiscount = usePointsToggle ? maxPointsDiscount : 0;
  const pointsUsed = usePointsToggle ? Math.ceil(maxPointsDiscount * POINTS_TO_EUR) : 0;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, baseTotal - couponDiscount - pointsDiscount);

  const isValid =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    (deliveryType === "pickup" || form.address.trim());

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const itemsIds = [product.id];
    const result = await validateCoupon(couponCode, baseTotal, itemsIds);
    if (result.valid && result.coupon && result.discount !== undefined) {
      setAppliedCoupon({ ...result.coupon, discount: result.discount });
      setCouponError("");
    } else {
      setCouponError(result.error ?? "Código inválido");
    }
    setCouponLoading(false);
  };

  const handleBizumCheckout = async () => {
    if (!isValid) return;
    setBizumLoading(true);
    setError("");
    try {
      if (usePointsToggle && pointsUsed > 0) {
        await redeemPoints(pointsUsed, `Descuento en compra de tienda: ${product.name}`);
      }
      if (appliedCoupon) {
        await applyCouponUse(appliedCoupon.id);
      }

      const deliveryAddress =
        deliveryType === "pickup"
          ? `${centerInfo.address}, ${centerInfo.city} ${centerInfo.postal_code}`
          : form.address.trim();

      await supabase.from("shop_orders").insert({
        user_id: user?.id ?? null,
        client_name: form.name.trim(),
        client_email: form.email.trim().toLowerCase(),
        client_phone: form.phone.trim(),
        delivery_type: deliveryType,
        delivery_address: deliveryAddress,
        items: [{ product_id: product.id, name: product.name, qty, price: product.price }],
        total_price: finalTotal,
        points_earned: totalPoints,
        status: "pending_payment",
        payment_method: "bizum",
        notes: form.notes.trim() || null,
      });

      const deliveryLabel = deliveryType === "pickup" ? "Recogida en centro" : `Envío a: ${deliveryAddress}`;
      const discountLine = (couponDiscount + pointsDiscount) > 0
        ? `\n🏷️ Descuento: -${(couponDiscount + pointsDiscount).toFixed(2)} €`
        : "";

      const message = encodeURIComponent(
        `🛒 *Nuevo pedido Tienda - Pago por Bizum*\n\n` +
        `📦 *Producto:* ${product.name} x${qty}${discountLine}\n` +
        `💰 *Total: ${finalTotal.toFixed(2)} €*\n\n` +
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

  const handleStripeCheckout = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      // Redeem points if toggled
      if (usePointsToggle && pointsUsed > 0) {
        await redeemPoints(pointsUsed, `Descuento en compra de tienda: ${product.name}`);
      }
      // Register coupon use
      if (appliedCoupon) {
        await applyCouponUse(appliedCoupon.id);
      }

      const deliveryAddress =
        deliveryType === "pickup"
          ? `${centerInfo.address}, ${centerInfo.city} ${centerInfo.postal_code}`
          : form.address.trim();

      const { data: order, error: orderErr } = await supabase
        .from("shop_orders")
        .insert({
          user_id: user?.id ?? null,
          client_name: form.name.trim(),
          client_email: form.email.trim().toLowerCase(),
          client_phone: form.phone.trim(),
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
          items: [{ product_id: product.id, name: product.name, qty, price: product.price }],
          total_price: finalTotal,
          points_earned: totalPoints,
          status: "pending_payment",
          notes: form.notes.trim() || null,
        })
        .select("id")
        .single();

      if (orderErr || !order) throw new Error(orderErr?.message ?? "Error creando el pedido");

      const baseUrl = window.location.origin + "/tienda";
      const res = await fetch(SHOP_CHECKOUT_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              productId: product.id,
              name: product.name,
              price: finalTotal / qty,
              qty,
              image: getImage(product),
            },
          ],
          discountAmount: couponDiscount + pointsDiscount,
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

  if (showBizumSuccess) {
    return (
      <BizumSuccessModal
        type="tienda"
        total={`${finalTotal.toFixed(2)} €`}
        onClose={() => { setShowBizumSuccess(false); onClose(); }}
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
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <img src={getImage(product)} alt={product.name} className="w-full h-full object-cover object-top" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">x{qty} unidad{qty !== 1 ? "es" : ""}</p>
                {totalPoints > 0 && (
                  <p className="text-xs text-amber-600 font-medium mt-0.5">
                    <i className="ri-coin-line mr-1"></i>+{totalPoints} pts al completar
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                {(couponDiscount > 0 || pointsDiscount > 0) && (
                  <p className="text-xs text-gray-400 line-through">{baseTotal.toFixed(2)} €</p>
                )}
                <p className="text-lg font-bold text-gray-900">{finalTotal.toFixed(2)} €</p>
              </div>
            </div>

            {/* Discount breakdown */}
            {(couponDiscount > 0 || pointsDiscount > 0) && (
              <div className="pt-3 border-t border-gray-200 space-y-1.5">
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span className="flex items-center gap-1">
                      <i className="ri-coupon-3-line"></i> Cupón {appliedCoupon?.code}
                    </span>
                    <span>-{couponDiscount.toFixed(2)} €</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span className="flex items-center gap-1">
                      <i className="ri-coin-line"></i> {pointsUsed} puntos canjeados
                    </span>
                    <span>-{pointsDiscount.toFixed(2)} €</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coupon code */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
              <i className="ri-coupon-3-line text-rose-400"></i> Código de cupón
            </p>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <i className="ri-checkbox-circle-fill text-emerald-500"></i>
                  <span className="text-sm font-semibold text-emerald-700">{appliedCoupon.code}</span>
                  <span className="text-xs text-emerald-600">
                    {appliedCoupon.type === "percentage" ? `-${appliedCoupon.value}%` : `-${appliedCoupon.discount.toFixed(2)} €`}
                  </span>
                </div>
                <button
                  onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                  className="text-xs text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="CÓDIGO"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm font-mono tracking-widest transition-all"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  {couponLoading ? <i className="ri-loader-4-line animate-spin"></i> : "Aplicar"}
                </button>
              </div>
            )}
            {couponError && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <i className="ri-error-warning-line"></i>{couponError}
              </p>
            )}
          </div>

          {/* Points redemption */}
          {user && points >= POINTS_TO_EUR && (
            <div className={`rounded-xl border p-4 transition-colors ${usePointsToggle ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-amber-100 rounded-lg">
                    <i className="ri-coin-line text-amber-500"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Usar mis puntos</p>
                    <p className="text-xs text-gray-500">
                      Tienes <strong className="text-amber-600">{points} pts</strong> = {(points / POINTS_TO_EUR).toFixed(2)} €
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePointsToggle}
                    onChange={(e) => setUsePointsToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${usePointsToggle ? "bg-amber-400" : "bg-gray-300"} relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${usePointsToggle ? "after:translate-x-5" : ""}`}></div>
                </label>
              </div>
              {usePointsToggle && (
                <p className="text-xs text-amber-700 mt-2 bg-amber-100 rounded-lg px-3 py-1.5">
                  Se canjearán <strong>{pointsUsed} puntos</strong> por un descuento de <strong>{pointsDiscount.toFixed(2)} €</strong> (máx. 50% del total)
                </p>
              )}
            </div>
          )}

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
                placeholder="Instrucciones especiales, alergias, preferencias..."
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

          {/* Stripe payment notice */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
            <i className="ri-shield-check-line text-gray-400 text-sm"></i>
            <p className="text-xs text-gray-500">Pago seguro con <strong>Stripe</strong>. Serás redirigido a la pasarela de pago.</p>
          </div>

          {/* Submit Stripe */}
          <button
            onClick={handleStripeCheckout}
            disabled={loading || bizumLoading || !isValid}
            className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <><i className="ri-loader-4-line animate-spin"></i>Redirigiendo a Stripe...</>
            ) : (
              <><i className="ri-secure-payment-line"></i>Pagar {finalTotal.toFixed(2)} € con Stripe</>
            )}
          </button>

          {/* Submit Bizum */}
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
                  <><i className="ri-smartphone-line"></i>Pagar {finalTotal.toFixed(2)} € por Bizum</>
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
              <a href="/login" className="text-rose-500 hover:underline cursor-pointer">Inicia sesión</a> para acumular puntos y canjear descuentos
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
