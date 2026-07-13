import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DBService } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { usePoints } from "@/hooks/usePoints";
import { supabase } from "@/lib/supabase";
import BizumSuccessModal from "@/components/feature/BizumSuccessModal";

interface ClientData {
  name: string;
  email: string;
  phone: string;
}

interface ProfessionalInfo {
  name: string;
  address: string | null;
  instagram: string | null;
}

export type PaymentMode = "deposit" | "full";

interface Companion {
  id: string;
  name: string;
  phone: string;
  services: DBService[];
  professionalId: string;
  professionalInfo: { name: string; address: string | null; instagram: string | null } | null;
}

interface Props {
  data: ClientData;
  onChange: (data: ClientData) => void;
  selectedServices: DBService[];
  selectedDate: string;
  selectedTime: string;
  onSubmit: (discountAmount: number, pointsUsed: number, couponId: string | undefined, paymentMode: PaymentMode) => void;
  onBizumSubmit: (discountAmount: number, pointsUsed: number, couponId: string | undefined, paymentMode: PaymentMode) => Promise<void>;
  onSubscriptionSubmit: (discountAmount: number, pointsUsed: number, couponId: string | undefined, subscriptionId: string) => Promise<void>;
  loading: boolean;
  professional?: ProfessionalInfo | null;
  referralDiscount?: number;       // €  off applied by the referral landing (e.g. 13)
  referralReferrerName?: string | null; // first name of the inviter, for the badge
  companions?: Companion[];
  bookingMode?: "simultaneous" | "consecutive";
}

// 100 points = 1 €
const POINTS_TO_EUR = 100;

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function ClientForm({
  data,
  onChange,
  selectedServices,
  selectedDate,
  selectedTime,
  onSubmit,
  onBizumSubmit,
  onSubscriptionSubmit,
  loading,
  professional,
  referralDiscount = 0,
  referralReferrerName = null,
  companions = [],
  bookingMode = "simultaneous",
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { points, validateCoupon } = usePoints();
  const [bizumWhatsapp, setBizumWhatsapp] = useState("");
  const [bizumLoading, setBizumLoading] = useState(false);
  const [showBizumSuccess, setShowBizumSuccess] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("full");
  const [stripeDisabled, setStripeDisabled] = useState(false);
  const [stripeDisabledMessage, setStripeDisabledMessage] = useState("El pago online estará disponible próximamente. Contáctanos para reservar tu plaza.");

  // Subscription states
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const cleanPhone = data.phone.replace(/\D/g, "");
      if (cleanPhone.length < 9) {
        setActiveSubscriptions([]);
        return;
      }
      setLoadingSubs(true);
      try {
        let accountId: string | null = null;
        if (user) {
          const { data: client } = await supabase
            .from("client_accounts")
            .select("id")
            .eq("auth_user_id", user.id)
            .maybeSingle();
          if (client) accountId = client.id;
        } else {
          const { data: client } = await supabase
            .rpc("find_client_account_by_phone", { p_phone: data.phone })
            .maybeSingle();
          if (client) accountId = (client as any).id;
        }

        if (!accountId) {
          setActiveSubscriptions([]);
          return;
        }

        const { data: subs, error } = await supabase
          .from("client_subscriptions")
          .select(`
            id,
            plan_id,
            status,
            end_date,
            sessions_total,
            sessions_used,
            subscription_plans (
              id,
              name,
              service_id
            )
          `)
          .eq("client_account_id", accountId)
          .eq("status", "active")
          .gt("end_date", new Date().toISOString());

        if (error) throw error;

        const validSubs = (subs || []).filter(
          (s: any) => s.sessions_total - s.sessions_used > 0
        );

        setActiveSubscriptions(validSubs);
      } catch (err) {
        console.error("Error fetching client subscriptions for booking:", err);
      } finally {
        setLoadingSubs(false);
      }
    };

    fetchSubscriptions();
  }, [data.phone, user]);

  const findMatchingSubscription = () => {
    for (const service of selectedServices) {
      const match = activeSubscriptions.find(
        sub => sub.subscription_plans?.service_id === service.id
      );
      if (match) return match;
    }
    return null;
  };

  const matchingSub = findMatchingSubscription();

  useEffect(() => {
    supabase
      .from("center_settings")
      .select("bizum_whatsapp, stripe_disabled, stripe_disabled_message")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.bizum_whatsapp) setBizumWhatsapp(data.bizum_whatsapp);
        if (data) {
          setStripeDisabled(data.stripe_disabled ?? false);
          if (data.stripe_disabled_message) setStripeDisabledMessage(data.stripe_disabled_message);
        }
      });
  }, []);

  const mainPrice = selectedServices.reduce((acc, s) => acc + Number(s.price), 0);
  const companionPrice = companions.reduce((acc, c) => acc + c.services.reduce((sum, s) => sum + Number(s.price), 0), 0);
  const totalPrice = mainPrice + companionPrice;

  const mainMinutes = selectedServices.reduce((acc, s) => acc + s.duration_minutes, 0);
  const companionMinutes = companions.reduce((acc, c) => acc + c.services.reduce((sum, s) => sum + s.duration_minutes, 0), 0);
  const totalMinutes = mainMinutes + companionMinutes;

  const mainPoints = selectedServices.reduce((acc, s) => acc + (s.reward_points ?? 0), 0);
  const companionPoints = companions.reduce((acc, c) => acc + c.services.reduce((sum, s) => sum + (s.reward_points ?? 0), 0), 0);
  const totalPoints = mainPoints + companionPoints;

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string; code: string; type: string; value: number; discount: number;
  } | null>(null);

  // Points redemption
  const [pointsFoundByPhone, setPointsFoundByPhone] = useState(0);
  const [usePointsToggle, setUsePointsToggle] = useState(false);

  // Email-already-in-use validation
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailFromAccount, setEmailFromAccount] = useState(!!user?.email && !!data.email);

  useEffect(() => {
    if (emailFromAccount) {
      setEmailTaken(false);
      setEmailChecking(false);
      return;
    }
    const trimmed = data.email.trim();
    if (!trimmed || !trimmed.includes("@") || emailFromAccount) {
      setEmailTaken(false);
      setEmailChecking(false);
      return;
    }
    setEmailChecking(true);
    const timer = setTimeout(async () => {
      const { data: taken } = await supabase.rpc("is_email_taken", {
        p_email: trimmed,
        p_phone: data.phone,
      });
      setEmailTaken(taken === true);
      setEmailChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [data.email, data.phone, emailFromAccount]);

  // Effective points (either from auth or from phone lookup)
  const effectivePoints = user ? points : pointsFoundByPhone;

  useEffect(() => {
    const fetchPointsByPhone = async () => {
      const cleanPhone = data.phone.replace(/\D/g, "");
      if (cleanPhone.length >= 9) {
        const { data: client } = await supabase
          .rpc("find_client_account_by_phone", { p_phone: data.phone })
          .maybeSingle();

        if (client) {
          const c = client as { points?: number; name?: string | null; email?: string | null };
          setPointsFoundByPhone(c.points ?? 0);
          let nextName = data.name || c.name || "";
          let nextEmail = data.email || c.email || "";
          const emailCameFromAccount = !data.email && !!c.email;

          if (!nextName || !nextEmail) {
            const last9 = cleanPhone.slice(-9);
            const { data: lastBooking } = await supabase
              .from("bookings")
              .select("client_name, client_email")
              .ilike("client_phone", `%${last9}`)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (lastBooking) {
              if (!nextName && lastBooking.client_name) nextName = lastBooking.client_name;
              if (!nextEmail && lastBooking.client_email) {
                nextEmail = lastBooking.client_email;
                if (!emailCameFromAccount && !data.email) setEmailFromAccount(true);
              }
            }
          }

          if (emailCameFromAccount) setEmailFromAccount(true);

          if (nextName !== data.name || nextEmail !== data.email) {
            if (nextEmail && nextEmail !== data.email) setEmailFromAccount(true);
            onChange({ ...data, name: nextName, email: nextEmail });
          }
        } else {
          setPointsFoundByPhone(0);
        }
      } else {
        setPointsFoundByPhone(0);
      }
    };

    const timer = setTimeout(fetchPointsByPhone, 500);
    return () => clearTimeout(timer);
  }, [data.phone, user]);

  const maxPointsDiscount = Math.min(
    Math.floor((effectivePoints / POINTS_TO_EUR) * 100) / 100,
    totalPrice * 0.5
  );
  const pointsDiscount = usePointsToggle ? maxPointsDiscount : 0;
  const pointsUsed = usePointsToggle ? Math.ceil(maxPointsDiscount * POINTS_TO_EUR) : 0;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  // Referral discount cascades into the final total + deposit calculation.
  const discountTotal = couponDiscount + pointsDiscount + (referralDiscount || 0);
  const finalTotal = Math.max(0, totalPrice - discountTotal);
  const deposit = finalTotal * 0.1;

  // Card payment discount (5%) — ONLY applies to full payment with card
  const CARD_DISCOUNT_PCT = 0.05;
  const cardDiscountApplies = paymentMode === "full";
  const cardAmountFull = finalTotal * (1 - CARD_DISCOUNT_PCT);
  const cardSavings = cardDiscountApplies ? finalTotal - cardAmountFull : 0;
  const bizumAmountToShow = paymentMode === "full" ? finalTotal : deposit;
  const cardAmountToShow = cardDiscountApplies ? cardAmountFull : bizumAmountToShow;

  const displayDate = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const handleChange = (field: keyof ClientData, value: string) => {
    if (field === "email") setEmailFromAccount(false);
    onChange({ ...data, [field]: value });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const itemsIds = selectedServices.map(s => s.id);
    const result = await validateCoupon(couponCode, totalPrice, itemsIds);
    if (result.valid && result.coupon && result.discount !== undefined) {
      setAppliedCoupon({ ...result.coupon, discount: result.discount });
      setCouponError("");
    } else {
      setCouponError(result.error ?? "Código inválido");
    }
    setCouponLoading(false);
  };

  const isValid = data.phone.trim() && 
                  data.name.trim() && 
                  selectedDate && 
                  selectedTime && 
                  !emailTaken && 
                  !emailChecking &&
                  companions.every(c => 
                    c.name.trim() && 
                    c.phone.trim() && 
                    c.services.length > 0
                  );

  if (showBizumSuccess) {
    return (
      <BizumSuccessModal
        type="efectivo"
        total={`${finalTotal.toFixed(2)} €`}
        onClose={() => navigate("/mi-cuenta")}
        bookingData={{
          date: selectedDate,
          time: selectedTime,
          durationMinutes: totalMinutes,
          clientName: data.name,
          services: selectedServices.map(s => s.name),
          professionalName: professional?.name ?? undefined,
          professionalAddress: professional?.address ?? undefined,
          totalPrice: finalTotal,
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Form */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tus datos</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono *</label>
              <input
                type="tel"
                value={data.phone}
                onChange={e => handleChange("phone", e.target.value)}
                placeholder="+34 600 000 000"
                readOnly={!!data.phone}
                className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition-colors ${data.phone ? "bg-gray-50 text-gray-500" : ""}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo *</label>
              <input
                type="text"
                value={data.name}
                onChange={e => handleChange("name", e.target.value)}
                placeholder="Ej. María García López"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={e => handleChange("email", e.target.value)}
                placeholder="tu@email.com"
                readOnly={emailFromAccount}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                  emailFromAccount ? "bg-gray-50 text-gray-500 border-gray-200" :
                  emailTaken ? "border-red-300 focus:border-red-400 bg-red-50" : "border-gray-200 focus:border-rose-400"
                }`}
              />
              {emailChecking && (
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <i className="ri-loader-4-line animate-spin"></i> Comprobando email...
                </p>
              )}
              {emailTaken && !emailChecking && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>
                  Este email ya está en uso por otra cuenta. Inicia sesión o usa otro correo.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Coupon */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
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
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm font-mono tracking-widest"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl cursor-pointer whitespace-nowrap transition-colors"
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
        {effectivePoints >= POINTS_TO_EUR && (
          <div className={`rounded-xl border p-4 transition-colors ${usePointsToggle ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center bg-amber-100 rounded-lg shrink-0">
                  <i className="ri-coin-line text-amber-500"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Usar mis puntos</p>
                  <p className="text-xs text-gray-500">
                    Tienes <strong className="text-amber-600">{effectivePoints} pts</strong> = {(effectivePoints / POINTS_TO_EUR).toFixed(2)} €
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

        {/* Payment notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex gap-3">
            <i className="ri-information-line text-amber-600 mt-0.5 shrink-0"></i>
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Política de anticipo</p>
              <p className="text-sm text-amber-700">
                El 90% restante se abonará al momento de asistir a la cita.{" "}
                <strong>En caso de no asistir, se perderá el anticipo.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary sidebar */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
          <h3 className="font-semibold text-gray-900 mb-4">Resumen de tu reserva</h3>

          {selectedDate && selectedTime && (
            <div className="bg-rose-50 rounded-xl p-3 mb-4 flex items-start gap-2.5">
              <i className="ri-calendar-check-line text-rose-500 mt-0.5 shrink-0"></i>
              <div>
                <p className="text-sm font-semibold text-rose-800 capitalize">{displayDate}</p>
                <p className="text-sm text-rose-600">
                  a las {selectedTime} 
                  {companions.length > 0 ? (
                    <span className="text-xs block text-rose-500/90 mt-0.5">
                      {bookingMode === "simultaneous" 
                        ? `Simultánea · Duración: Tú: ${formatDuration(mainMinutes)} | Acompañantes: ${formatDuration(companionMinutes)}` 
                        : `Consecutiva · Duración total: ${formatDuration(totalMinutes)}`}
                    </span>
                  ) : (
                    ` · Duración: ${formatDuration(totalMinutes)}`
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Professional info */}
          {professional && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100 space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {companions.length > 0 ? `Tu profesional (${data.name || "Tú"})` : "Profesional"}
                </p>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <span className="text-rose-600 font-bold text-xs">{professional.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{professional.name}</p>
                </div>
                {professional.address && (
                  <div className="flex items-start gap-1.5 mb-1.5">
                    <i className="ri-map-pin-line text-rose-400 text-xs mt-0.5 shrink-0"></i>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-gray-600">{professional.address}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(professional.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-rose-500 hover:text-rose-700 underline cursor-pointer whitespace-nowrap"
                      >
                        Ver en Maps
                      </a>
                    </div>
                  </div>
                )}
                {professional.instagram && (
                  <a
                    href={`https://instagram.com/${professional.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500 transition-colors cursor-pointer pl-9"
                  >
                    <i className="ri-instagram-line text-sm"></i>
                    @{professional.instagram.replace(/^@/, "")}
                  </a>
                )}
              </div>

              {companions.length > 0 && companions.map((c, idx) => {
                if (!c.professionalInfo) return null;
                return (
                  <div key={c.id} className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Profesional de {c.name || `Acompañante ${idx + 1}`}
                    </p>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <span className="text-teal-600 font-bold text-xs">{c.professionalInfo.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{c.professionalInfo.name}</p>
                    </div>
                    {c.professionalInfo.address && (
                      <div className="flex items-start gap-1.5 mb-1.5">
                        <i className="ri-map-pin-line text-teal-400 text-xs mt-0.5 shrink-0"></i>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-gray-600">{c.professionalInfo.address}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.professionalInfo.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-teal-500 hover:text-teal-700 underline cursor-pointer whitespace-nowrap"
                          >
                            Ver en Maps
                          </a>
                        </div>
                      </div>
                    )}
                    {c.professionalInfo.instagram && (
                      <a
                        href={`https://instagram.com/${c.professionalInfo.instagram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500 transition-colors cursor-pointer pl-9"
                      >
                        <i className="ri-instagram-line text-sm"></i>
                        @{c.professionalInfo.instagram.replace(/^@/, "")}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Services */}
          <div className="space-y-3 mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {companions.length > 0 ? `Tus servicios (${data.name || "Tú"})` : "Servicios seleccionados"}
              </p>
              <div className="space-y-2">
                {selectedServices.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-sm pl-2 border-l-2 border-rose-200">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-gray-600 truncate">{s.name}</span>
                      {(s.reward_points ?? 0) > 0 && (
                        <span className="text-xs text-amber-500 font-medium whitespace-nowrap">+{s.reward_points} pts</span>
                      )}
                    </div>
                    <span className="font-medium text-gray-800 shrink-0 ml-2">€{Number(s.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {companions.length > 0 && companions.map((c, idx) => (
              <div key={c.id} className="mt-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Servicios de {c.name || `Acompañante ${idx + 1}`}
                </p>
                <div className="space-y-2">
                  {c.services.map(s => (
                    <div key={s.id} className="flex justify-between items-center text-sm pl-2 border-l-2 border-teal-200">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-gray-600 truncate">{s.name}</span>
                        {(s.reward_points ?? 0) > 0 && (
                          <span className="text-xs text-amber-500 font-medium whitespace-nowrap">+{s.reward_points} pts</span>
                        )}
                      </div>
                      <span className="font-medium text-gray-800 shrink-0 ml-2">€{Number(s.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            {discountTotal > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-500 line-through">€{totalPrice.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="flex items-center gap-1"><i className="ri-coupon-3-line"></i> Cupón {appliedCoupon?.code}</span>
                    <span>-€{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span className="flex items-center gap-1"><i className="ri-coin-line"></i> {pointsUsed} puntos</span>
                    <span>-€{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                {referralDiscount > 0 && (
                  <div className="flex justify-between text-sm text-rose-600">
                    <span className="flex items-center gap-1">
                      <i className="ri-gift-2-fill"></i>
                      Invitación{referralReferrerName ? ` de ${referralReferrerName}` : ""}
                    </span>
                    <span>-€{referralDiscount.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold text-gray-800">€{finalTotal.toFixed(2)}</span>
            </div>
            {stripeDisabled ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">A abonar en el centro</span>
                <span className="font-bold text-emerald-600">€{finalTotal.toFixed(2)}</span>
              </div>
            ) : paymentMode === "deposit" ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Anticipo hoy (10%)</span>
                  <span className="font-bold text-rose-600">€{deposit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Resto en cita (90%)</span>
                  <span className="font-medium text-gray-600">€{(finalTotal - deposit).toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pago total hoy</span>
                <span className="font-bold text-emerald-600">€{finalTotal.toFixed(2)}</span>
              </div>
            )}
            {/* Card discount info — only when full payment */}
            {cardDiscountApplies ? (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                <i className="ri-bank-card-2-line text-emerald-600 text-sm"></i>
                <span className="text-xs text-emerald-700 flex-1">
                  <strong>5% de descuento</strong> al pagar el total con tarjeta
                </span>
                <span className="text-xs font-bold text-emerald-700">-€{cardSavings.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                <i className="ri-information-line text-gray-400 text-sm"></i>
                <span className="text-xs text-gray-500 flex-1">
                  Paga el <strong>total con tarjeta</strong> y obtén un <strong>5% de descuento</strong>
                </span>
              </div>
            )}
            {totalPoints > 0 && (
              <div className="flex justify-between text-sm text-amber-600 pt-1 border-t border-gray-100">
                <span className="flex items-center gap-1"><i className="ri-coin-line"></i> Puntos a ganar</span>
                <span className="font-bold">+{totalPoints} pts</span>
              </div>
            )}
          </div>

          {stripeDisabled && !bizumWhatsapp ? (
            <div className="mt-6 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <i className="ri-information-line text-amber-500 text-base shrink-0 mt-0.5"></i>
              <p className="text-xs text-amber-800 leading-relaxed">{stripeDisabledMessage}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {/* Payment mode selector: deposit vs full (only for Stripe card payments) */}
              {!stripeDisabled && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">¿Cuánto quieres pagar ahora con tarjeta?</p>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode("deposit")}
                      className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                        paymentMode === "deposit"
                          ? "border-rose-400 bg-rose-50 shadow-md"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      {paymentMode === "deposit" && (
                        <i className="ri-checkbox-circle-fill text-rose-500 absolute top-2 right-2"></i>
                      )}
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${paymentMode === "deposit" ? "text-rose-700" : "text-gray-400"}`}>Anticipo 10%</p>
                      <p className={`text-lg font-bold ${paymentMode === "deposit" ? "text-rose-600" : "text-gray-900"}`}>€{deposit.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">90% restante en cita</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode("full")}
                      className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                        paymentMode === "full"
                          ? "border-emerald-400 bg-emerald-50 shadow-md"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      {paymentMode === "full" && (
                        <i className="ri-checkbox-circle-fill text-emerald-500 absolute top-2 right-2"></i>
                      )}
                      {/* -5% badge always visible to incentivize the option */}
                      <span className={`absolute -top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        paymentMode === "full" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        -5% con tarjeta
                      </span>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 mt-1 ${paymentMode === "full" ? "text-emerald-700" : "text-gray-400"}`}>Pago total</p>
                      <p className={`text-lg font-bold ${paymentMode === "full" ? "text-emerald-600" : "text-gray-900"}`}>€{finalTotal.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Nada que pagar en cita</p>
                    </button>
                  </div>
                </>
              )}

              {/* Section header */}
              <div className="flex items-center gap-2 pt-2">
                <div className="h-px flex-1 bg-gray-100"></div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Elige tu método de pago</p>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>

              {/* Subscription Option */}
              {matchingSub && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!isValid) return;
                    setSubscriptionLoading(true);
                    try {
                      const coveredService = selectedServices.find(
                        s => s.id === matchingSub.subscription_plans?.service_id
                      );
                      const coveredPrice = coveredService ? Number(coveredService.price) : 0;
                      await onSubscriptionSubmit(
                        discountTotal + coveredPrice,
                        pointsUsed,
                        appliedCoupon?.id,
                        matchingSub.id
                      );
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setSubscriptionLoading(false);
                    }
                  }}
                  disabled={!isValid || loading || bizumLoading || subscriptionLoading}
                  className={`w-full py-4 px-5 rounded-2xl font-semibold text-sm flex items-center justify-between gap-3 transition-all cursor-pointer border-2 ${
                    isValid && !loading && !bizumLoading && !subscriptionLoading
                      ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 hover:shadow-lg hover:shadow-rose-100"
                      : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isValid && !loading && !bizumLoading && !subscriptionLoading ? "bg-white/20" : "bg-gray-100"
                    }`}>
                      <i className="ri-ticket-line text-lg"></i>
                    </div>
                    <div className="text-left">
                      {subscriptionLoading ? (
                        <span className="flex items-center gap-2"><i className="ri-loader-4-line animate-spin"></i> Procesando...</span>
                      ) : (
                        <>
                          <p className="font-bold">Canjear sesión de mi Bono</p>
                          <p className={`text-[10px] ${isValid && !loading && !bizumLoading && !subscriptionLoading ? "text-white/80" : "text-gray-400"}`}>
                            Usar saldo de {matchingSub.subscription_plans?.name}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end leading-tight text-right shrink-0">
                    <span className="font-bold text-base">0,00 € hoy</span>
                    <span className={`text-[10px] ${isValid && !loading && !bizumLoading && !subscriptionLoading ? "text-white/80" : "text-gray-400"}`}>
                      Se descontará 1 sesión (restan {matchingSub.sessions_total - matchingSub.sessions_used})
                    </span>
                  </div>
                </button>
              )}

              {/* Stripe option */}
              {!stripeDisabled && (
                <button
                  onClick={() => onSubmit(discountTotal, pointsUsed, appliedCoupon?.id, paymentMode)}
                  disabled={!isValid || loading || bizumLoading}
                  className={`relative w-full py-4 px-5 rounded-2xl font-semibold text-sm flex items-center justify-between gap-3 transition-all cursor-pointer border-2 ${
                    isValid && !loading && !bizumLoading
                      ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500 hover:shadow-lg hover:shadow-rose-200"
                      : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                  }`}
                >
                  {/* Discount badge — only shows on full payment */}
                  {isValid && !loading && !bizumLoading && cardDiscountApplies && (
                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                      -5% DESCUENTO
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isValid && !loading && !bizumLoading ? "bg-white/20" : "bg-gray-100"
                    }`}>
                      <i className="ri-bank-card-2-fill text-lg"></i>
                    </div>
                    <div className="text-left">
                      {loading ? (
                        <span className="flex items-center gap-2"><i className="ri-loader-4-line animate-spin"></i> Procesando...</span>
                      ) : (
                        <>
                          <p className="font-bold">Tarjeta de crédito/débito</p>
                          <p className={`text-[10px] ${isValid && !loading && !bizumLoading ? "text-white/80" : "text-gray-400"}`}>Visa, Mastercard, Amex · Stripe</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end leading-tight">
                    {cardDiscountApplies && (
                      <span className={`text-[10px] line-through ${isValid && !loading && !bizumLoading ? "text-white/60" : "text-gray-300"}`}>€{bizumAmountToShow.toFixed(2)}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-base">€{cardAmountToShow.toFixed(2)}</span>
                      <i className="ri-arrow-right-line"></i>
                    </div>
                  </div>
                </button>
              )}

              {/* Cash option (only visible if payment mode is full) */}
              {bizumWhatsapp && paymentMode === "full" && (
                <button
                  onClick={async () => {
                    if (!isValid) return;
                    setBizumLoading(true);
                    try {
                      await onBizumSubmit(discountTotal, pointsUsed, appliedCoupon?.id, paymentMode);
                      setShowBizumSuccess(true);
                    } catch (err) {
                      setBizumLoading(false);
                    }
                  }}
                  disabled={!isValid || loading || bizumLoading}
                  className={`w-full py-4 px-5 rounded-2xl font-semibold text-sm flex items-center justify-between gap-3 transition-all cursor-pointer border-2 ${
                    isValid && !loading && !bizumLoading
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 hover:shadow-lg hover:shadow-emerald-200"
                      : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isValid && !loading && !bizumLoading ? "bg-white/20" : "bg-gray-100"
                    }`}>
                      <i className="ri-coins-line text-lg"></i>
                    </div>
                    <div className="text-left">
                      {bizumLoading ? (
                        <span className="flex items-center gap-2"><i className="ri-loader-4-line animate-spin"></i> Procesando...</span>
                      ) : (
                        <>
                          <p className="font-bold">Pago en efectivo (en el centro)</p>
                          <p className={`text-[10px] ${isValid && !loading && !bizumLoading ? "text-white/80" : "text-gray-400"}`}>Paga el día de tu cita en el salón</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end leading-tight text-right shrink-0">
                    <span className="font-bold text-base">0,00 € hoy</span>
                    <span className={`text-[10px] ${isValid && !loading && !bizumLoading ? "text-white/80" : "text-gray-400"}`}>Paga €{finalTotal.toFixed(2)} en el centro</span>
                  </div>
                </button>
              )}

              {/* Stripe disabled message if Bizum is the only option */}
              {stripeDisabled && bizumWhatsapp && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                  <i className="ri-information-line text-amber-500 text-base shrink-0 mt-0.5"></i>
                  <p className="text-xs text-amber-800 leading-relaxed">{stripeDisabledMessage}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><i className="ri-shield-check-line"></i> Pago seguro SSL</span>
            <span className="text-gray-200">•</span>
            <span className="flex items-center gap-1"><i className="ri-lock-line"></i> 256-bit encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
