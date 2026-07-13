import { useState } from "react";
import { X, Save, Video, FileText, BookOpen, Award, Download } from "lucide-react";
import type { DBLesson, DBModule, DBLessonTag, QuizQuestion } from "@/lib/types";
import { QuizBuilder } from "@/pages/admin/components/QuizBuilder";

interface LessonFormProps {
  lesson?: (Partial<DBLesson> & { moduleId?: string }) | null;
  modules: Pick<DBModule, "id" | "title">[];
  tags: DBLessonTag[];
  onSave: (data: Partial<DBLesson> & { moduleId: string }) => void;
  onCancel: () => void;
}

const typeIcons = { video: Video, lectura: FileText, practica: BookOpen, evaluacion: Award, material: Download };
const typeLabels = { video: "Video", lectura: "Lectura", practica: "Práctica", evaluacion: "Evaluación", material: "Material" };

const tagColorMap: Record<string, { bg: string; text: string; border: string }> = {
  rose:   { bg: "bg-rose-50",   text: "text-rose-600",   border: "border-rose-400" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-400" },
  amber:  { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-400" },
  pink:   { bg: "bg-pink-50",   text: "text-pink-600",   border: "border-pink-400" },
  green:  { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-400" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-400" },
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-400" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-600",   border: "border-teal-400" },
};

export function LessonForm({ lesson, modules, tags, onSave, onCancel }: LessonFormProps) {
  const [form, setForm] = useState({
    title: lesson?.title ?? "",
    description: lesson?.description ?? "",
    type: (lesson?.type ?? "video") as DBLesson["type"],
    duration: lesson?.duration ?? "",
    is_free: lesson?.is_free ?? false,
    moduleId: lesson?.moduleId ?? modules[0]?.id ?? "",
    video_url: lesson?.video_url ?? "",
    file_url: lesson?.file_url ?? "",
    content: lesson?.content ?? "",
    tag_id: lesson?.tag_id ?? "",
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>(
    (lesson as (Partial<DBLesson> & { moduleId?: string }) | null | undefined)?.questions ?? []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { moduleId, ...rest } = form;
    onSave({
      ...rest,
      id: lesson?.id,
      moduleId,
      tag_id: rest.tag_id || null,
      file_url: rest.file_url || null,
      questions: form.type === "evaluacion" ? (questions.length > 0 ? questions : null) : null,
    });
  };

  const TypeIcon = typeIcons[form.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              form.type === "video" ? "bg-rose-100 text-rose-600" :
              form.type === "lectura" ? "bg-amber-100 text-amber-600" :
              form.type === "practica" ? "bg-emerald-100 text-emerald-600" :
              form.type === "material" ? "bg-teal-100 text-teal-600" :
              "bg-purple-100 text-purple-600"
            }`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{lesson?.id ? "Editar lección" : "Nueva lección"}</h2>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Lesson type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de lección</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(typeIcons) as Array<keyof typeof typeIcons>).map((type) => {
                const Icon = typeIcons[type];
                return (
                  <button key={type} type="button" onClick={() => setForm({ ...form, type })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      form.type === type ? "border-rose-500 bg-rose-50 text-rose-600" : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{typeLabels[type]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Título <span className="text-rose-500">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm"
                placeholder="Ej: Introducción a las herramientas" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Módulo <span className="text-rose-500">*</span></label>
              <select value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm">
                {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duración <span className="text-rose-500">*</span></label>
              <input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm"
                placeholder="Ej: 15 min" />
            </div>

            {/* Section tag selector */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sección / Etiqueta
                <span className="ml-2 text-xs text-gray-400 font-normal">— agrupa esta lección en un área del módulo</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tag_id: "" })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    !form.tag_id ? "border-gray-400 bg-gray-100 text-gray-700" : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <i className="ri-close-line"></i>Sin etiqueta
                </button>
                {tags.map((tag) => {
                  const colorMap: Record<string, string> = {
                    rose: "border-rose-400 bg-rose-50 text-rose-600",
                    orange: "border-orange-400 bg-orange-50 text-orange-600",
                    amber: "border-amber-400 bg-amber-50 text-amber-600",
                    teal: "border-teal-400 bg-teal-50 text-teal-600",
                    green: "border-green-400 bg-green-50 text-green-600",
                  };
                  const isSelected = form.tag_id === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setForm({ ...form, tag_id: tag.id })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                        isSelected ? (colorMap[tag.color] ?? colorMap.rose) : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <i className={`${tag.icon} text-sm`}></i>
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {form.type === "material" ? "Material gratuito (visible en la home)" : "Lección gratuita"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {form.type === "material"
                      ? "El material aparecerá en la sección de recursos de la página principal para descarga libre"
                      : "Los usuarios pueden verla sin comprar el curso"}
                  </p>
                </div>
              </label>
            </div>

            {form.type === "video" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del video <span className="ml-2 text-xs text-gray-400 font-normal">(YouTube, Vimeo...)</span>
                </label>
                <input type="url" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm"
                  placeholder="https://www.youtube.com/embed/..." />
              </div>
            )}

            {form.type === "material" && (
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL del archivo <span className="text-rose-500">*</span>
                    <span className="ml-2 text-xs text-gray-400 font-normal">(PDF, ZIP, imagen...)</span>
                  </label>
                  <input
                    type="url"
                    value={form.file_url}
                    onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm"
                    placeholder="https://ejemplo.com/archivo.pdf"
                  />
                  {form.file_url && (
                    <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                      <i className="ri-check-line"></i> URL lista — los alumnos podrán descargar este archivo
                    </p>
                  )}
                </div>
                <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                  <p className="text-xs font-semibold text-teal-700 mb-1.5 flex items-center gap-1.5">
                    <i className="ri-information-line"></i> Cómo subir archivos
                  </p>
                  <p className="text-xs text-teal-600 leading-relaxed">
                    Sube el archivo a Google Drive, Dropbox o cualquier servicio de almacenamiento y pega aquí el enlace directo de descarga. Para Google Drive: comparte el archivo como &quot;Cualquier persona con el enlace&quot; y usa el enlace de descarga directa.
                  </p>
                </div>
              </div>
            )}

            {(form.type === "lectura" || form.type === "practica") && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido <span className="ml-2 text-xs text-gray-400 font-normal">(texto, pasos...)</span>
                </label>
                <textarea value={form.content} onChange={(e) => { if (e.target.value.length <= 500) setForm({ ...form, content: e.target.value }); }}
                  rows={8} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all resize-none text-sm"
                  placeholder="Escribe el contenido de la lección..." />
                <p className={`text-xs mt-1 text-right ${form.content.length >= 500 ? "text-rose-500" : "text-gray-400"}`}>{form.content.length}/500</p>
              </div>
            )}

            {form.type === "evaluacion" && (
              <div className="md:col-span-2">
                <QuizBuilder questions={questions} onChange={setQuestions} />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción corta <span className="text-rose-500">*</span></label>
              <textarea value={form.description} onChange={(e) => { if (e.target.value.length <= 500) setForm({ ...form, description: e.target.value }); }}
                rows={2} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all resize-none text-sm"
                placeholder="Breve descripción visible en la lista..." />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors cursor-pointer whitespace-nowrap">Cancelar</button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors cursor-pointer whitespace-nowrap">
              <Save className="w-4 h-4" /> Guardar lección
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
