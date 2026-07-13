import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePurchase } from "@/hooks/usePurchase";
import { useNavigate } from "react-router-dom";

interface MaterialLesson {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  duration: string | null;
}

const FILE_ICON_MAP: Record<string, { icon: string; type: string; color: string }> = {
  pdf: { icon: "ri-file-pdf-2-line", type: "PDF", color: "rose" },
  zip: { icon: "ri-file-zip-line", type: "ZIP", color: "orange" },
  mp4: { icon: "ri-video-line", type: "Video", color: "orange" },
  mov: { icon: "ri-video-line", type: "Video", color: "orange" },
  jpg: { icon: "ri-image-line", type: "Imagen", color: "rose" },
  jpeg: { icon: "ri-image-line", type: "Imagen", color: "rose" },
  png: { icon: "ri-image-line", type: "Imagen", color: "rose" },
  doc: { icon: "ri-file-word-line", type: "Word", color: "orange" },
  docx: { icon: "ri-file-word-line", type: "Word", color: "orange" },
  xls: { icon: "ri-file-excel-line", type: "Excel", color: "rose" },
  xlsx: { icon: "ri-file-excel-line", type: "Excel", color: "rose" },
};

function getFileInfo(url: string | null): { icon: string; type: string; color: string } {
  if (!url) return { icon: "ri-file-line", type: "Archivo", color: "rose" };
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  return FILE_ICON_MAP[ext] ?? { icon: "ri-file-line", type: "Archivo", color: "rose" };
}

export default function RecursosDescargables() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPurchase, loading: purchaseLoading } = usePurchase();

  const [downloaded, setDownloaded] = useState<string[]>([]);
  const [dbMaterials, setDbMaterials] = useState<MaterialLesson[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      const { data } = await supabase
        .from("lessons")
        .select("id, title, description, file_url, duration")
        .eq("type", "material")
        .eq("is_free", true)
        .order("order_index");
      setDbMaterials((data ?? []) as MaterialLesson[]);
      setLoadingDb(false);
    };
    fetchMaterials();
  }, []);

  const handleDownload = (id: string, url: string) => {
    setDownloaded((prev) => [...prev, id]);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Determine unlock button label and action
  const getUnlockAction = () => {
    if (!user) {
      return {
        label: "Iniciar sesión",
        action: () => navigate("/auth/login"),
        sublabel: "Inicia sesión para acceder al material premium.",
      };
    }
    if (!purchaseLoading && !hasPurchase) {
      return {
        label: "Adquirir curso",
        action: () => {
          const el = document.querySelector("#evaluaciones");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        },
        sublabel: "+15 recursos exclusivos disponibles al adquirir el curso.",
      };
    }
    if (hasPurchase) {
      return {
        label: "Ver todo el material",
        action: () => navigate("/modulo/a0000000-0000-4000-8000-000000000000"),
        sublabel: "Tienes acceso completo a todos los recursos premium.",
      };
    }
    return null;
  };

  const unlockAction = getUnlockAction();

  // Count by type for stats
  const typeCounts = dbMaterials.reduce<Record<string, number>>((acc, mat) => {
    const info = getFileInfo(mat.file_url);
    acc[info.type] = (acc[info.type] ?? 0) + 1;
    return acc;
  }, {});

  const statsDisplay = [
    { type: "PDF", count: typeCounts["PDF"] ?? 0, icon: "ri-file-pdf-2-line" },
    { type: "Videos", count: typeCounts["Video"] ?? 0, icon: "ri-video-line" },
    { type: "Imágenes", count: typeCounts["Imagen"] ?? 0, icon: "ri-image-line" },
  ];

  return (
    <section id="recursos" className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <div>
            <span className="inline-block text-rose-600 text-sm font-semibold tracking-widest uppercase mb-3">
              Módulo 04 — Recursos
            </span>
            <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Todo el Material
              <br />
              <span className="text-rose-600">en un Solo Lugar</span>
            </h2>
          </div>
          <p className="text-gray-500 text-base lg:text-lg max-w-md leading-relaxed">
            Guías PDF, videos tutoriales, catálogos de diseños y manuales profesionales disponibles para descargar en cualquier momento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Banner */}
          <div className="lg:col-span-1">
            <div className="relative rounded-3xl overflow-hidden" style={{ height: "380px" }}>
              <img
                src="https://readdy.ai/api/search-image?query=nail%20art%20books%20guides%20PDF%20resources%20education%20beauty%20professional%20desk%20flat%20lay%20warm%20tones%20elegant%20stationery%20manicure%20tools%20aesthetic&width=500&height=500&seq=31&orientation=portrait"
                alt="Recursos del Curso"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-7">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-rose-600 rounded-xl">
                    <i className="ri-download-cloud-2-line text-white text-base"></i>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Biblioteca completa</p>
                    <p className="text-white font-bold text-sm">{dbMaterials.length} recursos gratuitos</p>
                  </div>
                </div>
                <h3 className="text-white font-playfair text-xl font-bold mb-1">
                  Descarga y estudia sin conexión
                </h3>
                <p className="text-white/70 text-xs leading-relaxed">
                  Todos los materiales son descargables y se actualizan regularmente con nuevo contenido.
                </p>
              </div>
            </div>

            {/* Type stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {statsDisplay.map((t) => (
                <div key={t.type} className="bg-white rounded-2xl p-3 text-center border border-gray-100">
                  <div className="w-8 h-8 flex items-center justify-center mx-auto mb-1.5 rounded-lg bg-rose-50">
                    <i className={`${t.icon} text-rose-500 text-sm`}></i>
                  </div>
                  <p className="font-bold text-gray-900 text-base">{t.count}</p>
                  <p className="text-gray-400 text-xs">{t.type}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resources List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Loading state */}
            {loadingDb && (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0"></div>
                  </div>
                ))}
              </div>
            )}

            {/* DB materials */}
            {!loadingDb && dbMaterials.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="w-14 h-14 flex items-center justify-center bg-rose-50 rounded-2xl mx-auto mb-4">
                  <i className="ri-folder-open-line text-rose-400 text-2xl"></i>
                </div>
                <p className="text-gray-500 text-sm">Próximamente se añadirán materiales gratuitos.</p>
              </div>
            )}

            {!loadingDb && dbMaterials.map((mat) => {
              const isDone = downloaded.includes(mat.id);
              const fileInfo = getFileInfo(mat.file_url);
              return (
                <div
                  key={mat.id}
                  className={`bg-white rounded-2xl border p-5 flex items-center gap-4 transition-all duration-200 ${
                    isDone ? "border-teal-100" : "border-gray-100 hover:border-teal-100"
                  }`}
                >
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0 ${
                    fileInfo.color === "rose" ? "bg-rose-50" : "bg-teal-50"
                  }`}>
                    <i className={`${fileInfo.icon} text-xl ${
                      fileInfo.color === "rose" ? "text-rose-500" : "text-teal-500"
                    }`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{mat.title}</h4>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        {fileInfo.type}
                      </span>
                      <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
                        Gratis
                      </span>
                    </div>
                    {mat.description && (
                      <p className="text-gray-400 text-xs line-clamp-1">{mat.description}</p>
                    )}
                    {mat.duration && (
                      <p className="text-gray-300 text-xs mt-1">{mat.duration}</p>
                    )}
                  </div>
                  <button
                    onClick={() => mat.file_url && handleDownload(mat.id, mat.file_url)}
                    disabled={!mat.file_url}
                    className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-all cursor-pointer ${
                      isDone
                        ? "bg-teal-50 text-teal-500"
                        : mat.file_url
                        ? "bg-gray-50 hover:bg-teal-50 text-gray-400 hover:text-teal-500"
                        : "bg-gray-50 text-gray-200 cursor-not-allowed"
                    }`}
                    aria-label="Descargar"
                  >
                    <i className={`text-base ${isDone ? "ri-check-line" : "ri-download-2-line"}`}></i>
                  </button>
                </div>
              );
            })}

            {/* Unlock Banner — dynamic based on auth + purchase */}
            {unlockAction && (
              <div className="bg-gradient-to-r from-rose-600 to-rose-500 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl flex-shrink-0">
                  <i className={`text-white text-xl ${hasPurchase ? "ri-folder-open-line" : "ri-lock-2-line"}`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Material Premium Adicional</p>
                  <p className="text-white/70 text-xs">{unlockAction.sublabel}</p>
                </div>
                <button
                  onClick={unlockAction.action}
                  className="bg-white text-rose-600 text-xs font-bold px-4 py-2 rounded-full cursor-pointer whitespace-nowrap flex-shrink-0 hover:bg-rose-50 transition-colors"
                >
                  {unlockAction.label}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
