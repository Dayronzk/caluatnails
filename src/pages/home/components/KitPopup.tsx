import { useEffect } from "react";
import { Link } from "react-router-dom";

interface Props {
  onClose: () => void;
}

export default function KitPopup({ onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=professional%20nail%20art%20tools%20brushes%20gel%20polish%20elegant%20flat%20lay%20rose%20gold%20marble%20surface%20beauty%20salon%20premium%20manicure%20pedicure%20supplies%20luxury&width=1440&height=900&seq=kitpopup1&orientation=landscape"
          alt="Formación profesional de manicura"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/65 to-rose-950/70"></div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white transition-all cursor-pointer"
      >
        <i className="ri-close-line text-xl"></i>
      </button>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-rose-500/30 backdrop-blur-sm border border-rose-400/40 rounded-full px-4 py-1.5 mb-6">
          <i className="ri-star-fill text-rose-300 text-xs"></i>
          <span className="text-rose-200 text-xs font-semibold tracking-widest uppercase">¡Compra realizada!</span>
        </div>

        <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
          ¿Quieres reservar
          <br />
          <span className="text-rose-300">una cita con nosotras?</span>
        </h2>

        <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-8 px-2">
          Ahora que tienes acceso al curso, complementa tu aprendizaje reservando una sesión práctica con nuestras profesionales certificadas.
        </p>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { icon: "ri-scissors-line", text: "Práctica guiada" },
            { icon: "ri-award-line", text: "Profesionales certificadas" },
            { icon: "ri-calendar-check-line", text: "Elige tu horario" },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <i className={`${item.icon} text-rose-300 text-sm`}></i>
              <span className="text-white/80 text-sm font-medium whitespace-nowrap">{item.text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/reservar"
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-8 py-3.5 rounded-full transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
          >
            <i className="ri-calendar-line text-lg"></i>
            Reservar una cita
          </Link>
          <button
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white font-medium px-8 py-3.5 rounded-full transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
          >
            Continuar con el curso
            <i className="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
