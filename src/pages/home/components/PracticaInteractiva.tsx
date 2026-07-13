import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type FreeVideoLesson = {
  id: string;
  title: string;
  duration: string | null;
  description: string | null;
  video_url: string | null;
  order_index: number;
  moduleTitle: string;
  moduleIcon: string;
  moduleOrderIndex: number;
};

const MODULE_ICONS: Record<number, string> = {
  1: "ri-palette-line",
  2: "ri-scissors-cut-line",
  3: "ri-drop-line",
  4: "ri-flower-line",
  5: "ri-magic-line",
  6: "ri-shield-check-line",
  7: "ri-artboard-line",
  8: "ri-ink-bottle-line",
  9: "ri-pencil-ruler-line",
  10: "ri-flashlight-line",
};

export default function PracticaInteractiva() {
  const [lessons, setLessons] = useState<FreeVideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [watched, setWatched] = useState<number[]>([]);

  useEffect(() => {
    const fetchFreeLessons = async () => {
      setLoading(true);
      const { data: lessonRows } = await supabase
        .from("lessons")
        .select("id, title, duration, description, video_url, order_index, is_free, type, module_id")
        .eq("is_free", true)
        .eq("type", "video")
        .order("order_index");

      if (!lessonRows || lessonRows.length === 0) {
        setLoading(false);
        return;
      }

      const moduleIds = [...new Set(lessonRows.map((l: { module_id: string }) => l.module_id))];
      const { data: moduleRows } = await supabase
        .from("modules")
        .select("id, title, order_index")
        .in("id", moduleIds);

      const modMap = new Map<string, { title: string; order_index: number }>(
        (moduleRows ?? []).map((m: { id: string; title: string; order_index: number }) => [
          m.id,
          { title: m.title, order_index: m.order_index },
        ])
      );

      const mapped: FreeVideoLesson[] = lessonRows.map(
        (l: {
          id: string;
          title: string;
          duration: string | null;
          description: string | null;
          video_url: string | null;
          order_index: number;
          module_id: string;
        }) => {
          const mod = modMap.get(l.module_id);
          const modOrderIdx = mod?.order_index ?? 0;
          return {
            id: l.id,
            title: l.title,
            duration: l.duration,
            description: l.description,
            video_url: l.video_url,
            order_index: l.order_index,
            moduleTitle: mod?.title ?? "Módulo",
            moduleIcon: MODULE_ICONS[modOrderIdx] ?? "ri-book-line",
            moduleOrderIndex: modOrderIdx,
          };
        }
      );

      setLessons(mapped);
      setLoading(false);
    };

    fetchFreeLessons();
  }, []);

  const markWatched = (idx: number) => {
    if (!watched.includes(idx)) setWatched([...watched, idx]);
    if (idx < lessons.length - 1) setActiveIdx(idx + 1);
  };

  const active = lessons[activeIdx];
  const progress = lessons.length > 0 ? Math.round((watched.length / lessons.length) * 100) : 0;
  const allDone = lessons.length > 0 && watched.length === lessons.length;

  const getYouTubeId = (url: string | null) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  return (
    <section id="practica" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-rose-600 text-sm font-semibold tracking-widest uppercase mb-3">
            Lecciones Gratuitas
          </span>
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Empieza a Aprender,
            <br />
            <span className="text-rose-600">Sin Costo</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Accede a las lecciones en video gratuitas de cada módulo. Sin registro previo, sin compromiso.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <i className="ri-loader-4-line text-rose-500 text-3xl animate-spin"></i>
            </div>
            <p className="text-gray-400 text-sm">Cargando lecciones gratuitas...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-rose-50 rounded-full">
              <i className="ri-video-off-line text-rose-400 text-2xl"></i>
            </div>
            <p className="text-gray-500 text-sm">Aún no hay lecciones gratuitas disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Sidebar lista de lecciones */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {lessons.map((lesson, idx) => {
                const isDone = watched.includes(idx);
                const isActive = activeIdx === idx;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveIdx(idx)}
                    className={`w-full text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                      isActive
                        ? "bg-rose-600 text-white"
                        : isDone
                        ? "bg-rose-50 border border-rose-100"
                        : "bg-stone-50 border border-transparent hover:border-rose-100"
                    }`}
                  >
                    {/* Ícono estado */}
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5 ${
                        isActive
                          ? "bg-white/20"
                          : isDone
                          ? "bg-rose-600"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      {isDone && !isActive ? (
                        <i className="ri-check-line text-white text-sm"></i>
                      ) : (
                        <i
                          className={`${lesson.moduleIcon} text-sm ${
                            isActive ? "text-white" : "text-gray-400"
                          }`}
                        ></i>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Módulo badge */}
                      <span
                        className={`text-xs font-semibold tracking-wide ${
                          isActive ? "text-white/70" : "text-rose-400"
                        }`}
                      >
                        {lesson.moduleTitle}
                      </span>
                      <p
                        className={`font-semibold text-sm leading-snug mt-0.5 ${
                          isActive ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <i
                          className={`ri-play-circle-line text-xs ${
                            isActive ? "text-white/60" : "text-gray-400"
                          }`}
                        ></i>
                        <span
                          className={`text-xs ${isActive ? "text-white/60" : "text-gray-400"}`}
                        >
                          {lesson.duration ?? "Video"}
                        </span>
                      </div>
                    </div>

                    {isDone && !isActive && (
                      <i className="ri-check-double-line text-rose-400 text-base flex-shrink-0 mt-1"></i>
                    )}
                  </button>
                );
              })}

              {/* Barra de progreso */}
              <div className="bg-stone-50 rounded-2xl p-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 text-xs font-semibold">Tu progreso</span>
                  <span className="text-rose-600 text-xs font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-gray-400 text-xs mt-2">
                  {watched.length} de {lessons.length} lecciones vistas
                </p>
              </div>
            </div>

            {/* Panel derecho */}
            <div className="lg:col-span-3">
              {allDone ? (
                <div className="h-full flex flex-col items-center justify-center text-center bg-rose-50 rounded-3xl border border-rose-100 p-12">
                  <div className="w-20 h-20 flex items-center justify-center bg-rose-100 rounded-full mb-6">
                    <i className="ri-trophy-line text-4xl text-rose-600"></i>
                  </div>
                  <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-3">
                    ¡Todas las Lecciones Vistas!
                  </h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-xs">
                    Has completado todas las lecciones gratuitas. ¡Inscríbete para acceder al curso completo!
                  </p>
                  <div className="flex gap-3 flex-wrap justify-center">
                    <button
                      onClick={() => { setWatched([]); setActiveIdx(0); }}
                      className="text-rose-600 border border-rose-200 hover:bg-rose-50 text-sm font-medium px-4 py-2.5 rounded-full cursor-pointer whitespace-nowrap transition-colors"
                    >
                      Ver de nuevo
                    </button>
                    <button
                      onClick={() => {
                        const el = document.querySelector("#tienda");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2.5 rounded-full cursor-pointer whitespace-nowrap transition-colors"
                    >
                      Comprar el curso
                    </button>
                  </div>
                </div>
              ) : active ? (
                <div className="bg-stone-50 rounded-3xl border border-stone-100 overflow-hidden">
                  {/* Video o imagen */}
                  {(() => {
                    const ytId = getYouTubeId(active.video_url);
                    return ytId ? (
                      <div className="w-full aspect-video">
                        <iframe
                          key={active.id}
                          src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                          title={active.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    ) : (
                      <div className="w-full h-56 overflow-hidden">
                        <img
                          src={`https://readdy.ai/api/search-image?query=nail%20manicure%20professional%20tutorial%20video%20lesson%20beauty%20salon%20warm%20pastel%20elegant%20hands%20close%20up%20studio%20$%7Bactive.title.slice%280%2C%2030%29%7D&width=700&height=300&seq=${50 + activeIdx}&orientation=landscape`}
                          alt={active.title}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    );
                  })()}

                  <div className="p-8">
                    {/* Módulo badge + título */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-rose-600 rounded-xl flex-shrink-0">
                        <i className={`${active.moduleIcon} text-white text-base`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-rose-500 text-xs font-semibold uppercase tracking-wide">
                          {active.moduleTitle}
                        </span>
                        <h3 className="text-gray-900 font-bold text-lg leading-snug">{active.title}</h3>
                      </div>
                      <span className="text-gray-400 text-xs flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                        <i className="ri-time-line"></i>
                        {active.duration ?? "—"}
                      </span>
                    </div>

                    {/* Descripción */}
                    {active.description && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-5">{active.description}</p>
                    )}

                    {/* Aviso lección gratuita */}
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 mb-6">
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <i className="ri-gift-line text-rose-500 text-base"></i>
                      </div>
                      <div>
                        <p className="text-rose-700 text-xs font-semibold mb-0.5">Lección gratuita</p>
                        <p className="text-rose-500 text-xs leading-relaxed">
                          Esta lección es parte de la muestra gratuita del curso. Compra el acceso completo para ver todas las lecciones.
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => activeIdx > 0 && setActiveIdx(activeIdx - 1)}
                        disabled={activeIdx === 0}
                        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-full text-gray-500 hover:border-rose-200 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <i className="ri-arrow-left-s-line text-lg"></i>
                      </button>
                      <button
                        onClick={() => markWatched(activeIdx)}
                        className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap text-sm"
                      >
                        <i className="ri-check-line"></i>
                        {watched.includes(activeIdx)
                          ? activeIdx < lessons.length - 1
                            ? "Siguiente lección"
                            : "Completar"
                          : "Marcar como vista"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
