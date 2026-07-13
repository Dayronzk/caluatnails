import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/pages/home/components/Navbar";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
const GIFT_FN = `${SUPABASE_URL}/functions/v1/stripe-gift-checkout`;

const AMOUNTS = [25, 50, 75, 100, 150, 200];

const FEATURES = [
  { icon: "ri-coin-line", title: "+100 pts por cada 10€", desc: "Tú y quien recibe la tarjeta ganan 100 puntos por cada 10€" },
  { icon: "ri-gift-line", title: "Entrega inmediata", desc: "Se envía por email al instante tras el pago" },
  { icon: "ri-calendar-check-line", title: "Válida 1 año", desc: "12 meses para disfrutar de cualquier servicio" },
  { icon: "ri-hand-heart-line", title: "Todos los servicios", desc: "Manicura, pedicura, gel, semipermanente y más" },
  { icon: "ri-shield-check-line", title: "Pago 100% seguro", desc: "Procesado con Stripe, cifrado de extremo a extremo" },
];

interface Occasion {
  emoji: string;
  label: string;
  gradient: string;
  accent: string;
  bg: string;
  border: string;
  decorIcon: string;
}

const OCCASIONS: Occasion[] = [
  { emoji: "🎂", label: "Cumpleaños", gradient: "from-fuchsia-500 via-pink-500 to-rose-400", accent: "text-fuchsia-200", bg: "bg-fuchsia-50", border: "border-fuchsia-300", decorIcon: "ri-cake-2-fill" },
  { emoji: "💝", label: "San Valentín", gradient: "from-red-500 via-rose-500 to-pink-400", accent: "text-red-200", bg: "bg-red-50", border: "border-red-300", decorIcon: "ri-heart-3-fill" },
  { emoji: "🎄", label: "Navidad", gradient: "from-emerald-600 via-green-600 to-teal-500", accent: "text-emerald-200", bg: "bg-emerald-50", border: "border-emerald-300", decorIcon: "ri-tree-fill" },
  { emoji: "👩", label: "Día de la Madre", gradient: "from-violet-500 via-purple-500 to-fuchsia-400", accent: "text-violet-200", bg: "bg-violet-50", border: "border-violet-300", decorIcon: "ri-heart-2-fill" },
  { emoji: "🎓", label: "Graduación", gradient: "from-blue-600 via-indigo-500 to-violet-500", accent: "text-blue-200", bg: "bg-blue-50", border: "border-blue-300", decorIcon: "ri-award-fill" },
  { emoji: "💍", label: "Despedida de soltera", gradient: "from-amber-400 via-orange-400 to-rose-400", accent: "text-amber-200", bg: "bg-amber-50", border: "border-amber-300", decorIcon: "ri-sparkling-2-fill" },
  { emoji: "🙏", label: "Agradecimiento", gradient: "from-teal-500 via-cyan-500 to-sky-400", accent: "text-teal-200", bg: "bg-teal-50", border: "border-teal-300", decorIcon: "ri-hand-heart-fill" },
  { emoji: "✨", label: "Porque sí", gradient: "from-rose-500 via-pink-500 to-rose-600", accent: "text-rose-200", bg: "bg-rose-50", border: "border-rose-300", decorIcon: "ri-sparkling-fill" },
];

type GiftMode = "single" | "bulk" | "group";
type DeliveryMethod = "email" | "sms" | "whatsapp" | "postal";

interface Recipient {
  name: string;
  email: string;
}

const DELIVERY_OPTIONS: { key: DeliveryMethod; icon: string; label: string; desc: string; price: number }[] = [
  { key: "email", icon: "ri-mail-send-line", label: "Email", desc: "Entrega inmediata al correo electrónico", price: 0 },
  { key: "whatsapp", icon: "ri-whatsapp-line", label: "WhatsApp", desc: "Se envía al WhatsApp del destinatario", price: 0 },
  { key: "sms", icon: "ri-chat-1-line", label: "SMS", desc: "Se envía por mensaje de texto", price: 0 },
  { key: "postal", icon: "ri-home-heart-line", label: "A domicilio", desc: "Tarjeta física premium por correo postal", price: 20 },
];

const MODES: { key: GiftMode; icon: string; title: string; desc: string }[] = [
  { key: "single", icon: "ri-user-line", title: "Para una persona", desc: "Envía una tarjeta regalo a un destinatario" },
  { key: "bulk", icon: "ri-group-line", title: "Para varias personas", desc: "Envía tarjetas regalo a varias personas a la vez" },
  { key: "group", icon: "ri-team-line", title: "Tarjeta grupal", desc: "Reúne dinero de varias personas para un destinatario" },
];

export default function TarjetaRegaloPage() {
  const [mode, setMode] = useState<GiftMode>("single");
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  // Single mode
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  // Bulk mode
  const [recipients, setRecipients] = useState<Recipient[]>([{ name: "", email: "" }]);
  // Group mode
  const [groupRecipientName, setGroupRecipientName] = useState("");
  const [groupRecipientEmail, setGroupRecipientEmail] = useState("");
  const [groupTarget, setGroupTarget] = useState(100);
  const [groupContribution, setGroupContribution] = useState(25);
  const [contributors, setContributors] = useState<{ name: string }[]>([{ name: "" }]);

  // Delivery
  const [delivery, setDelivery] = useState<DeliveryMethod>("email");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [postalAddress, setPostalAddress] = useState("");
  const [postalCity, setPostalCity] = useState("");
  const [postalZip, setPostalZip] = useState("");

  const [occasion, setOccasion] = useState<Occasion>(OCCASIONS[7]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deliveryFee = DELIVERY_OPTIONS.find(d => d.key === delivery)?.price ?? 0;

  const finalAmount = isCustom ? Number(customAmount) || 0 : amount;

  // Delivery validation
  const deliveryValid = (() => {
    if (delivery === "email") return true; // email already required in buyer
    if (delivery === "sms" || delivery === "whatsapp") return recipientPhone.trim().length >= 9;
    if (delivery === "postal") return postalAddress.trim().length > 0 && postalCity.trim().length > 0 && postalZip.trim().length >= 4;
    return true;
  })();

  // Validation per mode
  const baseValid = buyerName.trim().length > 0 && buyerEmail.includes("@") && deliveryValid;
  const isValid = (() => {
    if (!baseValid) return false;
    if (mode === "single") return finalAmount >= 10 && finalAmount <= 500;
    if (mode === "bulk") {
      const validRecipients = recipients.filter(r => r.name.trim() && r.email.includes("@"));
      return finalAmount >= 10 && finalAmount <= 500 && validRecipients.length > 0;
    }
    if (mode === "group") {
      return groupContribution >= 5 && groupRecipientName.trim().length > 0 && groupRecipientEmail.includes("@");
    }
    return false;
  })();

  // Total price (includes delivery fee)
  const subtotal = (() => {
    if (mode === "single") return finalAmount;
    if (mode === "bulk") {
      const count = recipients.filter(r => r.name.trim() && r.email.includes("@")).length;
      return finalAmount * count;
    }
    if (mode === "group") return groupContribution;
    return 0;
  })();
  const totalPrice = subtotal + deliveryFee;

  // Min delivery date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];
  // Max for postal = +30 days; digital = +365 days
  const maxDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (delivery === "postal" ? 30 : 365));
    return d.toISOString().split("T")[0];
  })();

  const handleCheckout = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const deliveryData = {
        delivery,
        deliveryDate: deliveryDate || null,
        deliveryFee,
        recipientPhone: (delivery === "sms" || delivery === "whatsapp") ? recipientPhone.trim() : null,
        postalAddress: delivery === "postal" ? {
          address: postalAddress.trim(),
          city: postalCity.trim(),
          zip: postalZip.trim(),
        } : null,
      };

      const callFn = async (payload: Record<string, unknown>) => {
        const res = await fetch(GIFT_FN, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON}`,
            "apikey": SUPABASE_ANON
          },
          body: JSON.stringify({ ...payload, ...deliveryData }),
        });
        return res.json();
      };

      let data;
      if (mode === "single") {
        data = await callFn({
          mode: "single",
          amount: finalAmount,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          recipientName: recipientName.trim() || null,
          recipientEmail: recipientEmail.trim() || null,
          message: message.trim() || null,
          occasion: occasion.label,
          successUrl: `${window.location.origin}/tarjeta-regalo/exito`,
          cancelUrl: window.location.href,
        });
      } else if (mode === "bulk") {
        const validRecipients = recipients.filter(r => r.name.trim() && r.email.includes("@"));
        data = await callFn({
          mode: "bulk",
          amount: finalAmount,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          recipients: validRecipients.map(r => ({ name: r.name.trim(), email: r.email.trim() })),
          message: message.trim() || null,
          occasion: occasion.label,
          successUrl: `${window.location.origin}/tarjeta-regalo/exito`,
          cancelUrl: window.location.href,
        });
      } else {
        const contribNames = contributors.filter(c => c.name.trim()).map(c => c.name.trim());
        data = await callFn({
          mode: "group",
          amount: groupContribution,
          targetAmount: groupTarget,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          recipientName: groupRecipientName.trim(),
          recipientEmail: groupRecipientEmail.trim() || null,
          message: message.trim() || null,
          occasion: occasion.label,
          contributors: contribNames,
          successUrl: `${window.location.origin}/tarjeta-regalo/exito`,
          cancelUrl: window.location.href,
        });
      }

      if (data.url) { window.location.href = data.url; return; }
      setError(data.error || "Error al procesar");
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Bulk helpers
  const addRecipient = () => setRecipients(prev => [...prev, { name: "", email: "" }]);
  const removeRecipient = (i: number) => setRecipients(prev => prev.filter((_, idx) => idx !== i));
  const updateRecipient = (i: number, field: keyof Recipient, value: string) =>
    setRecipients(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  // Group helpers
  const addContributor = () => setContributors(prev => [...prev, { name: "" }]);
  const removeContributor = (i: number) => setContributors(prev => prev.filter((_, idx) => idx !== i));

  const searchParams = new URLSearchParams(window.location.search);
  const successCode = searchParams.get("code");
  const isGroupGift = searchParams.get("group") === "1";
  const [linkCopied, setLinkCopied] = useState(false);

  const shareLink = successCode ? `${window.location.origin}/tarjeta-regalo/aportacion/${successCode}` : "";

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // ── Success state ──
  if (window.location.pathname.includes("/exito") || successCode) {
    return (
      <>
        <Helmet><title>¡Tarjeta regalo comprada! | CALUATNAILS Barcelona</title></Helmet>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white pt-24 pb-20 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <i className="ri-check-line text-4xl text-emerald-600"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">¡Tarjeta regalo comprada!</h1>
            <p className="text-gray-600 mb-8">Hemos enviado un email con todos los detalles y el código de la tarjeta.</p>
            {successCode && (
              <div className="space-y-4 mb-8">
                <div className="bg-white rounded-2xl border-2 border-dashed border-rose-200 p-8">
                  <p className="text-sm text-gray-500 mb-2">Tu código de tarjeta regalo</p>
                  <p className="text-3xl font-mono font-bold text-rose-600 tracking-wider">{successCode}</p>
                  <p className="text-xs text-gray-400 mt-3">Válido durante 12 meses en cualquier servicio CALUATNAILS</p>
                </div>

                {isGroupGift && (
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="ri-share-2-line text-violet-600 text-lg"></i>
                      <p className="font-semibold text-violet-900">Comparte este enlace</p>
                    </div>
                    <p className="text-xs text-violet-700 mb-3">Otros pueden contribuir a esta tarjeta grupal usando este enlace:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 px-3 py-2.5 rounded-xl border border-violet-300 bg-white text-xs font-mono text-violet-900 truncate"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                          linkCopied
                            ? "bg-emerald-500 text-white"
                            : "bg-violet-600 hover:bg-violet-700 text-white"
                        }`}
                      >
                        {linkCopied ? (
                          <><i className="ri-check-line"></i> Copiado</>
                        ) : (
                          <><i className="ri-file-copy-line"></i> Copiar</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/reservar" className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full transition-colors">
                <i className="ri-calendar-line"></i> Reservar cita
              </a>
              <a href="/" className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-full hover:bg-gray-50 transition-colors">
                Volver al inicio
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  const bulkValidCount = recipients.filter(r => r.name.trim() && r.email.includes("@")).length;

  return (
    <>
      <Helmet>
        <title>Tarjeta Regalo | CALUATNAILS — Manicura y Pedicura Profesional Barcelona</title>
        <meta name="description" content="Regala una experiencia de manicura y pedicura profesional en Barcelona. Tarjetas regalo CALUATNAILS desde 10€. Entrega inmediata por email, válidas 1 año." />
        <link rel="canonical" href="https://www.caluatnails.com/tarjeta-regalo" />
        <meta property="og:site_name" content="CALUATNAILS" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.caluatnails.com/tarjeta-regalo" />
        <meta property="og:title" content="Tarjeta Regalo CALUATNAILS — Regala Manicura en Barcelona" />
        <meta property="og:description" content="Regala una experiencia de manicura y pedicura profesional en Barcelona. Tarjetas regalo desde 10€, válidas 12 meses." />
        <meta property="og:image" content="https://www.caluatnails.com/assets/manicure-premium.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="es_ES" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tarjeta Regalo CALUATNAILS — Regala Manicura en Barcelona" />
        <meta name="twitter:description" content="Regala una experiencia de manicura y pedicura profesional. Tarjetas desde 10€, válidas 12 meses." />
        <meta name="twitter:image" content="https://www.caluatnails.com/assets/manicure-premium.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Tarjeta Regalo CALUATNAILS",
            description: "Tarjeta regalo para servicios de manicura y pedicura profesional en Barcelona",
            brand: { "@type": "Brand", name: "CALUATNAILS" },
            offers: { "@type": "AggregateOffer", lowPrice: "10", highPrice: "500", priceCurrency: "EUR", availability: "https://schema.org/InStock" },
          })}
        </script>
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50/30">
        {/* Hero */}
        <section className="pt-24 md:pt-32 pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <i className="ri-gift-2-fill"></i> Tarjeta Regalo
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
              Regala una experiencia
              <span className="block text-rose-600">de manicura única</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              La tarjeta regalo perfecta para sorprender a alguien especial.
              Válida para cualquier servicio CALUATNAILS durante 12 meses.
            </p>
          </div>
        </section>

        {/* Double points promo banner */}
        <section className="pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-amber-200/50">
              {/* Decorative shapes */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
              <i className="ri-coin-fill absolute top-4 right-6 text-6xl text-white/10"></i>

              <div className="relative flex items-center gap-4 md:gap-6">
                <div className="hidden sm:flex w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center shrink-0">
                  <i className="ri-coin-fill text-3xl md:text-4xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                    <i className="ri-sparkling-fill"></i> Doble bonus
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold mb-1 leading-tight">
                    +100 puntos por cada 10€ — para los dos
                  </h2>
                  <p className="text-sm md:text-base text-white/90 leading-relaxed">
                    Cada vez que compras una tarjeta regalo, <strong>tú y quien la recibe</strong> ganan
                    puntos canjeables en próximas reservas. ¡Una tarjeta de 50€ da 500 pts a cada uno!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mode selector */}
        <section className="pb-6 px-4">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                  mode === m.key
                    ? "border-rose-400 bg-rose-50 shadow-lg shadow-rose-100"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                {mode === m.key && (
                  <div className="absolute top-3 right-3">
                    <i className="ri-checkbox-circle-fill text-rose-500"></i>
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  mode === m.key ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  <i className={`${m.icon} text-xl`}></i>
                </div>
                <p className={`text-sm font-bold ${mode === m.key ? "text-rose-700" : "text-gray-900"}`}>{m.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Occasions */}
        <section className="pb-8 px-4">
          <p className="text-center text-sm font-semibold text-gray-500 mb-4">¿Cuál es la ocasión?</p>
          <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2">
            {OCCASIONS.map((o) => (
              <button
                key={o.label}
                onClick={() => setOccasion(o)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer border ${
                  occasion.label === o.label
                    ? `${o.bg} ${o.border} text-gray-900 shadow-md scale-105`
                    : "bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* Main form + preview */}
        <section className="pb-20 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

            {/* Left: Form */}
            <div className="lg:col-span-3 space-y-6">

              {/* Amount selector — single & bulk */}
              {mode !== "group" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-money-euro-circle-line text-rose-500"></i>
                    {mode === "bulk" ? "Importe por tarjeta" : "Elige el importe"}
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                    {AMOUNTS.map((a) => (
                      <button
                        key={a}
                        onClick={() => { setAmount(a); setIsCustom(false); }}
                        className={`py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                          !isCustom && amount === a
                            ? "bg-rose-600 text-white shadow-lg shadow-rose-200 scale-105"
                            : "bg-gray-50 text-gray-700 hover:bg-rose-50 hover:text-rose-600 border border-gray-100"
                        }`}
                      >
                        {a} €
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsCustom(!isCustom)}
                      className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer ${
                        isCustom ? "bg-rose-100 text-rose-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Otro importe
                    </button>
                    {isCustom && (
                      <div className="relative flex-1">
                        <input
                          type="number" min={10} max={500} value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="10 – 500"
                          className="w-full px-4 py-2.5 pr-8 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Amount selector — group mode */}
              {mode === "group" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-funds-line text-rose-500"></i> Objetivo y tu aportación
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Objetivo total de la tarjeta</label>
                      <div className="relative">
                        <input
                          type="number" min={20} max={1000} value={groupTarget}
                          onChange={(e) => setGroupTarget(Number(e.target.value))}
                          className="w-full px-4 py-2.5 pr-8 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Importe final que recibirá el destinatario</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tu aportación</label>
                      <div className="relative">
                        <input
                          type="number" min={5} max={groupTarget} value={groupContribution}
                          onChange={(e) => setGroupContribution(Number(e.target.value))}
                          className="w-full px-4 py-2.5 pr-8 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Mínimo 5 €</p>
                    </div>
                  </div>

                  {/* Contributors list */}
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-semibold text-gray-600">¿Quién participa? (aparecerá en la tarjeta)</label>
                      <button onClick={addContributor} className="text-xs text-rose-600 font-semibold hover:text-rose-700 cursor-pointer flex items-center gap-1">
                        <i className="ri-add-line"></i> Añadir
                      </button>
                    </div>
                    <div className="space-y-2">
                      {contributors.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text" value={c.name}
                            onChange={(e) => {
                              const next = [...contributors];
                              next[i] = { name: e.target.value };
                              setContributors(next);
                            }}
                            placeholder={`Nombre participante ${i + 1}`}
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm"
                          />
                          {contributors.length > 1 && (
                            <button onClick={() => removeContributor(i)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 cursor-pointer">
                              <i className="ri-close-line text-sm"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="ri-user-line text-rose-500"></i> Tus datos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tu nombre *</label>
                    <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="María García"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tu email *</label>
                    <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="maria@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm" />
                  </div>
                </div>
              </div>

              {/* Delivery options */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="ri-truck-line text-rose-500"></i> ¿Cómo la entregamos?
                </h2>

                {/* Delivery method cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {DELIVERY_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setDelivery(opt.key)}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                        delivery === opt.key
                          ? `${opt.key === "postal" ? "border-amber-400 bg-amber-50" : "border-rose-400 bg-rose-50"} shadow-lg shadow-rose-100`
                          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      {delivery === opt.key && (
                        <div className="absolute top-3 right-3">
                          <i className="ri-checkbox-circle-fill text-rose-500"></i>
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        delivery === opt.key ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        <i className={`${opt.icon} text-xl`}></i>
                      </div>
                      <p className={`text-sm font-bold ${delivery === opt.key ? "text-rose-700" : "text-gray-900"}`}>{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      <p className="text-xs font-semibold text-gray-400 mt-2">
                        {opt.price === 0 ? "Gratis" : `+${opt.price} €`}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Date picker (all methods) */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha de entrega programada (opcional)</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {delivery === "postal" ? "Máximo 30 días" : "Máximo 365 días"}
                  </p>
                </div>

                {/* Phone input (SMS + WhatsApp) */}
                {(delivery === "sms" || delivery === "whatsapp") && (
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Número de teléfono del destinatario *
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="+34 600 000 000"
                      className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-colors ${
                        recipientPhone.trim().length >= 9
                          ? "border-emerald-300 focus:border-emerald-400"
                          : "border-rose-300 focus:border-rose-400"
                      }`}
                    />
                    <p className="text-xs text-gray-400 mt-1">Necesitamos el número para enviar la tarjeta</p>
                    {recipientPhone.trim().length < 9 && recipientPhone.trim().length > 0 && (
                      <p className="text-xs text-rose-500 mt-1">⚠️ Introduce un número válido (mínimo 9 dígitos)</p>
                    )}
                  </div>
                )}

                {/* Address fields (Postal) */}
                {delivery === "postal" && (
                  <div className="space-y-4 mb-6 pb-6 border-t border-gray-100 pt-6">
                    <p className="text-sm font-semibold text-gray-900">Dirección de envío *</p>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dirección</label>
                      <input
                        type="text"
                        value={postalAddress}
                        onChange={(e) => setPostalAddress(e.target.value)}
                        placeholder="Calle Principal, 123, Apto 4B"
                        className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-colors ${
                          postalAddress.trim().length > 0 ? "border-emerald-300 focus:border-emerald-400" : "border-rose-300 focus:border-rose-400"
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ciudad</label>
                        <input
                          type="text"
                          value={postalCity}
                          onChange={(e) => setPostalCity(e.target.value)}
                          placeholder="Barcelona"
                          className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-colors ${
                            postalCity.trim().length > 0 ? "border-emerald-300 focus:border-emerald-400" : "border-rose-300 focus:border-rose-400"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Código postal</label>
                        <input
                          type="text"
                          value={postalZip}
                          onChange={(e) => setPostalZip(e.target.value)}
                          placeholder="08001"
                          className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-colors ${
                            postalZip.trim().length >= 4 ? "border-emerald-300 focus:border-emerald-400" : "border-rose-300 focus:border-rose-400"
                          }`}
                        />
                      </div>
                    </div>
                    {!deliveryValid && (delivery === "postal") && (
                      <div className="bg-rose-50 rounded-xl p-3 flex items-start gap-2 text-sm border border-rose-200">
                        <i className="ri-alert-line text-rose-600 shrink-0 mt-0.5"></i>
                        <span className="text-rose-700">
                          Por favor, completa todos los campos de dirección para continuar
                        </span>
                      </div>
                    )}
                    <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-2 text-sm">
                      <i className="ri-information-line text-amber-600 shrink-0 mt-0.5"></i>
                      <span className="text-amber-700">
                        Tarjeta premium física con recargo de <strong>20 €</strong>. Entrega en 5-7 días laborales.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipient — single mode */}
              {mode === "single" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-heart-line text-rose-500"></i> ¿Para quién es?
                    <span className="text-xs font-normal text-gray-400">(opcional)</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre del destinatario</label>
                      <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Laura Pérez"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email del destinatario</label>
                      <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="laura@email.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm" />
                      <p className="text-xs text-gray-400 mt-1">Le enviaremos la tarjeta por email</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mensaje personalizado</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="¡Feliz cumpleaños! Disfruta de unas uñas increíbles 💅" rows={3} maxLength={300}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm resize-none" />
                    <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/300</p>
                  </div>
                </div>
              )}

              {/* Recipients — bulk mode */}
              {mode === "bulk" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <i className="ri-group-line text-rose-500"></i> Destinatarios
                    </h2>
                    <button onClick={addRecipient} className="text-sm text-rose-600 font-semibold hover:text-rose-700 cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors">
                      <i className="ri-add-line"></i> Añadir persona
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recipients.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                        <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input type="text" value={r.name} onChange={(e) => updateRecipient(i, "name", e.target.value)} placeholder="Nombre"
                            className="px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 outline-none text-sm" />
                          <input type="email" value={r.email} onChange={(e) => updateRecipient(i, "email", e.target.value)} placeholder="Email"
                            className="px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 outline-none text-sm" />
                        </div>
                        {recipients.length > 1 && (
                          <button onClick={() => removeRecipient(i)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 cursor-pointer shrink-0 mt-0.5">
                            <i className="ri-close-line text-sm"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {bulkValidCount > 0 && (
                    <div className="mt-4 bg-rose-50 rounded-xl p-3 flex items-center gap-2 text-sm">
                      <i className="ri-information-line text-rose-500"></i>
                      <span className="text-rose-700">
                        {bulkValidCount} tarjeta{bulkValidCount > 1 ? "s" : ""} de <strong>{finalAmount} €</strong> cada una = <strong>{finalAmount * bulkValidCount} € total</strong>
                      </span>
                    </div>
                  )}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mensaje para todos (opcional)</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="¡Un regalo especial del equipo!" rows={2} maxLength={300}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm resize-none" />
                  </div>
                </div>
              )}

              {/* Recipient — group mode */}
              {mode === "group" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-heart-line text-rose-500"></i> ¿Para quién es la tarjeta grupal? *
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre del destinatario *</label>
                      <input type="text" value={groupRecipientName} onChange={(e) => setGroupRecipientName(e.target.value)} placeholder="Laura Pérez"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email del destinatario</label>
                      <input type="email" value={groupRecipientEmail} onChange={(e) => setGroupRecipientEmail(e.target.value)} placeholder="laura@email.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mensaje del grupo</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="¡De parte de todas! Disfruta de tus uñas 💅" rows={3} maxLength={300}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm resize-none" />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm flex items-center gap-2">
                  <i className="ri-error-warning-line"></i> {error}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleCheckout}
                disabled={!isValid || loading}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:hover:bg-rose-600 text-white text-lg font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-3 shadow-xl shadow-rose-200"
              >
                {loading ? (
                  <><i className="ri-loader-4-line animate-spin text-xl"></i> Procesando...</>
                ) : (
                  <>
                    <i className="ri-lock-line"></i>
                    {mode === "group"
                      ? `Aportar ${groupContribution}${deliveryFee > 0 ? ` + ${deliveryFee} € envío` : ""} €`
                      : mode === "bulk"
                        ? `Comprar ${bulkValidCount} tarjeta${bulkValidCount > 1 ? "s" : ""} — ${subtotal}${deliveryFee > 0 ? ` + ${deliveryFee} € envío` : ""} = ${totalPrice} €`
                        : `Comprar tarjeta regalo — ${finalAmount}${deliveryFee > 0 ? ` + ${deliveryFee} € envío` : ""} = ${totalPrice} €`
                    }
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><i className="ri-lock-line"></i> Pago seguro SSL</span>
                <span className="flex items-center gap-1"><i className="ri-visa-fill text-blue-600"></i></span>
                <span className="flex items-center gap-1"><i className="ri-mastercard-fill text-red-500"></i></span>
                <span>Powered by Stripe</span>
              </div>
            </div>

            {/* Right: Card preview */}
            <div className="lg:col-span-2 sticky top-24">
              {/* Gift card visual — themed by occasion */}
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${occasion.gradient} p-8 text-white shadow-2xl shadow-rose-300/40 aspect-[3/2] transition-all duration-500`}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <i className={`${occasion.decorIcon} absolute top-6 right-6 text-5xl text-white/10`}></i>

                <div className="relative h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-playfair text-lg font-bold tracking-widest">
                        NAIL<span className={occasion.accent}>OX</span>
                      </span>
                      <span className="text-2xl">{occasion.emoji}</span>
                    </div>
                    <p className="text-white/70 text-xs mt-1 uppercase tracking-wider">
                      {mode === "group" ? "Tarjeta Grupal" : "Tarjeta Regalo"} · {occasion.label}
                    </p>
                  </div>

                  <div>
                    <p className="text-4xl font-bold">
                      {mode === "group" ? groupTarget : finalAmount} €
                    </p>
                    {mode === "single" && recipientName && (
                      <p className="text-white/80 text-sm mt-1">Para: <span className="font-semibold text-white">{recipientName}</span></p>
                    )}
                    {mode === "group" && groupRecipientName && (
                      <p className="text-white/80 text-sm mt-1">Para: <span className="font-semibold text-white">{groupRecipientName}</span></p>
                    )}
                    {mode === "bulk" && bulkValidCount > 0 && (
                      <p className="text-white/80 text-sm mt-1">{bulkValidCount} tarjeta{bulkValidCount > 1 ? "s" : ""} de {finalAmount} €</p>
                    )}
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      {mode === "group" && contributors.filter(c => c.name.trim()).length > 0 && (
                        <p className="text-white/70 text-xs">
                          De: {contributors.filter(c => c.name.trim()).map(c => c.name.trim()).join(", ")}
                        </p>
                      )}
                      {message && (
                        <p className="text-white/70 text-xs italic max-w-[200px] line-clamp-2 mt-0.5">"{message}"</p>
                      )}
                    </div>
                    <p className="text-white/40 text-[10px]">Válida 12 meses</p>
                  </div>
                </div>
              </div>

              {/* Group progress bar (only in group mode) */}
              {mode === "group" && (
                <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Progreso del bote</p>
                    <p className="text-sm font-bold text-rose-600">{groupContribution} € / {groupTarget} €</p>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${occasion.gradient} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min((groupContribution / groupTarget) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    <i className="ri-information-line mr-1"></i>
                    Una vez completada la compra, podrás compartir el enlace para que otros aporten su parte
                  </p>
                </div>
              )}

              {/* Features */}
              <div className="mt-6 space-y-3">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                      <i className={`${f.icon} text-lg`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                      <p className="text-xs text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  <i className="ri-shield-check-line mr-1"></i>
                  Más de 500 clientas satisfechas en Barcelona
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
