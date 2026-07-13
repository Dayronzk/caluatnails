import { useState, useEffect } from "react";
import type { CartItem } from "@/hooks/useCart";
import { usePoints } from "@/hooks/usePoints";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import BizumSuccessModal from "@/components/feature/BizumSuccessModal";

interface Props {
  items: CartItem[];
  total: number;
  stripeDisabled?: boolean;
  stripeDisabledMessage?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const CHECKOUT_FN = `${SUPABASE_URL}/functions/v1/stripe-checkout`;

// 100 points = 1 €
const POINTS_TO_EUR = 100;

export default function CheckoutModal({ items, total, stripeDisabled = false, stripeDisabledMessage = "", onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const { points, validateCoupon, applyCouponUse, redeemPoints } = usePoints();

  const [email, setEmail] = useState("");
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
  const maxPointsDiscount = Math.min(Math.floor(points / POINTS_TO_EUR * 100) / 100, total * 0.5);
  const pointsDiscount = usePointsToggle ? maxPointsDiscount : 0;
  const pointsUsed = usePointsToggle ? Math.ceil(maxPointsDiscount * POINTS_TO_EUR) : 0;

  const couponDiscount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, total - couponDiscount - pointsDiscount);

  useEffect(() => {
    supabase
      .from("center_settings")
      .select("bizum_whatsapp")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.bizum_whatsapp) setBizumWhatsapp(data.bizum_whatsapp);
      });
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const result = await validateCoupon(couponCode, total);
    if (result.valid && result.coupon && result.discount !== undefined) {
      setAppliedCoupon({ ...result.coupon, discount: result.discount });
      setCouponError("");
    } else {
      setCouponError(result.error ?? "Código inválido");
    }
    setCouponLoading(false);
  };

  const handleBizumCheckout = async () => {
    setBizumLoading(true);
    setError("");
    try {
      if (usePointsToggle && pointsUsed > 0) {
        await redeemPoints(pointsUsed, `Descuento en compra de ${items.length} módulo(s)`);
      }
      if (appliedCoupon) {
        await applyCouponUse(appliedCoupon.id);
      }

      const itemsList = items.map(i => `• ${i.title} — ${i.price.toFixed(2)} €`).join("\n");
      const discountLine = (couponDiscount + pointsDiscount) > 0
        ? `\n🏷️ Descuento aplicado: -${(couponDiscount + pointsDiscount).toFixed(2)} €`
        : "";
      const customerEmail = email.trim() || user?.email || "No indicado";

      const message = encodeURIComponent(
        `🛒 *Nuevo pedido - Pago por Bizum*\n\n` +
        `📦 *Módulos:*\n${itemsList}${discountLine}\n\n` +
        `💰 *Total a pagar: ${finalTotal.toFixed(2)} €*\n\n` +
        `📧 Email: ${customerEmail}\n\n` +
        `✅ El cliente quiere pagar por Bizum. Por favor, confirma el número de Bizum para completar el pago.`
      );

      const phone = bizumWhatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");

      setShowBizumSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago por Bizum.");
    } finally {
      setBizumLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      // Redeem points if toggled
      if (usePointsToggle && pointsUsed > 0) {
        await redeemPoints(pointsUsed, `Descuento en compra de ${items.length} módulo(s)`);
      }
      // Register coupon use
      if (appliedCoupon) {
        await applyCouponUse(appliedCoupon.id);
      }

      const base = `${window.location.origin}${window.location.pathname}`;
      const successUrl = `${base}?payment=success`;
      const cancelUrl = `${base}?payment=cancelled`;

      const res = await fetch(CHECKOUT_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            title: i.title,
            price: i.price,
            image: i.image,
            stripe_price_id: i.stripe_price_id ?? undefined,
          })),
          discountAmount: couponDiscount + pointsDiscount,
          finalTotal,
          successUrl,
          cancelUrl,
          customerEmail: email.trim() || user?.email || undefined,
        }),
      });

      const data = await res.json() as { url?: string; error?: string };
      if (data.error) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar el pago. Intenta de nuevo.");
      setLoading(false);
    }
  };

  if (showBizumSuccess) {
    return (
      <BizumSuccessModal
        type="curso"
        total={`${finalTotal.toFixed(2)} €`}
        onClose={() => { setShowBizumSuccess(false); onSuccess(); onClose(); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-xl text-gray-900">Finalizar compra</h2>
            <p className="text-gray-400 text-xs mt-0.5">{items.length} módulo{items.length !== 1 ? "s" : ""} seleccionados</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
            <i className="ri-close-line text-lg text-gray-500"></i>
          </button>
        </div>

        <div className="px-7 pt-5 pb-4 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Order summary */}
          <div className="bg-rose-50/60 rounded-2xl p-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover object-top" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.lessonCount} lecciones · {item.level}</p>
                </div>
                <span className="text-sm font-semibold text-rose-600 whitespace-nowrap">{item.price.toFixed(2)} €</span>
              </div>
            ))}

            {/* Discounts */}
            {(couponDiscount > 0 || pointsDiscount > 0) && (
              <div className="pt-3 border-t border-rose-200 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="flex items-center gap-1">
                      <i className="ri-coupon-3-line"></i> Cupón {appliedCoupon?.code}
                    </span>
                    <span>-{couponDiscount.toFixed(2)} €</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span className="flex items-center gap-1">
                      <i className="ri-coin-line"></i> {pointsUsed} puntos canjeados
                    </span>
                    <span>-{pointsDiscount.toFixed(2)} €</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-rose-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total a pagar</span>
              <span className="text-lg font-bold text-rose-600">{finalTotal.toFixed(2)} €</span>
            </div>
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
                    {appliedCoupon.type === 'percentage' ? `-${appliedCoupon.value}%` : `-${appliedCoupon.discount.toFixed(2)} €`}
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

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Correo electrónico <span className="text-gray-400 font-normal">(para recibir el recibo)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={user?.email ?? "correo@ejemplo.com"}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 flex items-start gap-1.5">
              <i className="ri-error-warning-line mt-0.5"></i>{error}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="px-7 pb-7 pt-4 border-t border-gray-100 space-y-3">
          {stripeDisabled ? (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <i className="ri-information-line text-amber-500 text-base shrink-0 mt-0.5"></i>
              <p className="text-xs text-amber-800 leading-relaxed">{stripeDisabledMessage}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-1">
                <i className="ri-lock-line text-gray-400 text-sm"></i>
                <span className="text-xs text-gray-400">Pago seguro procesado por</span>
                <span className="text-xs font-bold text-gray-600 tracking-wide">Stripe</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={loading || bizumLoading}
                className="w-full py-4 bg-gray-900 hover:bg-black disabled:opacity-60 text-white font-semibold rounded-2xl transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <><i className="ri-loader-4-line animate-spin text-lg"></i> Conectando con Stripe...</>
                ) : (
                  <><i className="ri-shield-check-line text-lg"></i> Pagar {finalTotal.toFixed(2)} € con Stripe</>
                )}
              </button>
            </>
          )}

          {bizumWhatsapp && (
            <button
              onClick={handleBizumCheckout}
              disabled={loading || bizumLoading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-2xl transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2.5"
            >
              {bizumLoading ? (
                <><i className="ri-loader-4-line animate-spin text-lg"></i> Procesando...</>
              ) : (
                <><i className="ri-smartphone-line text-lg"></i> Pagar {finalTotal.toFixed(2)} € por Bizum</>
              )}
            </button>
          )}
          {bizumWhatsapp && (
            <p className="text-xs text-center text-gray-400">
              <i className="ri-whatsapp-line text-emerald-500 mr-1"></i>
              Se enviará el detalle por WhatsApp para coordinar el pago
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
