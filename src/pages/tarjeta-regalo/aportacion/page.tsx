import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/pages/home/components/Navbar";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
const GIFT_FN = `${SUPABASE_URL}/functions/v1/stripe-gift-checkout`;

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  group_target: number;
  group_collected: number;
  recipient_name: string;
  recipient_email: string;
  message: string;
  occasion: string;
  created_at: string;
}

export default function AportacionPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();

  const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [contributorName, setContributorName] = useState("");
  const [contributorEmail, setContributorEmail] = useState("");
  const [amount, setAmount] = useState(25);
  const [submitting, setSubmitting] = useState(false);

  // Fetch gift card data
  useEffect(() => {
    const fetchGiftCard = async () => {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
        const { data, error: err } = await supabase
          .from("gift_cards")
          .select("*")
          .eq("code", codigo?.toUpperCase())
          .eq("gift_type", "group")
          .single();

        if (err || !data) {
          setNotFound(true);
          setError("Tarjeta regalo grupal no encontrada");
          return;
        }

        setGiftCard(data as GiftCard);
      } catch (err) {
        setError("Error al cargar la tarjeta regalo");
      } finally {
        setLoading(false);
      }
    };

    if (codigo) fetchGiftCard();
  }, [codigo]);

  const remaining = giftCard ? giftCard.group_target - giftCard.group_collected : 0;
  const isComplete = remaining <= 0;
  const progress = giftCard ? (giftCard.group_collected / giftCard.group_target) * 100 : 0;

  const handleContribute = async () => {
    if (!giftCard || !contributorName.trim() || !contributorEmail.includes("@") || amount < 5) {
      setError("Por favor, completa todos los campos");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(GIFT_FN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON}`,
          "apikey": SUPABASE_ANON,
        },
        body: JSON.stringify({
          mode: "group",
          amount,
          targetAmount: giftCard.group_target,
          buyerName: contributorName.trim(),
          buyerEmail: contributorEmail.trim(),
          recipientName: giftCard.recipient_name,
          recipientEmail: giftCard.recipient_email,
          message: giftCard.message,
          occasion: giftCard.occasion,
          contributors: [contributorName.trim()],
          delivery: "email",
          deliveryFee: 0,
          successUrl: `${window.location.origin}/tarjeta-regalo/exito`,
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Error al procesar la aportación");
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white pt-24 pb-20 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tarjeta regalo...</p>
          </div>
        </main>
      </>
    );
  }

  if (notFound || !giftCard) {
    return (
      <>
        <Helmet><title>Tarjeta regalo no encontrada | NAILOX</title></Helmet>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white pt-24 pb-20 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <i className="ri-alert-line text-4xl text-red-600"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">No encontrada</h1>
            <p className="text-gray-600 mb-8">La tarjeta regalo grupal no existe o el enlace es incorrecto.</p>
            <a
              href="/tarjeta-regalo"
              className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <i className="ri-arrow-left-line"></i> Volver a tarjetas regalo
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Aporta a la tarjeta grupal | NAILOX</title>
        <meta name="description" content={`Únete a la recaudación para ${giftCard.recipient_name}`} />
        <meta property="og:site_name" content="NAILOX" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.nailox.com/tarjeta-regalo/aportacion/${giftCard.code}`} />
        <meta property="og:title" content={`Aporta a la tarjeta regalo para ${giftCard.recipient_name} | NAILOX`} />
        <meta property="og:description" content={`Contribuye a la tarjeta regalo grupal para ${giftCard.recipient_name}. Suma tu aporte para regalar una experiencia NAILOX.`} />
        <meta property="og:image" content="https://www.nailox.com/assets/manicure-premium.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="es_ES" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Aporta a la tarjeta regalo para ${giftCard.recipient_name} | NAILOX`} />
        <meta name="twitter:description" content={`Contribuye a la tarjeta regalo grupal. Suma tu aporte para regalar una experiencia de manicura.`} />
        <meta name="twitter:image" content="https://www.nailox.com/assets/manicure-premium.png" />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50/30">
        {/* Hero */}
        <section className="pt-24 md:pt-32 pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Tarjeta Regalo Grupal
            </h1>
            <p className="text-lg text-gray-500">
              Únete a otros para regalar una experiencia especial a <span className="font-semibold text-gray-900">{giftCard.recipient_name}</span>
            </p>
          </div>
        </section>

        {/* Main content */}
        <section className="pb-20 px-4">
          <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-1">
              {!isComplete ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24 space-y-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i className="ri-gift-line text-rose-500"></i> Tu aportación
                  </h2>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tu nombre *</label>
                    <input
                      type="text"
                      value={contributorName}
                      onChange={(e) => setContributorName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tu email *</label>
                    <input
                      type="email"
                      value={contributorEmail}
                      onChange={(e) => setContributorEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-3">Cantidad *</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[10, 25, 50].map((a) => (
                        <button
                          key={a}
                          onClick={() => setAmount(a)}
                          disabled={a > remaining}
                          className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            amount === a
                              ? "bg-rose-600 text-white shadow-lg shadow-rose-200 scale-105"
                              : "bg-gray-50 text-gray-700 hover:bg-rose-50 hover:text-rose-600 border border-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          }`}
                        >
                          {a} €
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={5}
                        max={remaining}
                        value={amount}
                        onChange={(e) => setAmount(Math.max(5, Math.min(remaining, Number(e.target.value))))}
                        className="w-full px-4 py-2.5 pr-8 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <i className="ri-error-warning-line"></i> {error}
                    </div>
                  )}

                  <button
                    onClick={handleContribute}
                    disabled={submitting || !contributorName.trim() || !contributorEmail.includes("@") || amount < 5}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:hover:bg-rose-600 text-white font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><i className="ri-loader-4-line animate-spin"></i> Procesando...</>
                    ) : (
                      <><i className="ri-lock-line"></i> Aportar {amount} €</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-6 sticky top-24">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="ri-check-circle-fill text-3xl text-emerald-600"></i>
                    <div>
                      <p className="font-bold text-emerald-900">¡Objetivo alcanzado! 🎉</p>
                      <p className="text-sm text-emerald-700">La tarjeta grupal está lista</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Card preview & progress */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gift card visual */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-400 p-8 text-white shadow-2xl shadow-rose-300/40 aspect-[3/2]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <i className="ri-team-line absolute top-6 right-6 text-5xl text-white/10"></i>

                <div className="relative h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-playfair text-lg font-bold tracking-widest">
                        NAIL<span className="text-violet-200">OX</span>
                      </span>
                      <span className="text-2xl">👩</span>
                    </div>
                    <p className="text-white/70 text-xs mt-1 uppercase tracking-wider">
                      Tarjeta Grupal · {giftCard.occasion}
                    </p>
                  </div>

                  <div>
                    <p className="text-4xl font-bold">{giftCard.group_target} €</p>
                    <p className="text-white/80 text-sm mt-1">
                      Para: <span className="font-semibold text-white">{giftCard.recipient_name}</span>
                    </p>
                  </div>

                  <div>
                    {giftCard.message && (
                      <p className="text-white/70 text-xs italic max-w-[250px] line-clamp-2 mb-2">"{giftCard.message}"</p>
                    )}
                    <p className="text-white/40 text-[10px]">Válida 12 meses</p>
                  </div>
                </div>
              </div>

              {/* Progress section */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Progreso del bote</p>
                  <p className="text-sm font-bold text-rose-600">
                    {giftCard.group_collected} € / {giftCard.group_target} €
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {remaining > 0
                      ? `Faltan ${remaining} € para completar la recaudación`
                      : "¡El objetivo ha sido alcanzado! 🎉"
                    }
                  </p>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 space-y-3">
                <div className="flex gap-3">
                  <i className="ri-information-line text-blue-600 shrink-0 text-xl"></i>
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold mb-1">¿Cómo funciona?</p>
                    <ul className="space-y-1 text-xs list-disc list-inside">
                      <li>Aporta la cantidad que desees</li>
                      <li>Paga de forma segura con tu tarjeta</li>
                      <li>Recibirás confirmación por email</li>
                      <li>Cuando se complete, se enviará la tarjeta a {giftCard.recipient_name}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
