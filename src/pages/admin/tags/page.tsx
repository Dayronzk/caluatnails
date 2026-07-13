import { useState } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { useCourseStore } from "@/hooks/useCourseStore";
import type { DBLessonTag } from "@/lib/types";
import { Loader, Plus, Edit2, Trash2, Save, X, Tag } from "lucide-react";

const COLOR_OPTIONS = [
  { value: "rose",   label: "Rosa",    bg: "bg-rose-100",   text: "text-rose-600"   },
  { value: "orange", label: "Naranja", bg: "bg-orange-100", text: "text-orange-600" },
  { value: "amber",  label: "Ámbar",   bg: "bg-amber-100",  text: "text-amber-600"  },
  { value: "pink",   label: "Pink",    bg: "bg-pink-100",   text: "text-pink-600"   },
  { value: "green",  label: "Verde",   bg: "bg-green-100",  text: "text-green-600"  },
  { value: "purple", label: "Púrpura", bg: "bg-purple-100", text: "text-purple-600" },
  { value: "blue",   label: "Azul",    bg: "bg-blue-100",   text: "text-blue-600"   },
  { value: "teal",   label: "Teal",    bg: "bg-teal-100",   text: "text-teal-600"   },
];

const ICON_OPTIONS = [
  "ri-door-open-line", "ri-tools-line", "ri-folder-download-line", "ri-group-line",
  "ri-clipboard-line", "ri-shield-check-line", "ri-price-tag-3-line", "ri-award-line",
  "ri-book-open-line", "ri-palette-line", "ri-video-line", "ri-play-circle-line",
  "ri-star-line", "ri-fire-line", "ri-rocket-line", "ri-graduation-cap-line",
  "ri-lightbulb-line", "ri-magic-line", "ri-scissors-cut-line", "ri-heart-line",
];

const emptyForm = { name: "", color: "rose", icon: "ri-price-tag-3-line", description: "" };

export default function AdminTags() {
  const { loading, allTags, allDBLessons, saveTag, deleteTag } = useCourseStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<DBLessonTag | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const getLessonCount = (tagId: string) =>
    allDBLessons.filter((l) => l.tag_id === tagId).length;

  const openNew = () => {
    setEditingTag(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (tag: DBLessonTag) => {
    setEditingTag(tag);
    setForm({ name: tag.name, color: tag.color, icon: tag.icon, description: tag.description ?? "" });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await saveTag({ id: editingTag?.id, ...form });
    setSaving(false);
    setShowForm(false);
    setEditingTag(null);
    showToast(editingTag ? "Etiqueta actualizada" : "Etiqueta creada");
  };

  const handleDelete = async (tag: DBLessonTag) => {
    const count = getLessonCount(tag.id);
    const msg = count > 0
      ? `¿Eliminar la etiqueta "${tag.name}"? Las ${count} lecciones que la usan quedarán sin etiqueta.`
      : `¿Eliminar la etiqueta "${tag.name}"?`;
    if (!window.confirm(msg)) return;
    await deleteTag(tag.id);
    showToast("Etiqueta eliminada");
  };

  const selectedColor = COLOR_OPTIONS.find(c => c.value === form.color) ?? COLOR_OPTIONS[0];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">
        {toast && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-medium shadow-lg">
            <i className="ri-check-line mr-2"></i>{toast}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Etiquetas de sección</h1>
            <p className="text-gray-500 mt-1">Organiza las lecciones en áreas dentro del módulo</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Nueva etiqueta
          </button>
        </div>

        {/* How it works banner */}
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 mb-8 flex items-start gap-4">
          <div className="w-10 h-10 flex items-center justify-center bg-rose-100 rounded-xl shrink-0">
            <i className="ri-information-line text-rose-500 text-lg"></i>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-1">¿Cómo funcionan las etiquetas?</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Asigna una etiqueta a cada lección desde <strong>Lecciones → Editar</strong>. Las lecciones etiquetadas se agruparán
              en secciones con ese nombre dentro de la vista del módulo, creando áreas como "Introducción", "Práctica Avanzada", "Recursos", etc.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader className="w-7 h-7 text-rose-400 animate-spin" />
            <span className="text-gray-400">Cargando etiquetas...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {allTags.map((tag) => {
              const c = COLOR_OPTIONS.find(o => o.value === tag.color) ?? COLOR_OPTIONS[0];
              const count = getLessonCount(tag.id);
              return (
                <div
                  key={tag.id}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${c.bg}`}>
                        <i className={`${tag.icon} text-xl ${c.text}`}></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{tag.name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text} mt-0.5 inline-block`}>
                          {count} lección{count !== 1 ? "es" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(tag)}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
                        className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-400 hover:text-rose-500 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {tag.description && (
                    <p className="text-gray-400 text-sm leading-relaxed">{tag.description}</p>
                  )}
                </div>
              );
            })}

            {allTags.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-gray-700 font-medium mb-1">Sin etiquetas aún</h3>
                <p className="text-gray-400 text-sm">Crea tu primera etiqueta para organizar las lecciones</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTag ? "Editar etiqueta" : "Nueva etiqueta"}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Preview */}
              <div className={`flex items-center gap-3 p-4 rounded-xl ${selectedColor.bg}`}>
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white/70`}>
                  <i className={`${form.icon} text-xl ${selectedColor.text}`}></i>
                </div>
                <div>
                  <p className={`font-semibold ${selectedColor.text}`}>{form.name || "Nombre de la etiqueta"}</p>
                  <p className="text-xs text-gray-500">{form.description || "Descripción opcional"}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Práctica Avanzada"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm({ ...form, color: c.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-2 transition-all whitespace-nowrap ${c.bg} ${c.text} ${
                        form.color === c.value ? "border-current" : "border-transparent"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ícono</label>
                <div className="grid grid-cols-10 gap-2">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg border-2 cursor-pointer transition-all ${
                        form.icon === icon
                          ? `border-current ${selectedColor.bg} ${selectedColor.text}`
                          : "border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      <i className={`${icon} text-base`}></i>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Ej: Ejercicios prácticos y aplicaciones reales"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium cursor-pointer whitespace-nowrap">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 disabled:bg-rose-300 cursor-pointer whitespace-nowrap">
                  {saving ? <><Loader className="w-4 h-4 animate-spin" />Guardando...</> : <><Save className="w-4 h-4" />Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
