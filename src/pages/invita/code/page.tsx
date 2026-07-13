import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/lib/supabase";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";

interface ReferrerInfo {
  id: string;
  name: string | null;
  referral_code: string;
}

interface ServiceLite {
  id: string;
  nombre: string;
  precio_eur: number;
  duracion_min: number;
}

// Trabajos reales del salón (rotamos para variedad visual)
const GALLERY = [
  "/assets/manicure-premium.png",
  "/assets/manicure-pastel.jpg",
  "/assets/manicure-exotic.jpg",
  "/assets/pedicure-luxury.jpg",
  "/assets/extensions-premium.png",
];

// Testimonios destacados (idealmente del backend pero por ahora hardcoded)
const TESTIMONIALS = [
  { name: "Laura S.", text: "Las uñas más bonitas que me he hecho nunca. Gloria es un crack. Repito sin dudar.", rating: 5 },
  { name: "Marta P.", text: "El sitio es precioso, te tratan súper bien y la manicura me dura 4 semanas perfecta. 100% recomendado.", rating: 5 },
];

export default function InvitaLandingPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        // Lookup referrer by code
        let { data: ref } = await supabase
          .from("profiles")
          .select("id, name, referral_code")
          .eq("referral_code", code)
          .maybeSingle();

        if (!ref) {
          const { data: caRef } = await supabase
            .from("client_accounts")
            .select("id, name, referral_code")
            .eq("referral_code", code)
            .maybeSingle();
          ref = caRef;
        }
        if (cancelled) return;
        if (!ref) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setReferrer(ref as ReferrerInfo);
        // Persist the ref code in sessionStorage so /reservar picks it up
        sessionStorage.setItem("caluatnails_ref", code);

        // Fetch a couple of headline services
        const { data: svcs } = await supabase
          .from("services")
          .select("id, nombre, precio_eur, duracion_min")
          .eq("activo", true)
          .order("precio_eur", { ascending: true })
          .limit(6);
        if (!cancelled) setServices((svcs ?? []) as ServiceLite[]);
      } catch (e) {
        console.error("InvitaLandingPage error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  const firstName = (referrer?.name || "").trim().split(" ")[0] || "Una amiga";

  // CTA → reservar con el ref code ya aplicado
  const ctaHref = `/reservar?ref=${encodeURIComponent(code || "")}`;
  const title = referrer ? `${firstName} te invita a CALUATNAILS · 1ª manicura desde 5€` : "Invitación CALUATNAILS";
  const description = referrer
    ? `${firstName} te recomienda CALUATNAILS, salón de manicura y pedicura premium en el Eixample, Barcelona. Tu primer esmaltado semipermanente por solo 5€ al reservar con su invitación. Plazas limitadas.`
    : "Invitación a CALUATNAILS. Salón premium de manicura y pedicura en el Eixample, Barcelona.";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50/40">
        <div className="w-12 h-12 rounded-full border-2 border-rose-200 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-rose-50 via-white to-rose-50/30">
          <div className="max-w-md text-center">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-rose-100 items-center justify-center mb-4">
              <i className="ri-link-unlink text-2xl text-rose-500"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Esta invitación no existe</h1>
            <p className="text-gray-500 mb-6">El código <strong>{code}</strong> no corresponde a ninguna invitación válida. Quizá lo copiaste mal.</p>
            <button
              onClick={() => navigate("/reservar")}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold px-6 py-3 rounded-full transition-colors cursor-pointer"
            >
              <i className="ri-calendar-line"></i> Reservar igualmente
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://www.caluatnails.com/invita/${code}`} />
        <meta name="robots" content="noindex, follow" />
        {/* OG personalized */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.caluatnails.com/invita/${code}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://www.caluatnails.com/assets/manicure-premium.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="es_ES" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://www.caluatnails.com/assets/manicure-premium.png" />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50/30">
        {/* ─── HERO ─── */}
        <section className="relative pt-24 md:pt-32 pb-12 px-4 overflow-hidden">
          {/* Decorative bokeh */}
          <div className="pointer-events-none absolute top-12 -left-20 w-80 h-80 bg-rose-200/40 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute top-40 -right-16 w-72 h-72 bg-amber-200/50 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
              <span className="text-rose-600">{firstName}</span> te invita
              <span className="block">a probar CALUATNAILS</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-3">
              Salón de manicura y pedicura premium en el Eixample, Barcelona.
            </p>

            {/* Hook claro: precio */}
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white px-6 py-4 rounded-2xl shadow-xl shadow-rose-200/50 my-8">
              <i className="ri-sparkling-2-fill text-2xl"></i>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider opacity-90">Tu regalo de bienvenida</p>
                <p className="font-bold text-xl">Esmaltado semipermanente por solo 5€</p>
                <p className="text-xs opacity-90">Precio normal 18€ · Solo en tu primera cita</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Link
                to={ctaHref}
                className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-4 rounded-full text-lg shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <i className="ri-calendar-check-line"></i> Reservar mi primera cita
              </Link>
              <a
                href="https://wa.me/34636689101"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-rose-200 text-gray-900 font-bold px-8 py-4 rounded-full text-lg transition-all cursor-pointer"
              >
                <i className="ri-whatsapp-line text-emerald-500"></i> Preguntar por WhatsApp
              </a>
            </div>

            <p className="text-xs text-gray-400 mt-5">
              Código aplicado: <span className="font-mono font-bold text-gray-700">{code}</span>
            </p>
          </div>
        </section>

        {/* ─── TRUST SIGNALS ─── */}
        <section className="px-4 py-10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "4.9★", label: "Google · 200+ reseñas", icon: "ri-google-fill", color: "from-amber-400 to-orange-500" },
              { value: "Eixample", label: "Rosselló 497, BCN", icon: "ri-map-pin-fill", color: "from-rose-400 to-pink-500" },
              { value: "+3 años", label: "Cuidando uñas premium", icon: "ri-medal-fill", color: "from-violet-400 to-fuchsia-500" },
              { value: "GREEN", label: "Quality en WhatsApp Meta", icon: "ri-verified-badge-fill", color: "from-emerald-400 to-teal-500" },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-4 text-center shadow-md`}>
                <i className={`${s.icon} text-2xl mb-1 block opacity-90`}></i>
                <p className="text-xl font-bold leading-tight">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-90 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── GALERÍA ─── */}
        <section className="px-4 py-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Nuestros trabajos</h2>
              <p className="text-gray-500 text-sm">Manicuras, pedicuras y nail art de cliente real</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GALLERY.map((src, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden bg-rose-100 ${i === 0 ? "row-span-2 md:row-span-1" : ""}`}>
                  <img src={src} alt={`Trabajo CALUATNAILS ${i + 1}`} className="w-full h-full object-cover aspect-square" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SERVICIOS RÁPIDOS ─── */}
        {services.length > 0 && (
          <section className="px-4 py-10">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Qué te puedes hacer</h2>
                <p className="text-gray-500 text-sm">Los más populares — precios reales</p>
              </div>
              <div className="space-y-2">
                {services.slice(0, 6).map((s) => (
                  <Link
                    key={s.id}
                    to={ctaHref}
                    className="flex items-center justify-between gap-3 bg-white border border-gray-100 hover:border-rose-200 hover:shadow-sm rounded-2xl p-4 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                        <i className="ri-magic-line text-rose-500"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{s.nombre}</p>
                        <p className="text-[11px] text-gray-400">{s.duracion_min} min</p>
                      </div>
                    </div>
                    <span className="font-bold text-rose-600 shrink-0">{s.precio_eur}€</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── TESTIMONIOS ─── */}
        <section className="px-4 py-10">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Lo que dicen nuestras clientas</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex gap-1 mb-2 text-amber-400">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <i key={i} className="ri-star-fill" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">"{t.text}"</p>
                  <p className="text-xs font-bold text-gray-500">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── BOTTOM CTA ─── */}
        <section className="px-4 py-12">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl shadow-rose-200">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center mb-4">
              <i className="ri-sparkling-fill text-3xl"></i>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">¿Lista para tu primera cita?</h2>
            <p className="text-white/85 text-lg mb-7 max-w-xl mx-auto">
              {firstName} te recomendó, te esperamos. Tu esmaltado por solo 5€ al usar su invitación.
            </p>
            <Link
              to={ctaHref}
              className="inline-flex items-center justify-center gap-2 bg-white text-rose-600 hover:bg-rose-50 font-bold px-10 py-4 rounded-full text-lg transition-colors shadow-lg cursor-pointer"
            >
              <i className="ri-calendar-line"></i> Reservar ahora
            </Link>
            <p className="text-xs text-white/70 mt-4">
              Sin compromiso. Pago en el salón.
            </p>
          </div>
        </section>

        {/* Footer fineprint */}
        <section className="px-4 pb-12">
          <div className="max-w-3xl mx-auto text-center text-xs text-gray-400 leading-relaxed">
            <i className="ri-information-line mr-1"></i>
            La oferta de esmaltado semipermanente por 5€ aplica únicamente en la primera cita de clientas nuevas, usando esta invitación. Una sola vez por persona. CALUATNAILS se reserva el derecho a verificar la elegibilidad.
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
