import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/pages/home/components/Navbar";

interface Promo {
  icon: string;
  title: string;
  desc: string;
  highlight?: string;
  cta?: { label: string; href: string };
  badge?: string;
  gradient: string;
  iconColor: string;
}

const SECTIONS: { title: string; subtitle: string; promos: Promo[] }[] = [
  {
    title: "Club de Suscripciones VIP y Bonos Prepago",
    subtitle: "Ahorra reservando con anticipación y obtén múltiples beneficios gratis",
    promos: [
      {
        icon: "ri-vip-crown-line",
        title: "Hasta 25% de ahorro en cada sesión",
        desc: "Elige tu servicio de manicura o pedicura ideal, define la frecuencia (cada 1, 2 o 3 semanas) y contrata un bono prepago Trimestral, Semestral o Anual. ¡Descuentos automáticos por volumen!",
        highlight: "Hasta -25%",
        badge: "Bono Prepago",
        gradient: "from-amber-400 via-rose-500 to-violet-600",
        iconColor: "text-amber-500 bg-amber-50",
        cta: { label: "Ver planes del Club", href: "/suscripciones" },
      },
      {
        icon: "ri-gift-2-line",
        title: "Meses de regalo en planes prepago",
        desc: "Consigue 1 mes gratis en tu plan prepago Semestral, y hasta 3 meses de regalo (equivalentes) en nuestro plan prepago Anual (VIP).",
        highlight: "Meses Gratis",
        gradient: "from-rose-500 to-violet-600",
        iconColor: "text-rose-500 bg-rose-50",
        cta: { label: "Calcular mis meses gratis", href: "/suscripciones" },
      },
      {
        icon: "ri-sparkling-fill",
        title: "Beneficios y privilegios VIP",
        desc: "Disfruta de prioridad total de reserva en horas pico, garantía de 7 días ante cualquier tipo de rotura y bebidas premium de cortesía ilimitadas.",
        badge: "Premium",
        gradient: "from-violet-400 to-fuchsia-500",
        iconColor: "text-violet-500 bg-violet-50",
        cta: { label: "Ver todos los detalles", href: "/suscripciones" },
      },
    ],
  },
  {
    title: "Al reservar",
    subtitle: "Pagos flexibles y descuentos automáticos",
    promos: [
      {
        icon: "ri-bank-card-2-fill",
        title: "5% de descuento con tarjeta",
        desc: "Paga el total de tu reserva con tarjeta y obtén un 5% de descuento automático en el momento de pagar.",
        highlight: "-5%",
        gradient: "from-emerald-400 to-teal-500",
        iconColor: "text-emerald-500 bg-emerald-50",
        cta: { label: "Reservar ahora", href: "/reservar" },
      },
      {
        icon: "ri-percent-line",
        title: "Anticipo flexible",
        desc: "Si lo prefieres, paga solo el 10% al reservar y el 90% restante en cita. Sin recargos.",
        highlight: "10%",
        gradient: "from-rose-400 to-pink-500",
        iconColor: "text-rose-500 bg-rose-50",
      },
      {
        icon: "ri-smartphone-line",
        title: "Pago por Bizum",
        desc: "Coordinamos contigo el pago por Bizum vía WhatsApp. Sin recargos, ideal si prefieres no usar tarjeta.",
        gradient: "from-emerald-400 to-green-500",
        iconColor: "text-emerald-500 bg-emerald-50",
      },
    ],
  },
  {
    title: "Sistema de puntos CALUATNAILS",
    subtitle: "Acumula puntos y canjéalos por descuentos",
    promos: [
      {
        icon: "ri-coin-line",
        title: "Puntos por cada servicio",
        desc: "Cada servicio reservado te da puntos automáticamente. Por ejemplo, una manicura+pedicura te da 200 puntos.",
        highlight: "100 pts = 1 €",
        badge: "Automático",
        gradient: "from-amber-400 to-orange-500",
        iconColor: "text-amber-500 bg-amber-50",
        cta: { label: "Reservar y ganar puntos", href: "/reservar" },
      },
      {
        icon: "ri-money-euro-circle-line",
        title: "Canjea puntos por euros",
        desc: "Tus puntos se convierten en descuento directo en futuras reservas. 100 puntos equivalen a 1€.",
        gradient: "from-amber-400 to-yellow-500",
        iconColor: "text-amber-500 bg-amber-50",
      },
    ],
  },
  {
    title: "Bonus de bienvenida",
    subtitle: "Hasta 500 puntos gratis al completar tu perfil",
    promos: [
      {
        icon: "ri-mail-check-line",
        title: "Verifica tu email",
        desc: "Confirma tu dirección de correo electrónico en Mi Cuenta.",
        highlight: "+100 pts",
        gradient: "from-sky-400 to-blue-500",
        iconColor: "text-sky-500 bg-sky-50",
      },
      {
        icon: "ri-cake-2-line",
        title: "Añade tu cumpleaños",
        desc: "Cuéntanos cuándo es tu cumpleaños para sorprenderte ese día.",
        highlight: "+100 pts",
        gradient: "from-pink-400 to-rose-500",
        iconColor: "text-pink-500 bg-pink-50",
      },
      {
        icon: "ri-notification-3-line",
        title: "Activa notificaciones",
        desc: "Recibe recordatorios de tu cita 30 min antes y novedades.",
        highlight: "+200 pts",
        gradient: "from-violet-400 to-purple-500",
        iconColor: "text-violet-500 bg-violet-50",
      },
      {
        icon: "ri-google-fill",
        title: "Deja una reseña en Google",
        desc: "Tu opinión nos ayuda a crecer. Una sola vez por cuenta.",
        highlight: "+100 pts",
        gradient: "from-amber-400 via-red-400 to-blue-500",
        iconColor: "text-amber-500 bg-amber-50",
        cta: { label: "Ir a Mi Cuenta", href: "/mi-cuenta" },
      },
    ],
  },
  {
    title: "Programa de referidos",
    subtitle: "Comparte CALUATNAILS y gana puntos por cada amiga",
    promos: [
      {
        icon: "ri-user-add-line",
        title: "+300 puntos por amiga referida",
        desc: "Comparte tu código de referido. Cada vez que una amiga reserve con tu código, ganarás 300 puntos.",
        highlight: "+300 pts",
        badge: "Sin límite",
        gradient: "from-fuchsia-400 to-pink-500",
        iconColor: "text-fuchsia-500 bg-fuchsia-50",
        cta: { label: "Ver mi código", href: "/mi-cuenta" },
      },
    ],
  },
  {
    title: "Tarjetas regalo",
    subtitle: "El regalo perfecto, válido 12 meses",
    promos: [
      {
        icon: "ri-coin-fill",
        title: "100 puntos por cada 10€ — ¡para los dos!",
        desc: "Por cada 10€ de tarjeta regalo, tanto tú como la persona a la que regalas reciben 100 puntos. Ejemplo: regalo de 50€ → +500 pts a cada uno.",
        highlight: "+100 pts / 10€",
        badge: "Doble bonus",
        gradient: "from-amber-400 to-orange-500",
        iconColor: "text-amber-500 bg-amber-50",
        cta: { label: "Comprar tarjeta regalo", href: "/tarjeta-regalo" },
      },
      {
        icon: "ri-gift-2-fill",
        title: "Tarjetas desde 10€",
        desc: "Regala una experiencia CALUATNAILS desde 10€ hasta 500€. Válidas durante 12 meses en cualquier servicio.",
        highlight: "Desde 10€",
        gradient: "from-rose-400 to-pink-500",
        iconColor: "text-rose-500 bg-rose-50",
        cta: { label: "Comprar tarjeta regalo", href: "/tarjeta-regalo" },
      },
      {
        icon: "ri-team-fill",
        title: "Tarjeta grupal",
        desc: "Reúne dinero entre varias personas para regalar una experiencia a alguien especial. Cada uno aporta su parte.",
        badge: "Novedad",
        gradient: "from-violet-400 to-fuchsia-500",
        iconColor: "text-violet-500 bg-violet-50",
      },
      {
        icon: "ri-mail-send-line",
        title: "Múltiples formas de entrega",
        desc: "Email, SMS o WhatsApp (gratis), o entrega postal en tarjeta física premium (+20€).",
        gradient: "from-amber-400 to-orange-500",
        iconColor: "text-amber-500 bg-amber-50",
      },
    ],
  },
  {
    title: "Beneficios especiales",
    subtitle: "Promociones para hacerte sentir especial",
    promos: [
      {
        icon: "ri-cake-3-line",
        title: "Sorpresa de cumpleaños",
        desc: "Si tienes tu fecha de cumpleaños registrada, recibirás un detalle especial en el mes de tu cumple.",
        badge: "Auto",
        gradient: "from-pink-400 to-rose-500",
        iconColor: "text-pink-500 bg-pink-50",
      },
      {
        icon: "ri-coupon-3-line",
        title: "Cupones promocionales",
        desc: "Usa códigos de descuento al reservar (% o importe fijo). Combinables con puntos.",
        gradient: "from-amber-400 to-yellow-500",
        iconColor: "text-amber-500 bg-amber-50",
      },
      {
        icon: "ri-time-line",
        title: "Recordatorio 30 min antes",
        desc: "Te avisamos por push 30 minutos antes de tu cita para que no se te pase.",
        badge: "Auto",
        gradient: "from-sky-400 to-blue-500",
        iconColor: "text-sky-500 bg-sky-50",
      },
    ],
  },
];

export default function PromocionesPage() {
  return (
    <>
      <Helmet>
        <title>Promociones y Descuentos | CALUATNAILS Barcelona</title>
        <meta
          name="description"
          content="Descubre todas las promociones de CALUATNAILS: Club VIP con hasta 25% de ahorro, 5% descuento con tarjeta, hasta 500 pts gratis, programa de referidos y más."
        />
        <link rel="canonical" href="https://www.caluatnails.com/promociones" />
        <meta property="og:site_name" content="CALUATNAILS" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.caluatnails.com/promociones" />
        <meta property="og:title" content="Promociones y Descuentos | CALUATNAILS Barcelona" />
        <meta property="og:description" content="Descubre todas las promociones de CALUATNAILS: Club VIP con hasta 25% de ahorro, 5% descuento con tarjeta, hasta 500 pts gratis, programa de referidos y más." />
        <meta property="og:image" content="https://www.caluatnails.com/assets/manicure-premium.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="es_ES" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Promociones y Descuentos | CALUATNAILS Barcelona" />
        <meta name="twitter:description" content="Club VIP con hasta 25% de ahorro, 5% descuento con tarjeta, hasta 500 pts gratis, programa de referidos y más." />
        <meta name="twitter:image" content="https://www.caluatnails.com/assets/manicure-premium.png" />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50/30">
        {/* Hero */}
        <section className="pt-28 md:pt-36 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <i className="ri-sparkling-2-fill"></i> Promociones activas
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
              Más beneficios <span className="text-rose-600">por ser cliente</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              En CALUATNAILS premiamos tu confianza con descuentos, puntos y experiencias únicas.
              Aquí tienes todas las promociones que tenemos para ti.
            </p>
          </div>
        </section>

        {/* Stats banner */}
        <section className="pb-12 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Ahorro Club VIP", value: "Hasta -25%", icon: "ri-vip-crown-fill", color: "from-amber-500 to-rose-600" },
              { label: "Regalo Bono Anual", value: "3 Meses Gratis", icon: "ri-gift-fill", color: "from-violet-500 to-fuchsia-600" },
              { label: "Descuento con tarjeta", value: "-5%", icon: "ri-bank-card-2-fill", color: "from-emerald-500 to-teal-500" },
              { label: "Puntos de bienvenida", value: "+500 pts", icon: "ri-coin-fill", color: "from-amber-500 to-orange-500" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`bg-gradient-to-br ${stat.color} text-white rounded-2xl p-4 text-center shadow-md`}
              >
                <i className={`${stat.icon} text-2xl mb-1 block opacity-90`}></i>
                <p className="text-xl md:text-2xl font-bold leading-tight">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-90 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sections */}
        <section className="pb-20 px-4">
          <div className="max-w-6xl mx-auto space-y-16">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{section.title}</h2>
                  <p className="text-gray-500">{section.subtitle}</p>
                </div>

                <div className={`grid gap-4 ${
                  section.promos.length === 1
                    ? "grid-cols-1 max-w-2xl mx-auto"
                    : section.promos.length === 2
                      ? "grid-cols-1 md:grid-cols-2"
                      : section.promos.length === 4
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`}>
                  {section.promos.map((promo) => (
                    <div
                      key={promo.title}
                      className="relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-rose-100 hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Highlight badge */}
                      {promo.highlight && (
                        <div className={`absolute -top-3 -right-3 bg-gradient-to-r ${promo.gradient} text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg`}>
                          {promo.highlight}
                        </div>
                      )}

                      {/* Top-left small badge */}
                      {promo.badge && !promo.highlight && (
                        <div className="absolute top-3 right-3 bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                          {promo.badge}
                        </div>
                      )}

                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${promo.iconColor}`}>
                        <i className={`${promo.icon} text-2xl`}></i>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2">{promo.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-4">{promo.desc}</p>

                      {promo.cta && (
                        <Link
                          to={promo.cta.href}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                        >
                          {promo.cta.label} <i className="ri-arrow-right-line"></i>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pb-20 px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl shadow-rose-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <i className="ri-sparkling-fill text-3xl"></i>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">¿Lista para empezar?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Reserva tu próxima cita y empieza a acumular puntos desde el primer minuto.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/reservar"
                className="inline-flex items-center justify-center gap-2 bg-white text-rose-600 hover:bg-rose-50 font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
              >
                <i className="ri-calendar-line"></i> Reservar cita
              </Link>
              <Link
                to="/tarjeta-regalo"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-full transition-colors"
              >
                <i className="ri-gift-line"></i> Tarjeta Regalo
              </Link>
            </div>
          </div>
        </section>

        {/* Fine print */}
        <section className="pb-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-gray-400 leading-relaxed">
              <i className="ri-information-line mr-1"></i>
              Las promociones pueden combinarse según el tipo. El descuento del 5% solo aplica al pago total con tarjeta.
              Las recompensas de bienvenida son únicas por cuenta. Los puntos no caducan mientras tu cuenta esté activa.
              Las tarjetas regalo son válidas durante 12 meses desde la compra.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
