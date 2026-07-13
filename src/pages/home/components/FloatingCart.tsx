import { useState, useEffect } from "react";
import type { CartItem, ShopCartItem } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { usePoints } from "@/hooks/usePoints";
import { supabase } from "@/lib/supabase";
import CheckoutModal from "./CheckoutModal";
import BizumSuccessModal from "@/components/feature/BizumSuccessModal";
import StripeProductCheckoutModal from "@/pages/tienda/components/StripeProductCheckoutModal";
import type { StripeProduct } from "@/pages/tienda/components/StripeProductsCarousel";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const SHOP_CHECKOUT_FN = `${SUPABASE_URL}/functions/v1/stripe-shop-checkout`;
const POINTS_TO_EUR = 100;

type DeliveryType = "pickup" | "delivery";

interface CenterInfo {
  center_name: string;
  address: string;
  city: string;
  postal_code: string;
  schedule: string;
}

interface Props {
  items: CartItem[];
  shopItems: ShopCartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  removeItem: (id: string) => void;
  removeShopItem: (id: string) => void;
  updateShopQty: (id: string, qty: number) => void;
  clearCart: () => void;
  clearCourseCart: () => void;
  clearShopCart: () => void;
}

// Stripe digital products have id prefixed with "stripe_"
function isStripeDigital(item: ShopCartItem) {
  return item.id.startsWith("stripe_");
}

// Convert ShopCartItem (stripe_) to a fake StripeProduct for the modal
function shopItemsToStripeProduct(items: ShopCartItem[]): StripeProduct {
  // If multiple items, create a combined "virtual" product
  const first = items[0];
  const totalAmount = items.reduce((s, i) => s + i.price * i.qty * 100, 0);
  return {
    id: first.id.replace("stripe_", ""),
    name: items.length === 1 ? first.title : `${items.length} productos digitales`,
    description: items.length === 1 ? null : items.map((i) => `${i.title} x${i.qty}`).join(", "),
    images: [first.image],
    metadata: {},
    price_id: null, // will be handled differently
    unit_amount: Math.round(totalAmount),
    currency: "eur",
  };
}

export default function FloatingCart({
  items,
  shopItems,
  count,
  total,
  isOpen,
  setIsOpen,
  removeItem,
  removeShopItem,
  updateShopQty,
  clearCart,
  clearCourseCart,
  clearShopCart,
}: Props) {
  const { user } = useAuth();
  const { points, validateCoupon, applyCouponUse, redeemPoints } = usePoints();

  const [showCheckout, setShowCheckout] = useState(false);
  const [showShopCheckout, setShowShopCheckout] = useState(false);
  const [showStripeDigitalCheckout, setShowStripeDigitalCheckout] = useState(false);
  const [showBizumSuccess, setShowBizumSuccess] = useState(false);
  const [bizumTotal, setBizumTotal] = useState("");

  // Stripe disabled config — only affects internal payment buttons inside modals
  const [stripeDisabled, setStripeDisabled] = useState(false);
  const [stripeDisabledMessage, setStripeDisabledMessage] = useState("El pago online estará disponible próximamente. Contáctanos para reservar tu plaza.");

  // Separate stripe digital vs physical shop items
  const stripeItems = shopItems.filter(isStripeDigital);
  const physicalItems = shopItems.filter((i) => !isStripeDigital(i));

  const hasPhysical = physicalItems.length > 0;
  const hasStripeDigital = stripeItems.length > 0;

  // Shop checkout state (physical only)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [centerInfo, setCenterInfo] = useState<CenterInfo>({
    center_name: "NAILOX Centro",
    address: "Calle Ejemplo 123",
    city: "Madrid",
    postal_code: "28001",
    schedule: "",
  });
  const [shopForm, setShopForm] = useState({
    name: user?.user_metadata?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    notes: "",
  });
  const [shopLoading, setShopLoading] = useState(false);
  const [bizumLoading, setBizumLoading] = useState(false);
  const [shopError, setShopError] = useState("");
  const [bizumWhatsapp, setBizumWhatsapp] = useState("");

  // Coupon state (physical shop)
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string; code: string; type: string; value: number; discount: number;
  } | null>(null);

  // Points redemption (physical shop)
  const [usePointsToggle, setUsePointsToggle] = useState(false);

  const courseTotal = items.reduce((s, i) => s + i.price, 0);
  const physicalTotal = physicalItems.reduce((s, i) => s + i.price * i.qty, 0);
  const stripeDigitalTotal = stripeItems.reduce((s, i) => s + i.price * i.qty, 0);

  const maxPointsDiscount = Math.min(
    Math.floor((points / POINTS_TO_EUR) * 100) / 100,
    physicalTotal * 0.5
  );
  const pointsDiscount = usePointsToggle ? maxPointsDiscount : 0;
  const pointsUsed = usePointsToggle ? Math.ceil(maxPointsDiscount * POINTS_TO_EUR) : 0;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const physicalFinalTotal = Math.max(0, physicalTotal - couponDiscount - pointsDiscount);

  const isShopFormValid =
    shopForm.name.trim() &&
    shopForm.email.trim() &&
    shopForm.phone.trim() &&
    (deliveryType === "pickup" || shopForm.address.trim());

  useEffect(() => {
    if (showShopCheckout) {
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
      setShopForm({
        name: user?.user_metadata?.name ?? "",
        email: user?.email ?? "",
        phone: "",
        address: "",
        notes: "",
      });
    }
  }, [showShopCheckout, user]);

  useEffect(() => {
    supabase
      .from("center_settings")
      .select("stripe_disabled, stripe_disabled_message")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStripeDisabled(data.stripe_disabled ?? false);
          if (data.stripe_disabled_message) setStripeDisabledMessage(data.stripe_disabled_message);
        }
      });
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const result = await validateCoupon(couponCode, physicalTotal);
    if (result.valid && result.coupon && result.discount !== undefined) {
      setAppliedCoupon({ ...result.coupon, discount: result.discount });
      setCouponError("");
    } else {
      setCouponError(result.error ?? "Código inválido");
    }
    setCouponLoading(false);
  };

  // Checkout for physical shop items
  const handlePhysicalCheckout = async () => {
    if (!isShopFormValid) return;
    setShopLoading(true);
    setShopError("");
    try {
      if (usePointsToggle && pointsUsed > 0) {
        await redeemPoints(pointsUsed, `Descuento en compra de tienda`);
      }
      if (appliedCoupon) {
        await applyCouponUse(appliedCoupon.id);
      }

      const deliveryAddress =
        deliveryType === "pickup"
          ? `${centerInfo.address}, ${centerInfo.city} ${centerInfo.postal_code}`
          : shopForm.address.trim();

      const totalPointsEarned = physicalItems.reduce((s, i) => s + i.rewardPoints * i.qty, 0);

      const { data: order, error: orderErr } = await supabase
        .from("shop_orders")
        .insert({
          user_id: user?.id ?? null,
          client_name: shopForm.name.trim(),
          client_email: shopForm.email.trim().toLowerCase(),
          client_phone: shopForm.phone.trim(),
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
          items: physicalItems.map((i) => ({ product_id: i.id, name: i.title, qty: i.qty, price: i.price })),
          total_price: physicalFinalTotal,
          points_earned: totalPointsEarned,
          status: "pending_payment",
          notes: shopForm.notes.trim() || null,
        })
        .select("id")
        .single();

      if (orderErr || !order) throw new Error(orderErr?.message ?? "Error creando el pedido");

      const baseUrl = window.location.origin + "/tienda";
      const res = await fetch(SHOP_CHECKOUT_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: physicalItems.map((i) => ({
            productId: i.id,
            name: i.title,
            price: i.price,
            qty: i.qty,
            image: i.image,
          })),
          discountAmount: couponDiscount + pointsDiscount,
          finalTotal: physicalFinalTotal,
          successUrl: `${baseUrl}?payment=success&order=${order.id}`,
          cancelUrl: `${baseUrl}?payment=cancelled&order=${order.id}`,
          customerEmail: shopForm.email.trim(),
          deliveryType,
          deliveryAddress,
        }),
      });

      const data = await res.json() as { url?: string; error?: string };
      if (data.error || !data.url) throw new Error(data.error ?? "Error al crear sesión de pago");
      window.location.href = data.url;
    } catch (e) {
      setShopError(e instanceof Error ? e.message : "Error al procesar el pago");
      setShopLoading(false);
    }
  };

  // Bizum for physical items
  const handlePhysicalBizum = async () => {
    if (!isShopFormValid) return;
    setBizumLoading(true);
    setShopError("");
    try {
      if (usePointsToggle && pointsUsed > 0) {
        await redeemPoints(pointsUsed, `Descuento en compra de tienda`);
      }
      if (appliedCoupon) {
        await applyCouponUse(appliedCoupon.id);
      }

      const deliveryAddress =
        deliveryType === "pickup"
          ? `${centerInfo.address}, ${centerInfo.city} ${centerInfo.postal_code}`
          : shopForm.address.trim();

      const totalPointsEarned = physicalItems.reduce((s, i) => s + i.rewardPoints * i.qty, 0);

      await supabase.from("shop_orders").insert({
        user_id: user?.id ?? null,
        client_name: shopForm.name.trim(),
        client_email: shopForm.email.trim().toLowerCase(),
        client_phone: shopForm.phone.trim(),
        delivery_type: deliveryType,
        delivery_address: deliveryAddress,
        items: physicalItems.map((i) => ({ product_id: i.id, name: i.title, qty: i.qty, price: i.price })),
        total_price: physicalFinalTotal,
        points_earned: totalPointsEarned,
        status: "pending_payment",
        payment_method: "bizum",
        notes: shopForm.notes.trim() || null,
      });

      const deliveryLabel = deliveryType === "pickup" ? "Recogida en centro" : `Envío a: ${deliveryAddress}`;
      const itemsList = physicalItems.map((i) => `• ${i.title} x${i.qty} — ${(i.price * i.qty).toFixed(2)} €`).join("\n");
      const discountLine = (couponDiscount + pointsDiscount) > 0
        ? `\n🏷️ Descuento: -${(couponDiscount + pointsDiscount).toFixed(2)} €` : "";

      const message = encodeURIComponent(
        `🛒 *Nuevo pedido Tienda - Pago por Bizum*\n\n` +
        `📦 *Productos:*\n${itemsList}${discountLine}\n\n` +
        `💰 *Total: ${physicalFinalTotal.toFixed(2)} €*\n\n` +
        `👤 *Cliente:* ${shopForm.name.trim()}\n` +
        `📧 Email: ${shopForm.email.trim()}\n` +
        `📱 Teléfono: ${shopForm.phone.trim()}\n` +
        `🚚 Entrega: ${deliveryLabel}\n` +
        (shopForm.notes.trim() ? `📝 Notas: ${shopForm.notes.trim()}\n` : "") +
        `\n✅ El cliente quiere pagar por Bizum.`
      );

      const phone = bizumWhatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      setBizumTotal(`${physicalFinalTotal.toFixed(2)} €`);
      setShowShopCheckout(false);
      setShowBizumSuccess(true);
    } catch (e) {
      setShopError(e instanceof Error ? e.message : "Error al procesar el pago por Bizum");
    } finally {
      setBizumLoading(false);
    }
  };

  const handleCourseSuccess = () => {
    clearCourseCart();
    setIsOpen(false);
  };

  const openShopCheckout = () => {
    setIsOpen(false);
    setShowShopCheckout(true);
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    setUsePointsToggle(false);
    setShopError("");
  };

  const openStripeDigitalCheckout = () => {
    setIsOpen(false);
    setShowStripeDigitalCheckout(true);
  };

  // Build a combined StripeProduct for the modal when multiple stripe items in cart
  const stripeDigitalProduct: StripeProduct | null = stripeItems.length > 0
    ? shopItemsToStripeProduct(stripeItems)
    : null;

  if (showBizumSuccess) {
    return (
      <BizumSuccessModal
        type="tienda"
        total={bizumTotal}
        onClose={() => { setShowBizumSuccess(false); clearShopCart(); }}
      />
    );
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all cursor-pointer"
        style={{ boxShadow: "0 8px 32px rgba(244,63,94,0.35)" }}
        aria-label="Ver carrito"
      >
        <div className="w-14 h-14 flex items-center justify-center">
          <i className="ri-shopping-cart-2-line text-xl"></i>
        </div>
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-gray-900 text-white text-xs font-bold rounded-full whitespace-nowrap">
            {count}
          </span>
        )}
      </button>

      {/* Cart drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center bg-rose-50 rounded-xl">
                  <i className="ri-shopping-cart-2-line text-rose-600 text-base"></i>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-base leading-none">Mi carrito</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{count} {count === 1 ? "artículo" : "artículos"}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-lg text-gray-500"></i>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {count === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
                  <div className="w-20 h-20 flex items-center justify-center bg-rose-50 rounded-full">
                    <i className="ri-shopping-cart-2-line text-3xl text-rose-300"></i>
                  </div>
                  <p className="text-gray-400 text-sm text-center leading-relaxed">
                    Tu carrito está vacío.<br />Agrega cursos o productos de la tienda.
                  </p>
                </div>
              ) : (
                <>
                  {/* Course items */}
                  {items.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                          <i className="ri-graduation-cap-line text-rose-400"></i> Cursos
                        </p>
                        {items.length > 1 && (
                          <button onClick={clearCourseCart} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                            Quitar todos
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-3.5 bg-stone-50 rounded-2xl">
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover object-top" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-0.5 line-clamp-2">{item.title}</h4>
                              <p className="text-xs text-gray-400">{item.lessonCount} lecciones · {item.level}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-rose-600 font-bold text-sm">{item.price.toFixed(2)} €</span>
                                <button onClick={() => removeItem(item.id)} className="text-xs text-gray-400 hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-1">
                                  <i className="ri-delete-bin-line"></i> Quitar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stripe digital items */}
                  {stripeItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                          <i className="ri-secure-payment-line text-rose-400"></i> Productos digitales
                        </p>
                        {stripeItems.length > 1 && (
                          <button
                            onClick={() => stripeItems.forEach((i) => removeShopItem(i.id))}
                            className="text-xs text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                          >
                            Quitar todos
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {stripeItems.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-3.5 bg-rose-50/40 rounded-2xl">
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover object-top" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-0.5 line-clamp-2">{item.title}</h4>
                              <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                                <i className="ri-download-line text-xs"></i>Producto digital
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-rose-600 font-bold text-sm">{(item.price * item.qty).toFixed(2)} €</span>
                                <button onClick={() => removeShopItem(item.id)} className="text-xs text-gray-400 hover:text-rose-500 transition-colors cursor-pointer">
                                  <i className="ri-delete-bin-line"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Physical shop items */}
                  {physicalItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                          <i className="ri-store-2-line text-rose-400"></i> Tienda
                        </p>
                        {physicalItems.length > 1 && (
                          <button onClick={clearShopCart} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                            Quitar todos
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {physicalItems.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-3.5 bg-rose-50/50 rounded-2xl">
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover object-top" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-0.5 line-clamp-2">{item.title}</h4>
                              <p className="text-xs text-gray-400">{item.category}</p>
                              {item.rewardPoints > 0 && (
                                <p className="text-xs text-amber-600 font-medium">+{item.rewardPoints * item.qty} pts</p>
                              )}
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-rose-600 font-bold text-sm">{(item.price * item.qty).toFixed(2)} €</span>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 px-1">
                                    <button onClick={() => updateShopQty(item.id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-rose-500 cursor-pointer transition-colors">
                                      <i className="ri-subtract-line text-xs"></i>
                                    </button>
                                    <span className="text-xs font-semibold text-gray-800 w-4 text-center">{item.qty}</span>
                                    <button onClick={() => updateShopQty(item.id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-rose-500 cursor-pointer transition-colors">
                                      <i className="ri-add-line text-xs"></i>
                                    </button>
                                  </div>
                                  <button onClick={() => removeShopItem(item.id)} className="text-xs text-gray-400 hover:text-rose-500 transition-colors cursor-pointer">
                                    <i className="ri-delete-bin-line"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {count > 0 && (
              <div className="px-6 pb-8 pt-4 border-t border-gray-100 space-y-3">
                {/* Totals breakdown */}
                {(items.length > 0 || stripeItems.length > 0 || physicalItems.length > 0) && (
                  <div className="space-y-1 text-xs text-gray-500">
                    {items.length > 0 && (
                      <div className="flex justify-between">
                        <span>Cursos</span><span className="font-medium text-gray-700">€{courseTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {stripeItems.length > 0 && (
                      <div className="flex justify-between">
                        <span>Productos digitales</span><span className="font-medium text-gray-700">€{stripeDigitalTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {physicalItems.length > 0 && (
                      <div className="flex justify-between">
                        <span>Tienda física</span><span className="font-medium text-gray-700">€{physicalTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{total.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span></span>
                </div>

                {/* Courses button — always visible */}
                {items.length > 0 && (
                  <button
                    onClick={() => { setIsOpen(false); setShowCheckout(true); }}
                    className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <i className="ri-graduation-cap-line"></i>
                    Pagar cursos — €{courseTotal.toFixed(2)}
                  </button>
                )}

                {/* Stripe digital button — always visible, opens modal */}
                {hasStripeDigital && (
                  <button
                    onClick={openStripeDigitalCheckout}
                    className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <i className="ri-secure-payment-line"></i>
                    Pagar productos digitales — €{stripeDigitalTotal.toFixed(2)}
                  </button>
                )}

                {/* Physical items button — always visible */}
                {hasPhysical && (
                  <button
                    onClick={openShopCheckout}
                    className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <i className="ri-store-2-line"></i>
                    Pagar tienda — €{physicalTotal.toFixed(2)}
                  </button>
                )}

                <button
                  onClick={clearCart}
                  className="w-full py-2 text-gray-400 hover:text-rose-500 text-sm transition-colors cursor-pointer"
                >
                  Vaciar carrito
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course checkout modal */}
      {showCheckout && (
        <CheckoutModal
          items={items}
          total={courseTotal}
          stripeDisabled={stripeDisabled}
          stripeDisabledMessage={stripeDisabledMessage}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleCourseSuccess}
        />
      )}

      {/* Stripe digital checkout modal — opens from cart */}
      {showStripeDigitalCheckout && stripeDigitalProduct && (
        <StripeProductCheckoutModal
          product={stripeDigitalProduct}
          cartItems={stripeItems}
          user={user}
          stripeDisabled={stripeDisabled}
          stripeDisabledMessage={stripeDisabledMessage}
          getImage={(p) => p.images?.[0] ?? ""}
          onClose={() => setShowStripeDigitalCheckout(false)}
          onSuccess={() => { clearShopCart(); setShowStripeDigitalCheckout(false); }}
        />
      )}

      {/* Physical shop checkout modal */}
      {showShopCheckout && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowShopCheckout(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-gray-900">Finalizar pedido</h2>
                <p className="text-xs text-gray-400 mt-0.5">{physicalItems.length} producto{physicalItems.length !== 1 ? "s" : ""} con envío</p>
              </div>
              <button onClick={() => setShowShopCheckout(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Products summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {physicalItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">x{item.qty} · {item.category}</p>
                      {item.rewardPoints > 0 && (
                        <p className="text-xs text-amber-600">+{item.rewardPoints * item.qty} pts</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900 shrink-0">{(item.price * item.qty).toFixed(2)} €</span>
                  </div>
                ))}

                {(couponDiscount > 0 || pointsDiscount > 0) && (
                  <div className="pt-3 border-t border-gray-200 space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Subtotal</span><span>{physicalTotal.toFixed(2)} €</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600">
                        <span className="flex items-center gap-1"><i className="ri-coupon-3-line"></i> Cupón {appliedCoupon?.code}</span>
                        <span>-{couponDiscount.toFixed(2)} €</span>
                      </div>
                    )}
                    {pointsDiscount > 0 && (
                      <div className="flex justify-between text-xs text-amber-600">
                        <span className="flex items-center gap-1"><i className="ri-coin-line"></i> {pointsUsed} puntos</span>
                        <span>-{pointsDiscount.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total a pagar</span>
                  <span className="text-lg font-bold text-rose-600">{physicalFinalTotal.toFixed(2)} €</span>
                </div>
              </div>

              {/* Coupon */}
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
                    <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer">Quitar</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="CÓDIGO"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm font-mono tracking-widest"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl cursor-pointer whitespace-nowrap"
                    >
                      {couponLoading ? <i className="ri-loader-4-line animate-spin"></i> : "Aplicar"}
                    </button>
                  </div>
                )}
                {couponError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><i className="ri-error-warning-line"></i>{couponError}</p>}
              </div>

              {/* Points */}
              {user && points >= POINTS_TO_EUR && (
                <div className={`rounded-xl border p-4 transition-colors ${usePointsToggle ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex items-center justify-center bg-amber-100 rounded-lg">
                        <i className="ri-coin-line text-amber-500"></i>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Usar mis puntos</p>
                        <p className="text-xs text-gray-500">Tienes <strong className="text-amber-600">{points} pts</strong> = {(points / POINTS_TO_EUR).toFixed(2)} €</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={usePointsToggle} onChange={(e) => setUsePointsToggle(e.target.checked)} className="sr-only peer" />
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
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${deliveryType === "pickup" ? "border-teal-400 bg-teal-50" : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <i className={`ri-store-line text-2xl ${deliveryType === "pickup" ? "text-teal-500" : "text-gray-400"}`}></i>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${deliveryType === "pickup" ? "text-teal-700" : "text-gray-700"}`}>Recogida en centro</p>
                      <p className="text-xs text-gray-400 mt-0.5">Sin coste adicional</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setDeliveryType("delivery")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${deliveryType === "delivery" ? "border-rose-400 bg-rose-50" : "border-gray-100 hover:border-gray-200"}`}
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
                    <input type="text" value={shopForm.name} onChange={(e) => setShopForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tu nombre" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Teléfono *</label>
                    <input type="tel" value={shopForm.phone} onChange={(e) => setShopForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+34 600 000 000" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email *</label>
                  <input type="email" value={shopForm.email} onChange={(e) => setShopForm((p) => ({ ...p, email: e.target.value }))} placeholder="tu@email.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
                </div>
                {deliveryType === "delivery" && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Dirección de envío *</label>
                    <input type="text" value={shopForm.address} onChange={(e) => setShopForm((p) => ({ ...p, address: e.target.value }))} placeholder="Calle, número, ciudad, código postal" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Notas adicionales</label>
                  <textarea value={shopForm.notes} onChange={(e) => setShopForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Instrucciones especiales..." rows={2} maxLength={300} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400 resize-none" />
                </div>
              </div>

              {shopError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-center gap-2">
                  <i className="ri-error-warning-line"></i>{shopError}
                </div>
              )}

              {/* Stripe disabled notice */}
              {stripeDisabled && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <i className="ri-information-line text-amber-500 text-base shrink-0 mt-0.5"></i>
                  <p className="text-xs text-amber-800 leading-relaxed">{stripeDisabledMessage}</p>
                </div>
              )}

              {!stripeDisabled && (
                <>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                    <i className="ri-shield-check-line text-gray-400 text-sm"></i>
                    <p className="text-xs text-gray-500">Pago seguro con <strong>Stripe</strong>. Serás redirigido a la pasarela de pago.</p>
                  </div>

                  <button
                    onClick={handlePhysicalCheckout}
                    disabled={shopLoading || bizumLoading || !isShopFormValid}
                    className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {shopLoading
                      ? <><i className="ri-loader-4-line animate-spin"></i>Redirigiendo a Stripe...</>
                      : <><i className="ri-secure-payment-line"></i>Pagar {physicalFinalTotal.toFixed(2)} € con Stripe</>
                    }
                  </button>
                </>
              )}

              {bizumWhatsapp && (
                <>
                  <button
                    onClick={handlePhysicalBizum}
                    disabled={shopLoading || bizumLoading || !isShopFormValid}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {bizumLoading
                      ? <><i className="ri-loader-4-line animate-spin"></i>Procesando...</>
                      : <><i className="ri-smartphone-line"></i>Pagar {physicalFinalTotal.toFixed(2)} € por Bizum</>
                    }
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
      )}
    </>
  );
}
