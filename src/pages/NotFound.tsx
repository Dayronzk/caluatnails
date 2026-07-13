import { Link } from "react-router-dom";
import { Scissors, ArrowRight, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 py-24 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Animated Number */}
        <div className="relative inline-block mb-8">
          <h1 className="text-[12rem] md:text-[18rem] font-black text-white/5 leading-none tracking-tighter select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl rotate-12 flex items-center justify-center shadow-2xl shadow-rose-500/40 animate-bounce">
              <Scissors className="w-12 h-12 md:w-16 md:h-16 text-white -rotate-12" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          ¡Vaya! Nos hemos <span className="text-rose-500">salido de la uña</span>
        </h2>
        
        <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-lg mx-auto leading-relaxed">
          Esta página no existe, pero tu próxima manicura perfecta sí. No dejes que tus manos esperen más.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/reservar"
            className="group flex items-center gap-3 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-rose-500/25 hover:scale-105 active:scale-95 w-full sm:w-auto text-center justify-center"
          >
            Reservar mi cita ahora
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/"
            className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-lg border border-white/10 transition-all w-full sm:w-auto justify-center"
          >
            <Home className="w-5 h-5" />
            Ir al inicio
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 opacity-40">
          <span className="text-xs text-white uppercase tracking-[0.2em]">Manicura</span>
          <span className="text-xs text-white uppercase tracking-[0.2em]">Pedicura</span>
          <span className="text-xs text-white uppercase tracking-[0.2em]">Nail Art</span>
        </div>
      </div>
    </div>
  );
}