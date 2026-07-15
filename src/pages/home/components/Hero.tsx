import { useNavigate } from "react-router-dom";

const SALON_IMG = "https://readdy.ai/api/search-image?query=professional%20nail%20technician%20elegant%20manicure%20pedicure%20beauty%20salon%20warm%20rose%20gold%20lighting%20hands%20close%20up%20luxury%20spa%20pastel%20tones%20soft%20bokeh%20background&width=1440&height=900&seq=1&orientation=landscape";
const SALON_IMG_FALLBACK = "/assets/manicure-premium.png";

const STATS = [
  { icon: "ri-map-pin-line", value: "Barcelona", label: "Centro de Estética" },
  { icon: "ri-time-line", value: "Reserva", label: "Cita Online" },
  { icon: "ri-star-line", value: "Premium", label: "Materiales de Calidad" },
  { icon: "ri-award-line", value: "Profesionales", label: "Equipo Experto" },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-10">
        <img
          src={SALON_IMG}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = SALON_IMG_FALLBACK; }}
          alt="Salón de manicura y pedicura premium en Barcelona"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30"></div>
      </div>

      <div className="relative z-20 w-full h-full min-h-screen flex items-center max-w-7xl mx-auto px-6 lg:px-10 py-32 pt-40">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <i className="ri-sparkling-fill text-rose-300 text-sm"></i>
            <span className="text-white text-xs font-medium tracking-wide uppercase">Salón Premium · Eixample Barcelona</span>
          </div>

          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
            Tus Uñas Merecen<br />
            <span className="text-rose-300">Cuidado de Lujo</span><br />
            y Precisión
          </h1>

          <p className="text-white/85 text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-xl">
            Especialistas en <strong className="text-white">manicura rusa con nivelación</strong>, esmaltado semipermanente, uñas en gel y pedicura spa. Reserva tu cita en pleno corazón del Eixample, Barcelona.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/reservar")}
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base shadow-xl shadow-rose-900/30"
            >
              <i className="ri-calendar-check-line text-lg"></i>
              Reservar mi Cita
            </button>

            <button
              onClick={() => navigate("/servicios")}
              className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
            >
              <i className="ri-list-check-2 text-lg"></i>
              Ver Servicios
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-24 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <i className={`${stat.icon} text-rose-300 text-sm`}></i>
                </div>
                <div>
                  <p className="text-white font-bold text-xs sm:text-sm leading-none">{stat.value}</p>
                  <p className="text-white/60 text-[10px] sm:text-xs mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
