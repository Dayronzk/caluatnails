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
  referralDiscount?: number;
  referralReferrerName?: string | null;
  companions?: Companion[];
  bookingMode?: "simultaneous" | "consecutive";
}

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

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string; code: string; type: string; value: number; discount: number;
  } | null>(null);

  const [pointsFoundByPhone, setPointsFoundByPhone] = useState(0);
  const [usePointsToggle, setUsePointsToggle] = useState(false);

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
  const discountTotal = couponDiscount + pointsDiscount + (referralDiscount || 0);
  const finalTotal = Math.max(0, totalPrice - discountTotal);
  const deposit = finalTotal * 0.1;

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
      {/* Form Area */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-4xl border border-rose-100/70 p-6 sm:p-7 shadow-soft-sm space-y-5">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <i className="ri-user-heart-line text-base"></i>
            </span>
            Tus datos de contacto
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Teléfono móvil *
              </label>
              <input
                type="tel"
                value={data.phone}
                onChange={e => handleChange("phone", e.target.value)}
                placeholder="+34 600 000 000"
                readOnly={!!data.phone}
                className={`w-full border border-rose-100/80 rounded-2xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100/60 shadow-soft-xs transition-all duration-300 ${
                  data.phone ? "bg-rose-50/40 text-gray-600" : "bg-white text-gray-900"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Nombre y apellidos *
              </label>
              <input
                type="text"
                value={data.name}
                onChange={e => handleChange("name", e.target.value)}
                placeholder="Ej. María García López"
                className="w-full border border-rose-100/80 rounded-2xl px-4 py-3.5 text-sm font-medium bg-white text-gray-900 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100/60 shadow-soft-xs transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Correo electrónico <span className="text-gray-400 font-normal lowercase">(para confirmación)</span>
              </label>
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={e => handleChange("email", e.target.value)}
                placeholder="tu@email.com"
                readOnly={emailFromAccount}
                className={`w-full border rounded-2xl px-4 py-3.5 text-sm font-medium focus:outline-none shadow-soft-xs transition-all duration-300 ${
                  emailFromAccount
                    ? "bg-rose-50/40 text-gray-600 border-rose-100"
                    : emailTaken
                    ? "border-red-300 focus:border-red-400 bg-red-50/60"
                    : "border-rose-100/80 bg-white text-gray-900 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/60"
                }`}
              />
              {emailChecking && (
                <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                  <i className="ri-loader-4-line animate-spin"></i> Comprobando email...
                </p>
              )}
              {emailTaken && !emailChecking && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1 font-medium">
                  <i className="ri-error-warning-line"></i>
                  Este email pertenece a otra cuenta. Inicia sesión o usa otro correo.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Coupons & Rewards */}
        <div className="bg-white/90 backdrop-blur-sm rounded-4xl border border-rose-100/70 p-6 sm:p-7 shadow-soft-sm space-y-4">
          <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <i className="ri-coupon-3-line text-rose-500"></i> Código promocional / Cupón
          </p>

          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-emerald-50/90 border border-emerald-200/80 rounded-2xl px-4 py-3.5 shadow-soft-xs">
              <div className="flex items-center gap-2.5">
                <i className="ri-checkbox-circle-fill text-emerald-500 text-lg"></i>
                <div>
                  <span className="text-sm font-bold text-emerald-900">{appliedCoupon.code}</span>
                  <span className="text-xs text-emerald-700 ml-2 font-semibold">
                    {appliedCoupon.type === "percentage" ? `-${appliedCoupon.value}%` : `-${appliedCoupon.discount.toFixed(2)} €`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 cursor-pointer bg-white px-3 py-1 rounded-full border border-emerald-200"
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
                className="flex-1 px-4 py-3 rounded-2xl border border-rose-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/60 outline-none text-sm font-mono tracking-widest bg-white shadow-soft-xs"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-5 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-95 disabled:opacity-50 text-white text-sm font-bold rounded-2xl cursor-pointer whitespace-nowrap transition-all shadow-soft-xs"
              >
                {couponLoading ? <i className="ri-loader-4-line animate-spin"></i> : "Aplicar"}
              </button>
            </div>
          )}

          {couponError && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
              <i className="ri-error-warning-line"></i>{couponError}
            </p>
          )}

          {/* Points toggle */}
          {effectivePoints >= POINTS_TO_EUR && (
            <div className={`rounded-3xl border p-4.5 transition-all duration-300 ${usePointsToggle ? "bg-amber-50/90 border-amber-200 shadow-soft-xs" : "bg-rose-50/30 border-rose-100/60"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center bg-amber-100 rounded-2xl shrink-0">
                    <i className="ri-coin-line text-amber-600 text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Canjear mis puntos</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Tienes <strong className="text-amber-700 font-bold">{effectivePoints} pts</strong> = {(effectivePoints / POINTS_TO_EUR).toFixed(2)} €
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
                  <div className={`w-11 h-6 rounded-full transition-colors ${usePointsToggle ? "bg-amber-400" : "bg-gray-200"} relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${usePointsToggle ? "after:translate-x-5" : ""}`}></div>
                </label>
              </div>

              {usePointsToggle && (
                <p className="text-xs text-amber-800 font-medium mt-3 bg-amber-100/70 rounded-2xl px-3.5 py-2 border border-amber-200/50">
                  Se canjearán <strong>{pointsUsed} puntos</strong> para descontar <strong>{pointsDiscount.toFixed(2)} €</strong> (máximo 50% del subtotal).
                </p>
              )}
            </div>
          )}
        </div>

        {/* Deposit Policy Notice */}
        <div className="bg-gradient-to-r from-amber-50/90 to-rose-50/50 border border-amber-200/60 rounded-3xl p-5 shadow-soft-xs">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <i className="ri-information-line text-lg"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-0.5">Política de reserva</p>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                El 90% restante se abonará al momento de asistir a la cita. En caso de no asistir o cancelar fuera de plazo, el anticipo no será reembolsable.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary & Checkout Sidebar */}
      <div className="lg:col-span-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-4xl border border-rose-100/70 p-6 sm:p-7 shadow-soft-md sticky top-24 space-y-5">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg border-b border-rose-100/60 pb-3">
            Resumen de tu cita
          </h3>

          {selectedDate && selectedTime && (
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-3xl p-4 shadow-soft-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <i className="ri-calendar-check-line text-lg"></i>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/80">Fecha y hora</p>
                  <p className="text-sm font-bold capitalize mt-0.5">{displayDate}</p>
                  <p className="text-xs text-white/90 font-medium">
                    A las <strong>{selectedTime}</strong> ({formatDuration(totalMinutes)})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Professional Information */}
          {professional && (
            <div className="bg-rose-50/40 rounded-3xl p-4 border border-rose-100/60 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-2">
                  {companions.length > 0 ? `Tu estilista (${data.name || "Tú"})` : "Estilista de uñas"}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-rose-200/80 flex items-center justify-center shrink-0 font-bold text-rose-700 text-xs shadow-soft-xs">
                    {professional.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{professional.name}</p>
                    {professional.address && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <i className="ri-map-pin-line text-rose-400"></i> {professional.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {companions.length > 0 && companions.map((c, idx) => {
                if (!c.professionalInfo) return null;
                return (
                  <div key={c.id} className="pt-2.5 border-t border-rose-100/60">
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider mb-2">
                      Estilista de {c.name || `Acompañante ${idx + 1}`}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0 font-bold text-teal-700 text-xs shadow-soft-xs">
                        {c.professionalInfo.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{c.professionalInfo.name}</p>
                        {c.professionalInfo.address && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <i className="ri-map-pin-line text-teal-400"></i> {c.professionalInfo.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Services Breakdown */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {companions.length > 0 ? `Tus servicios (${data.name || "Tú"})` : "Servicios incluidos"}
            </p>
            <div className="space-y-2">
              {selectedServices.map(s => (
                <div key={s.id} className="flex justify-between items-center text-xs sm:text-sm pl-3 border-l-2 border-rose-300">
                  <span className="text-gray-700 font-medium truncate">{s.name}</span>
                  <span className="font-bold text-gray-900 shrink-0 ml-2">€{Number(s.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {companions.length > 0 && companions.map((c, idx) => (
              <div key={c.id} className="mt-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Servicios de {c.name || `Acompañante ${idx + 1}`}
                </p>
                <div className="space-y-2">
                  {c.services.map(s => (
                    <div key={s.id} className="flex justify-between items-center text-xs sm:text-sm pl-3 border-l-2 border-teal-300">
                      <span className="text-gray-700 font-medium truncate">{s.name}</span>
                      <span className="font-bold text-gray-900 shrink-0 ml-2">€{Number(s.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-rose-100/60 pt-4 space-y-2.5">
            {discountTotal > 0 && (
              <>
                <div className="flex justify-between text-xs sm:text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span className="line-through">€{totalPrice.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-emerald-600 font-semibold">
                    <span className="flex items-center gap-1"><i className="ri-coupon-3-line"></i> Cupón</span>
                    <span>-€{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-amber-600 font-semibold">
                    <span className="flex items-center gap-1"><i className="ri-coin-line"></i> Puntos</span>
                    <span>-€{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                {referralDiscount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-rose-600 font-semibold">
                    <span className="flex items-center gap-1"><i className="ri-gift-line"></i> Descuento invitado</span>
                    <span>-€{referralDiscount.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between text-sm font-bold text-gray-900">
              <span>Importe Total</span>
              <span className="text-base">€{finalTotal.toFixed(2)}</span>
            </div>

            {stripeDisabled ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Pago en salón</span>
                <span className="font-bold text-emerald-600">€{finalTotal.toFixed(2)}</span>
              </div>
            ) : paymentMode === "deposit" ? (
              <div className="bg-rose-50/70 p-3.5 rounded-2xl space-y-1.5 border border-rose-100/60">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-rose-900">
                  <span>Anticipo hoy (10%)</span>
                  <span className="text-rose-600">€{deposit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                  <span>Restante en cita (90%)</span>
                  <span>€{(finalTotal - deposit).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl flex justify-between items-center border border-emerald-100">
                <span className="text-xs sm:text-sm font-bold text-emerald-900">Pago total hoy</span>
                <span className="font-bold text-emerald-600 text-sm">€{finalTotal.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Payment Option Selector & Buttons */}
          {!stripeDisabled && (
            <div className="space-y-3 pt-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                Opción de pago
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMode("deposit")}
                  className={`p-3 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer ${
                    paymentMode === "deposit"
                      ? "border-rose-400 bg-rose-50/90 shadow-soft-xs"
                      : "border-rose-100/60 bg-white"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase text-rose-500">Anticipo 10%</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">€{deposit.toFixed(2)}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("full")}
                  className={`p-3 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer relative ${
                    paymentMode === "full"
                      ? "border-emerald-400 bg-emerald-50/90 shadow-soft-xs"
                      : "border-rose-100/60 bg-white"
                  }`}
                >
                  <span className="absolute -top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                    -5% tarjeta
                  </span>
                  <p className="text-[10px] font-bold uppercase text-emerald-600 mt-0.5">Pago Total</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">€{finalTotal.toFixed(2)}</p>
                </button>
              </div>

              {/* Stripe checkout button */}
              <button
                type="button"
                onClick={() => onSubmit(discountTotal, pointsUsed, appliedCoupon?.id, paymentMode)}
                disabled={!isValid || loading || bizumLoading}
                className={`w-full py-4 px-5 rounded-2xl font-bold text-sm flex items-center justify-between gap-3 transition-all duration-300 cursor-pointer ${
                  isValid && !loading && !bizumLoading
                    ? "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-soft-md hover:scale-[1.01]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <i className="ri-bank-card-2-line text-lg"></i>
                  <span>Pagar con tarjeta</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <span>€{cardAmountToShow.toFixed(2)}</span>
                  <i className="ri-arrow-right-line"></i>
                </div>
              </button>

              {/* Cash option */}
              {bizumWhatsapp && paymentMode === "full" && (
                <button
                  type="button"
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
                  className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-between gap-3 transition-all duration-300 cursor-pointer ${
                    isValid && !loading && !bizumLoading
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-soft-xs"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <i className="ri-coins-line text-lg"></i>
                    <span>Pago en efectivo en salón</span>
                  </div>
                  <span>0 € hoy</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
