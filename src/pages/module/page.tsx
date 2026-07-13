import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "@/hooks/useProgress";
import { useCourseStore } from "@/hooks/useCourseStore";
import { useAuth } from "@/hooks/useAuth";
import { usePurchase } from "@/hooks/usePurchase";
import ModuleHeader from "./components/ModuleHeader";
import LessonList from "./components/LessonList";
import ModuleSidebar from "./components/ModuleSidebar";
import CertificateModal from "./components/CertificateModal";
import { Loader } from "lucide-react";

export default function ModulePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const moduleId = parseInt(id ?? "1", 10);

  const { user } = useAuth();
  const { hasPurchase, loading: purchaseLoading } = usePurchase();
  const { loading, allModules, allDBLessons, allTags, getLessonsForModule, getLessonCountsByModuleOrderIndex } = useCourseStore();

  // Memoize so the reference only changes when DB data changes,
  // preventing unnecessary re-renders and hook re-executions
  const lessonCounts = useMemo(
    () => getLessonCountsByModuleOrderIndex(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allModules, allDBLessons],
  );

  const lessons = getLessonsForModule(moduleId);
  const mod = allModules.find((m) => m.order_index === moduleId);

  const dbContext = user
    ? { userId: user.id, dbLessons: allDBLessons, dbModules: allModules }
    : undefined;

  const {
    totalPercentage, completedLessons, totalLessons, isCourseComplete,
    getModuleCompleted, getModuleCompletedCount, toggleLesson, getModulePercentage,
  } = useProgress(lessonCounts, dbContext);

  const [showCertificate, setShowCertificate] = useState(false);
  const prevComplete = useRef(isCourseComplete);

  // Load hours override from settings
  const [hoursOverride, setHoursOverride] = useState<string>('');
  useEffect(() => {
    supabase
      .from('center_settings')
      .select('total_hours_override')
      .eq('id', 'main')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.total_hours_override) setHoursOverride(data.total_hours_override as string);
      });
  }, []);

  // Calculate total hours dynamically from all lessons
  const totalHoursAuto = useMemo(() => {
    let totalMinutes = 0;
    allDBLessons.forEach((l) => {
      if (!l.duration) return;
      const dur = l.duration.trim().toLowerCase();
      const hm = dur.match(/(\d+)\s*h(?:oras?)?\s*(?:(\d+)\s*min)?/);
      if (hm) {
        totalMinutes += parseInt(hm[1], 10) * 60 + (hm[2] ? parseInt(hm[2], 10) : 0);
        return;
      }
      const minOnly = dur.match(/^(\d+)\s*min/);
      if (minOnly) { totalMinutes += parseInt(minOnly[1], 10); return; }
      const colonFmt = dur.match(/^(\d+):(\d+)/);
      if (colonFmt) { totalMinutes += parseInt(colonFmt[1], 10) * 60 + parseInt(colonFmt[2], 10); return; }
      const numOnly = dur.match(/^(\d+)$/);
      if (numOnly) { totalMinutes += parseInt(numOnly[1], 10); }
    });
    if (totalMinutes === 0) return '—';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
  }, [allDBLessons]);

  const totalHours = hoursOverride || totalHoursAuto;

  const minOrderIndex = allModules.length > 0 ? Math.min(...allModules.map(m => m.order_index)) : 0;
  const maxOrderIndex = allModules.length > 0 ? Math.max(...allModules.map(m => m.order_index)) : 11;

  useEffect(() => {
    if (isCourseComplete && !prevComplete.current) {
      setTimeout(() => setShowCertificate(true), 600);
    }
    prevComplete.current = isCourseComplete;
  }, [isCourseComplete]);

  if (loading || purchaseLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader className="w-10 h-10 text-rose-400 animate-spin" />
        <p className="text-gray-400">Verificando acceso...</p>
      </div>
    );
  }

  if (!hasPurchase) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 px-6">
        <div className="w-20 h-20 flex items-center justify-center bg-rose-100 rounded-full">
          <i className="ri-lock-2-line text-4xl text-rose-500"></i>
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso restringido</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Necesitas adquirir el curso completo para acceder a los módulos y lecciones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            Volver al inicio
          </button>
          <button
            onClick={() => { navigate("/"); setTimeout(() => { const el = document.getElementById("tienda"); if (el) el.scrollIntoView({ behavior: "smooth" }); }, 300); }}
            className="px-6 py-3 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-shopping-bag-line mr-2"></i>Adquirir curso
          </button>
        </div>
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <i className="ri-error-warning-line text-5xl text-gray-300"></i>
        <p className="text-gray-500 text-lg">Módulo no encontrado</p>
        <button onClick={() => navigate("/")}
          className="bg-rose-600 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap">
          Volver al inicio
        </button>
      </div>
    );
  }

  const accentColor = (mod.color ?? "rose") as "rose" | "orange";
  const completed = getModuleCompleted(moduleId);
  const moduleCompletedCount = getModuleCompletedCount(moduleId);
  const handleToggleComplete = (lessonId: number) => toggleLesson(moduleId, lessonId);

  const typeLabels: Record<string, string> = { video: "Videos", lectura: "Lecturas", practica: "Prácticas", evaluacion: "Evaluaciones" };
  const typeCounts = lessons.reduce<Record<string, number>>((acc, l) => { acc[l.type] = (acc[l.type] ?? 0) + 1; return acc; }, {});

  // ── Group lessons by tag ──
  const untaggedLessons = lessons.filter(l => !l.tagId);
  const tagGroups = lessons
    .filter(l => l.tagId)
    .reduce<Record<string, { name: string; color: string; icon: string; lessons: typeof lessons }>>(
      (acc, l) => {
        const key = l.tagId!;
        if (!acc[key]) acc[key] = { name: l.tagName ?? "", color: l.tagColor ?? "rose", icon: l.tagIcon ?? "ri-price-tag-3-line", lessons: [] };
        acc[key].lessons.push(l);
        return acc;
      }, {}
    );

  const tagGroupList = Object.entries(tagGroups);

  const tagBgMap: Record<string, string> = {
    rose: "bg-rose-50 border-rose-100", orange: "bg-orange-50 border-orange-100",
    amber: "bg-amber-50 border-amber-100", pink: "bg-pink-50 border-pink-100",
    green: "bg-green-50 border-green-100", purple: "bg-purple-50 border-purple-100",
    blue: "bg-blue-50 border-blue-100", teal: "bg-teal-50 border-teal-100",
  };
  const tagTextMap: Record<string, string> = {
    rose: "text-rose-700", orange: "text-orange-700", amber: "text-amber-700",
    pink: "text-pink-700", green: "text-green-700", purple: "text-purple-700",
    blue: "text-blue-700", teal: "text-teal-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Global progress bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-5">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer whitespace-nowrap shrink-0">
            <i className="ri-arrow-left-line text-xs"></i>Inicio
          </button>
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${isCourseComplete ? "bg-gradient-to-r from-rose-400 to-rose-600" : "bg-gradient-to-r from-rose-300 to-rose-500"}`}
                style={{ width: `${totalPercentage}%` }} />
            </div>
            <span className={`text-xs font-semibold shrink-0 whitespace-nowrap ${isCourseComplete ? "text-rose-600" : "text-gray-400"}`}>
              {totalPercentage}% del curso
            </span>
          </div>
          {isCourseComplete && (
            <button onClick={() => setShowCertificate(true)}
              className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap shrink-0 animate-pulse">
              <i className="ri-award-fill"></i>Ver certificado
            </button>
          )}
        </div>
      </div>

      <ModuleHeader mod={mod} totalLessons={lessons.length} completedCount={moduleCompletedCount} />

      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8">
        <main className="flex-1 min-w-0">
          {/* Type counts */}
          {Object.keys(typeCounts).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div key={type} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{typeLabels[type] ?? type}</p>
                </div>
              ))}
            </div>
          )}

          {/* Untagged lessons */}
          {untaggedLessons.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-gray-900 font-semibold text-lg">Lecciones del módulo</h2>
                <span className="text-gray-400 text-sm">{moduleCompletedCount} de {lessons.length} completadas</span>
              </div>
              {lessons.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                  <i className="ri-inbox-2-line text-2xl text-gray-300 block mb-2"></i>
                  <p className="text-gray-400 text-sm">Aún no hay lecciones en este módulo.</p>
                </div>
              ) : (
                <LessonList lessons={untaggedLessons} accentColor={accentColor} completed={completed} onToggleComplete={handleToggleComplete} />
              )}
            </>
          )}

          {/* Empty state (no lessons at all) */}
          {lessons.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <i className="ri-inbox-2-line text-2xl text-gray-300 block mb-2"></i>
              <p className="text-gray-400 text-sm">Aún no hay lecciones en este módulo.</p>
            </div>
          )}

          {/* Tagged sections */}
          {tagGroupList.map(([tagId, group]) => {
            const bgClass = tagBgMap[group.color] ?? tagBgMap.rose;
            const textClass = tagTextMap[group.color] ?? tagTextMap.rose;
            return (
              <div key={tagId} className="mt-10">
                <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 mb-4 ${bgClass}`}>
                  <div className="w-9 h-9 flex items-center justify-center">
                    <i className={`${group.icon} text-xl ${textClass}`}></i>
                  </div>
                  <div className="flex-1">
                    <h2 className={`font-bold text-base ${textClass}`}>{group.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{group.lessons.length} lección{group.lessons.length !== 1 ? "es" : ""} en esta sección</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-white/70 ${textClass}`}>
                    {group.lessons.filter(l => completed.has(l.id)).length}/{group.lessons.length}
                  </span>
                </div>
                <LessonList lessons={group.lessons} accentColor={accentColor} completed={completed} onToggleComplete={handleToggleComplete} />
              </div>
            );
          })}

          {/* Course complete banner */}
          {isCourseComplete && (
            <div className="mt-8 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 p-6 flex items-center gap-5">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-rose-100 shrink-0">
                <i className="ri-award-fill text-3xl text-rose-500"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">¡Curso completado al 100%!</p>
                <p className="text-sm text-gray-500 mt-0.5">Completaste {completedLessons} lecciones en {allModules.length} módulos · {totalHours}</p>
              </div>
              <button onClick={() => setShowCertificate(true)}
                className="flex items-center gap-2 bg-rose-600 text-white px-5 py-3 rounded-full text-sm font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap shrink-0">
                <i className="ri-download-2-line"></i>Descargar certificado
              </button>
            </div>
          )}

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between mt-10 pt-8 border-t border-gray-200">
            <button onClick={() => moduleId > minOrderIndex && navigate(`/modulo/${moduleId - 1}`)} disabled={moduleId <= minOrderIndex}
              className={`flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap ${moduleId <= minOrderIndex ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}>
              <i className="ri-arrow-left-line"></i>Módulo anterior
            </button>
            <button onClick={() => moduleId < maxOrderIndex && navigate(`/modulo/${moduleId + 1}`)} disabled={moduleId >= maxOrderIndex}
              className={`flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                moduleId >= maxOrderIndex ? "text-gray-300 cursor-not-allowed" :
                accentColor === "rose" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-orange-500 text-white hover:bg-orange-600"
              }`}>
              Siguiente módulo<i className="ri-arrow-right-line"></i>
            </button>
          </div>
        </main>
        <ModuleSidebar currentModuleId={moduleId} allModules={allModules} allTags={allTags} lessonCounts={lessonCounts}
          getModulePercentage={getModulePercentage} onShowCertificate={isCourseComplete ? () => setShowCertificate(true) : undefined} />
      </div>

      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        totalModules={allModules.length}
        totalHours={totalHours}
      />
    </div>
  );
}
