import { useNavigate } from "react-router-dom";
import type { DBModule } from "@/lib/types";

interface Props {
  mod: DBModule;
  totalLessons: number;
  completedCount: number;
}

export default function ModuleHeader({ mod, totalLessons, completedCount }: Props) {
  const navigate = useNavigate();
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const color = mod.color ?? "rose";

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-500 hover:text-rose-600 transition-colors text-sm font-medium cursor-pointer whitespace-nowrap">
          <i className="ri-arrow-left-line text-base"></i>Volver al inicio
        </button>
        <span className="text-gray-200">|</span>
        <span className="text-gray-400 text-sm">Profesional en Manicura y Pedicura</span>
        <span className="text-gray-200">›</span>
        <span className="text-gray-700 text-sm font-medium">{mod.title}</span>
      </div>
      <div className={color === "rose" ? "bg-gradient-to-r from-rose-600 to-rose-500" : "bg-gradient-to-r from-orange-500 to-amber-400"}>
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white/20 shrink-0">
              <i className={`${mod.icon ?? "ri-book-line"} text-3xl text-white`}></i>
            </div>
            <div>
              <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">{mod.level ?? "Principiante"}</span>
              <h1 className="text-white text-2xl lg:text-3xl font-bold leading-tight mb-2">{mod.title}</h1>
              <p className="text-white/80 text-sm max-w-xl leading-relaxed">{mod.description}</p>
              <div className="flex items-center gap-5 mt-4">
                <span className="flex items-center gap-1.5 text-white/80 text-sm"><i className="ri-book-2-line"></i>{totalLessons} lecciones</span>
                <span className="flex items-center gap-1.5 text-white/80 text-sm"><i className="ri-time-line"></i>{mod.duration}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 w-full lg:w-64 shrink-0">
            <p className="text-gray-500 text-xs font-medium mb-1">Tu progreso</p>
            <div className="flex items-end justify-between mb-3">
              <span className="text-gray-900 text-3xl font-bold">{progress}%</span>
              <span className="text-gray-400 text-xs">{completedCount}/{totalLessons} lecciones</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${color === "rose" ? "bg-rose-500" : "bg-orange-500"}`} style={{ width: `${progress}%` }} />
            </div>
            {completedCount === 0 && <p className="text-gray-400 text-xs mt-3">¡Empieza tu primera lección!</p>}
            {completedCount > 0 && completedCount < totalLessons && <p className="text-gray-400 text-xs mt-3">¡Buen ritmo, sigue así!</p>}
            {completedCount === totalLessons && totalLessons > 0 && <p className="text-rose-600 text-xs mt-3 font-semibold">¡Módulo completado!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
