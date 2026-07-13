import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { DBModule } from "@/lib/types";
import { Loader } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePurchase } from "@/hooks/usePurchase";

interface ModuleWithCount extends DBModule {
  lessonCount: number;
}

export default function Introduccion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPurchase, loading: purchaseLoading } = usePurchase();
  const [modules, setModules] = useState<ModuleWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLessons, setTotalLessons] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [{ data: mods }, { data: lessons }] = await Promise.all([
          supabase.from("modules").select("*").order("order_index").limit(6),
          supabase.from("lessons").select("module_id"),
        ]);

        if (cancelled) return;

        if (!mods) {
          setLoading(false);
          return;
        }

        const countMap: Record<string, number> = {};
        (lessons ?? []).forEach((l: { module_id: string }) => {
          countMap[l.module_id] = (countMap[l.module_id] ?? 0) + 1;
        });

        const enriched: ModuleWithCount[] = mods.map((m: DBModule) => ({
          ...m,
          lessonCount: countMap[m.id] ?? 0,
        }));

        setModules(enriched);
        setTotalLessons((lessons ?? []).length);
      } catch {
        // on error show empty state, never stay stuck loading
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Safety net: if something hangs, unblock after 6s
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 6000);

    load();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const handleModuleClick = (mod: ModuleWithCount) => {
    if (!user) {
      navigate(`/login?redirect=/modulo/${mod.order_index}`);
      return;
    }
    if (!hasPurchase) {
      const el = document.getElementById("tienda");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate(`/modulo/${mod.order_index}`);
  };

  return (
    <section id="introduccion" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-block text-rose-600 text-sm font-semibold tracking-widest uppercase mb-3">
              El Curso — Módulos
            </span>
            <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Domina las Bases del
              <br />
              <span className="text-rose-600">Arte de las Uñas</span>
            </h2>
          </div>
          <p className="text-gray-500 text-base lg:text-lg max-w-md leading-relaxed">
            Desde herramientas básicas hasta técnicas profesionales avanzadas, cada módulo está diseñado para llevarte paso a paso.
          </p>
        </div>

        {/* Access status banner */}
        {!purchaseLoading && (
          <>
            {hasPurchase ? (
              <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-10">
                <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 rounded-xl flex-shrink-0">
                  <i className="ri-shield-check-fill text-emerald-600 text-lg"></i>
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 text-sm">Acceso completo desbloqueado</p>
                  <p className="text-emerald-600 text-xs mt-0.5">Tienes acceso a todos los módulos y lecciones del curso.</p>
                </div>
                <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full whitespace-nowrap">
                  <i className="ri-vip-crown-line mr-1"></i>Curso completo
                </span>
              </div>
            ) : user ? (
              <div className="flex items-center gap-4 bg-rose-50 border border-rose-100 rounded-2xl px-6 py-4 mb-10">
                <div className="w-10 h-10 flex items-center justify-center bg-rose-100 rounded-xl flex-shrink-0">
                  <i className="ri-lock-line text-rose-500 text-lg"></i>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Solo tienes acceso a lecciones gratuitas</p>
                  <p className="text-gray-500 text-xs mt-0.5">Adquiere el curso completo para desbloquear todos los módulos.</p>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById("tienda");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="ml-auto text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                >
                  Ver módulos
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 mb-10">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl flex-shrink-0">
                  <i className="ri-user-line text-gray-500 text-lg"></i>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Inicia sesión para acceder al curso</p>
                  <p className="text-gray-500 text-xs mt-0.5">Regístrate gratis y adquiere el acceso completo.</p>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="ml-auto text-xs font-semibold text-white bg-gray-900 hover:bg-black px-4 py-2 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                >
                  Iniciar sesión
                </button>
              </div>
            )}
          </>
        )}

        {/* Modules Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader className="w-6 h-6 text-rose-400 animate-spin" />
            <span className="text-gray-400 text-sm">Cargando módulos...</span>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            Aún no hay módulos publicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => {
              const isLocked = !hasPurchase && !purchaseLoading;
              return (
                <article
                  key={mod.id}
                  onClick={() => handleModuleClick(mod)}
                  className={`group cursor-pointer rounded-2xl border bg-white transition-all duration-300 ${
                    isLocked
                      ? "border-gray-100 opacity-80 hover:opacity-100 hover:border-gray-200"
                      : "border-gray-100 hover:border-rose-200 hover:bg-rose-50/30"
                  }`}
                >
                  <div className="p-6">
                    {/* Icon, Level & Lock */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${mod.color === "rose" ? "bg-rose-100" : "bg-orange-100"}`}>
                        <i className={`${mod.icon ?? "ri-book-line"} text-xl ${mod.color === "rose" ? "text-rose-600" : "text-orange-500"}`}></i>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          mod.level === "Principiante"
                            ? "bg-green-50 text-green-600"
                            : mod.level === "Intermedio"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-rose-50 text-rose-600"
                        }`}>
                          {mod.level ?? "Principiante"}
                        </span>
                        {isLocked && (
                          <span className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full flex-shrink-0">
                            <i className="ri-lock-line text-gray-400 text-xs"></i>
                          </span>
                        )}
                        {hasPurchase && (
                          <span className="w-7 h-7 flex items-center justify-center bg-emerald-50 rounded-full flex-shrink-0">
                            <i className="ri-checkbox-circle-fill text-emerald-500 text-sm"></i>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 font-medium mb-1">Módulo {mod.order_index}</p>

                    <h3 className={`font-semibold text-base mb-2 leading-snug transition-colors ${
                      isLocked ? "text-gray-700" : "text-gray-900 group-hover:text-rose-700"
                    }`}>
                      {mod.title}
                    </h3>

                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{mod.description}</p>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <i className="ri-book-2-line"></i>
                        {mod.lessonCount} lección{mod.lessonCount !== 1 ? "es" : ""}
                      </span>
                      {mod.duration && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <i className="ri-time-line"></i>
                          {mod.duration}
                        </span>
                      )}
                      <span className={`ml-auto flex items-center gap-1 text-xs font-medium transition-all whitespace-nowrap ${
                        isLocked ? "text-gray-400" : "text-rose-500 group-hover:gap-2"
                      }`}>
                        {isLocked ? (
                          <><i className="ri-lock-line"></i> Requiere acceso</>
                        ) : (
                          <>Ver lecciones <i className="ri-arrow-right-line"></i></>
                        )}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && modules.length > 0 && (
          <div className="mt-16 bg-rose-600 rounded-3xl p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">
                {hasPurchase ? "Tu acceso incluye" : "Incluido en el curso"}
              </p>
              <h3 className="text-white text-2xl font-bold">
                {totalLessons} lecciones · {modules.length} módulos
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-white/70 text-xs">Acceso de por vida</p>
                <p className="text-white font-semibold">Sin fecha de expiración</p>
              </div>
              {hasPurchase ? (
                <button
                  onClick={() => navigate("/modulo/1")}
                  className="bg-white text-rose-600 hover:bg-rose-50 font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap text-sm"
                >
                  Continuar aprendiendo
                </button>
              ) : (
                <button
                  onClick={() => {
                    const el = document.getElementById("tienda");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-white text-rose-600 hover:bg-rose-50 font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap text-sm"
                >
                  Ver Módulos
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
