import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface ReferralEntry {
  id: string;
  referred_email: string | null;
  event_type: string;
  points_awarded: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  booking: { label: "Reserva de servicio", icon: "ri-calendar-check-line", color: "text-teal-500" },
  purchase: { label: "Compra de curso", icon: "ri-shopping-bag-line", color: "text-rose-500" },
};

function generateCode(userId: string): string {
  // Generate a short unique code from user id
  const base = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `CALUATNAILS-${base}`;
}

export default function ReferralTab({ clientPhone, clientAccountId }: { clientPhone?: string; clientAccountId?: string }) {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);

  const isPhoneMode = !!clientPhone && !!clientAccountId;

  const loadData = useCallback(async () => {
    if (!user && !isPhoneMode) return;
    setLoading(true);

    if (isPhoneMode) {
      // Phone-based: use client_accounts
      const { data: acc } = await supabase
        .from("client_accounts")
        .select("referral_code")
        .eq("id", clientAccountId)
        .maybeSingle();

      let code = acc?.referral_code;
      if (!code) {
        code = generateCode(clientAccountId);
        await supabase
          .from("client_accounts")
          .update({ referral_code: code })
          .eq("id", clientAccountId);
      }
      setReferralCode(code);

      const { data: refs } = await supabase
        .from("client_referrals")
        .select("*")
        .eq("referrer_account_id", clientAccountId)
        .order("created_at", { ascending: false });

      const refList = (refs ?? []) as ReferralEntry[];
      setReferrals(refList);
      setTotalEarned(refList.filter(r => r.status === "completed").reduce((s, r) => s + r.points_awarded, 0));
    } else {
      // Auth-based: use profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user!.id)
        .maybeSingle();

      let code = profile?.referral_code;
      if (!code) {
        code = generateCode(user!.id);
        await supabase
          .from("profiles")
          .update({ referral_code: code })
          .eq("id", user!.id);
      }
      setReferralCode(code);

      const { data: refs } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });

      const refList = (refs ?? []) as ReferralEntry[];
      setReferrals(refList);
      setTotalEarned(refList.filter(r => r.status === "completed").reduce((s, r) => s + r.points_awarded, 0));
    }
    setLoading(false);
  }, [user, isPhoneMode, clientAccountId]);

  useEffect(() => { loadData(); }, [loadData]);

  const referralLink = `${window.location.origin}/reservar?ref=${referralCode}`;
  const courseLink = `${window.location.origin}/?ref=${referralCode}`;
  // Personalized landing — preferred link for sharing on social/WhatsApp
  const invitaLink = `${window.location.origin}/invita/${referralCode}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    const msg = `¡Hola! Te recomiendo CALUATNAILS 💅 Te dejo mi invitación personal: si reservas con este link, tu primer esmaltado semipermanente te sale por solo 5€ (precio normal 18€) ✨\n\n${invitaLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareNative = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Te invito a CALUATNAILS",
          text: "Tu primer esmaltado semipermanente por solo 5€ usando mi invitación 💅",
          url: invitaLink,
        });
      } catch { /* user cancelled */ }
    } else {
      copyToClipboard(invitaLink);
    }
  };

  const completedRefs = referrals.filter(r => r.status === "completed");
  const pendingRefs = referrals.filter(r => r.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center bg-white/20 rounded-xl shrink-0">
            <i className="ri-links-line text-2xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold">Programa de referidos</h2>
            <p className="text-sm opacity-90">Comparte tu enlace y gana puntos por cada reserva o compra que hagan</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i className="ri-question-line text-rose-500"></i> ¿Cómo funciona?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", icon: "ri-share-line", title: "Comparte tu enlace", desc: "Envía tu enlace único a amigas, familiares o clientes", color: "bg-rose-50 text-rose-500" },
            { step: "2", icon: "ri-user-add-line", title: "Ellas reservan o compran", desc: "Cuando alguien usa tu enlace para reservar una cita o comprar el curso", color: "bg-amber-50 text-amber-500" },
            { step: "3", icon: "ri-coin-line", title: "Tú ganas puntos", desc: "Recibes 300 pts por cada reserva y 500 pts por cada compra de curso", color: "bg-emerald-50 text-emerald-600" },
          ].map(item => (
            <div key={item.step} className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50">
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl mb-3 ${item.color}`}>
                <i className={`${item.icon} text-xl`}></i>
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mb-2">
                {item.step}
              </div>
              <p className="font-semibold text-gray-800 text-sm mb-1">{item.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-teal-50 rounded-xl px-4 py-3">
            <i className="ri-calendar-check-line text-teal-500 text-lg"></i>
            <div>
              <p className="text-xs font-semibold text-teal-800">Por cada reserva</p>
              <p className="text-sm font-bold text-teal-600">+300 puntos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-rose-50 rounded-xl px-4 py-3">
            <i className="ri-shopping-bag-line text-rose-500 text-lg"></i>
            <div>
              <p className="text-xs font-semibold text-rose-800">Por cada compra de curso</p>
              <p className="text-sm font-bold text-rose-600">+500 puntos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{referrals.length}</p>
          <p className="text-xs text-gray-400 mt-1">Referidos totales</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-3xl font-bold text-emerald-600">{completedRefs.length}</p>
          <p className="text-xs text-gray-400 mt-1">Completados</p>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-5 text-center text-white">
          <p className="text-3xl font-bold">{totalEarned.toLocaleString()}</p>
          <p className="text-xs opacity-90 mt-1">Puntos ganados</p>
        </div>
      </div>

      {/* Referral links */}
      {loading ? (
        <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i className="ri-links-line text-rose-500"></i> Tus enlaces de referido
          </h3>

          {/* Code badge */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-0.5">Tu código único</p>
              <p className="font-mono font-bold text-gray-900 text-lg tracking-wider">{referralCode}</p>
            </div>
            <button
              onClick={() => copyToClipboard(referralCode)}
              className="px-4 py-2 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? <><i className="ri-check-line mr-1"></i>Copiado</> : <><i className="ri-file-copy-line mr-1"></i>Copiar</>}
            </button>
          </div>

          {/* Featured invita landing — the share-worthy link */}
          <div className="mb-3 border-2 border-rose-200 bg-gradient-to-br from-rose-50/60 via-orange-50/40 to-amber-50/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                ⭐ Recomendado
              </span>
              <p className="text-xs font-semibold text-gray-700">Tu invitación personal · primer esmaltado a 5€</p>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <p className="flex-1 text-xs text-gray-700 font-mono bg-white border border-rose-100 px-3 py-2 rounded-lg truncate">{invitaLink}</p>
              <button
                onClick={() => copyToClipboard(invitaLink)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex-shrink-0"
                title="Copiar link"
              >
                <i className="ri-file-copy-line text-sm"></i>
              </button>
            </div>
            <button
              onClick={shareNative}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <i className="ri-share-forward-fill text-base"></i>Compartir mi invitación
            </button>
          </div>

          {/* Link for bookings */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Otras versiones del enlace</p>
            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-calendar-check-line text-teal-500 text-sm"></i>
                <p className="text-xs font-semibold text-gray-600">Enlace directo a reservas</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded-lg truncate">{referralLink}</p>
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors cursor-pointer flex-shrink-0"
                >
                  <i className="ri-file-copy-line text-sm"></i>
                </button>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-graduation-cap-line text-rose-500 text-sm"></i>
                <p className="text-xs font-semibold text-gray-600">Enlace para el curso</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded-lg truncate">{courseLink}</p>
                <button
                  onClick={() => copyToClipboard(courseLink)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer flex-shrink-0"
                >
                  <i className="ri-file-copy-line text-sm"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={shareWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-whatsapp-line text-base"></i>Compartir por WhatsApp
            </button>
            <button
              onClick={() => copyToClipboard(referralLink)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-share-line text-base"></i>Copiar enlace
            </button>
          </div>
        </div>
      )}

      {/* Referral history */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i className="ri-history-line text-rose-500"></i> Historial de referidos
        </h3>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-10">
            <i className="ri-user-add-line text-3xl text-gray-200 block mb-2"></i>
            <p className="text-gray-400 text-sm">Aún no tienes referidos</p>
            <p className="text-xs text-gray-300 mt-1">Comparte tu enlace y empieza a ganar puntos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRefs.length > 0 && (
              <div className="bg-amber-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <i className="ri-time-line text-amber-500 text-sm"></i>
                <p className="text-xs text-amber-700">{pendingRefs.length} referido{pendingRefs.length !== 1 ? "s" : ""} pendiente{pendingRefs.length !== 1 ? "s" : ""} de completar</p>
              </div>
            )}
            {referrals.map(ref => {
              const ev = EVENT_LABELS[ref.event_type] ?? EVENT_LABELS.booking;
              return (
                <div key={ref.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 ${ev.color}`}>
                      <i className={`${ev.icon} text-sm`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{ev.label}</p>
                      <p className="text-xs text-gray-400">
                        {ref.referred_email ? `${ref.referred_email} · ` : ""}
                        {new Date(ref.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ref.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                      {ref.status === "completed" ? "Completado" : "Pendiente"}
                    </span>
                    {ref.status === "completed" && (
                      <span className="text-sm font-bold text-amber-600">+{ref.points_awarded} pts</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="bg-rose-50 rounded-2xl border border-rose-100 p-5">
        <div className="flex items-start gap-3">
          <i className="ri-information-line text-rose-500 text-lg mt-0.5 flex-shrink-0"></i>
          <div>
            <p className="text-sm font-semibold text-rose-800 mb-1">Condiciones del programa</p>
            <ul className="text-xs text-rose-700 space-y-1 leading-relaxed">
              <li>• Los puntos se acreditan cuando la reserva o compra se completa correctamente</li>
              <li>• No hay límite de referidos — cuantos más compartas, más puntos ganas</li>
              <li>• Los puntos se pueden canjear en tu próxima compra o reserva (100 pts = 1 €)</li>
              <li>• El enlace de referido es personal e intransferible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
