import { useState } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { ModuleForm } from "../components/ModuleForm";
import { Plus, Search, Edit2, Trash2, BookOpen, Loader, ChevronUp, ChevronDown } from "lucide-react";
import { useCourseStore } from "@/hooks/useCourseStore";
import type { DBModule } from "@/lib/types";

export default function AdminModules() {
  const { loading, allModules, allDBLessons, allTags, saveModule, deleteModule, reorderModules } = useCourseStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<DBModule | null>(null);
  const [toast, setToast] = useState("");
  const [reordering, setReordering] = useState(false);

  const tagColorBg: Record<string, string> = {
    rose: "bg-rose-100 text-rose-700", orange: "bg-orange-100 text-orange-700",
    amber: "bg-amber-100 text-amber-700", pink: "bg-pink-100 text-pink-700",
    green: "bg-green-100 text-green-700", teal: "bg-teal-100 text-teal-700",
    purple: "bg-purple-100 text-purple-700", blue: "bg-blue-100 text-blue-700",
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const sortedModules = [...allModules].sort((a, b) => a.order_index - b.order_index);

  const filtered = sortedModules.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSave = async (data: Partial<DBModule> & { id?: string }) => {
    await saveModule(data);
    setShowForm(false);
    setEditingModule(null);
    showToast(data.id ? "Módulo actualizado" : "Módulo creado");
  };

  const handleDelete = async (mod: DBModule) => {
    if (!window.confirm(`¿Eliminar el módulo "${mod.title}"? Se eliminarán todas sus lecciones.`)) return;
    await deleteModule(mod.id);
    showToast("Módulo eliminado");
  };

  const handleMove = async (mod: DBModule, direction: "up" | "down") => {
    const idx = sortedModules.findIndex((m) => m.id === mod.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedModules.length) return;

    setReordering(true);
    const newOrder = [...sortedModules];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    await reorderModules(newOrder.map((m) => m.id));
    setReordering(false);
    showToast("Orden actualizado");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">
        {toast && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-medium">
            <i className="ri-check-line mr-2"></i>{toast}
          </div>
        )}
        {reordering && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10">
            <div className="bg-white rounded-2xl px-8 py-5 flex items-center gap-3">
              <Loader className="w-5 h-5 text-rose-500 animate-spin" />
              <span className="text-gray-700 font-medium text-sm">Guardando orden...</span>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Módulos del Curso</h1>
            <p className="text-gray-500 mt-1">Gestiona los módulos · usa las flechas para definir el orden</p>
          </div>
          <button onClick={() => { setEditingModule(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors whitespace-nowrap cursor-pointer">
            <Plus className="w-5 h-5" /> Nuevo módulo
          </button>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar módulos..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-rose-400 animate-spin" />
            <span className="ml-3 text-gray-500">Cargando módulos...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((mod, idx) => {
              const lessonsCount = allDBLessons.filter((l) => l.module_id === mod.id).length;
              const isFirst = idx === 0;
              const isLast = idx === filtered.length - 1;
              return (
                <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
                  <div className={`h-2 ${mod.color === "rose" ? "bg-rose-500" : "bg-orange-500"}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Order badge */}
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => handleMove(mod, "up")}
                            disabled={isFirst}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${isFirst ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-rose-500 hover:bg-rose-50"}`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-gray-400 leading-none">{idx + 1}</span>
                          <button
                            onClick={() => handleMove(mod, "down")}
                            disabled={isLast}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${isLast ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-rose-500 hover:bg-rose-50"}`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mod.color === "rose" ? "bg-rose-50 text-rose-600" : "bg-orange-50 text-orange-600"}`}>
                          <i className={`${mod.icon ?? "ri-book-line"} text-xl`}></i>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingModule(mod); setShowForm(true); }}
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(mod)}
                          className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{mod.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{mod.description}</p>
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <span className={`px-2 py-1 rounded-lg font-medium text-xs ${
                        mod.level === "Principiante" ? "bg-green-100 text-green-700" :
                        mod.level === "Intermedio" ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      }`}>{mod.level ?? "Principiante"}</span>
                      <span className="flex items-center gap-1 text-gray-400 text-xs">
                        <BookOpen className="w-3.5 h-3.5" />{lessonsCount} lecciones
                      </span>
                      <span className="text-gray-400 text-xs">{mod.duration}</span>
                      {mod.price != null && mod.price > 0 && (
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          mod.stripe_price_id ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          <i className={`${mod.stripe_price_id ? "ri-shield-check-fill" : "ri-price-tag-3-line"} text-xs`}></i>
                          {mod.price.toFixed(2)} €{mod.stripe_price_id ? " · Stripe" : ""}
                        </span>
                      )}
                      {mod.tag_id && (() => {
                        const tag = allTags.find(t => t.id === mod.tag_id);
                        if (!tag) return null;
                        const cls = tagColorBg[tag.color] ?? tagColorBg.rose;
                        return (
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${cls}`}>
                            <i className={`${tag.icon} text-xs`}></i>{tag.name}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      {showForm && (
        <ModuleForm module={editingModule} tags={allTags} onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingModule(null); }} />
      )}
    </div>
  );
}
