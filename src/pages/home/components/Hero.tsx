import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";

const SALON_HERO_IMG = "/assets/salon-interior.jpg";
const SALON_IMG_FALLBACK = "/assets/manicure-premium.png";

const STATS = [
  { icon: "ri-map-pin-line", value: "Barcelona", label: "Calle Padilla 301 (Eixample)" },
  { icon: "ri-star-fill", value: "4.9 / 5⭐", label: "+125 Opiniones Verificadas" },
  { icon: "ri-sparkles-line", value: "Semipermanente", label: "Manicura & Pedicura" },
  { icon: "ri-team-line", value: "3 Estilistas", label: "Karol, Eidy y Maryuri" },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-rose-950 to-gray-900 flex items-center pt-28 pb-20">
      {/* Background Image with Salon Photo */}
      <div className="absolute inset-0 z-0">
        <img
          src={SALON_HERO_IMG}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = SALON_IMG_FALLBACK; }}
          alt="Salón Caluatnails manicura y pedicura en Calle Padilla 301, Eixample Barcelona"
          className="w-full h-full object-cover object-center opacity-35 filter brightness-90 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-900/80 to-rose-950/40" />
      </div>

      {/* Decorative Soft Glowing Orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-soft-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none animate-soft-pulse" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="max-w-3xl space-y-6">
          {/* Badge Capsule */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4.5 py-2 shadow-soft-xs">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-white text-xs font-bold tracking-widest uppercase font-sans">
              CALUATNAILS · Centro de Manicura & Estética en Barcelona
            </span>
          </div>

          {/* Literary Heading */}
          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
            El arte delicado de<br />
            <span className="bg-gradient-to-r from-rose-300 via-pink-200 to-rose-400 bg-clip-text text-transparent">
              realzar tu belleza natural
            </span><br />
            en el corazón del Eixample
          </h1>

          {/* Literary Narrative Paragraph */}
          <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-2xl font-medium">
            En nuestro salón de la <strong className="text-white font-bold">Calle Padilla 301</strong> (a 5 minutos de Sagrada Familia y Sant Pau), disfruta de <strong className="text-white font-bold">manicura y pedicura semipermanente completa</strong>, aplicación de uñas de gel/acrílico, lifting de pestañas y depilación facial con hilo.
          </p>

          {/* Literary Quote Note */}
          <p className="text-rose-200/90 italic text-sm border-l-2 border-rose-400/60 pl-4 py-1">
            “Cuidar de tus manos, pies y mirada es un ritual diario de bienestar y serenidad.”
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Button
              variant="primary"
              size="lg"
              icon="ri-calendar-check-line"
              onClick={() => navigate("/reservar")}
              className="shadow-xl shadow-rose-900/40 hover:scale-105 transition-all"
            >
              Reservar Cita Online
            </Button>

            <Button
              variant="outline"
              size="lg"
              icon="ri-list-check-2"
              onClick={() => navigate("/servicios")}
              className="!bg-white/10 !border-white/30 !text-white hover:!bg-white/20"
            >
              Ver Catálogo Completo
            </Button>
          </div>

          {/* Key Stats Bar */}
          <div className="pt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/15 p-4 sm:p-5 shadow-soft-sm max-w-3xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0">
                      <i className={`${stat.icon} text-rose-300 text-lg`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-xs sm:text-sm truncate">{stat.value}</p>
                      <p className="text-white/60 text-[10px] sm:text-xs truncate font-medium">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
