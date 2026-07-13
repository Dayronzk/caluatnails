import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { AdminSidebar } from "../components/AdminSidebar";
import { LessonForm } from "../components/LessonForm";
import { DraggableLessonRow } from "./components/DraggableLessonRow";
import { Plus, Search, Loader, Save, Layers } from "lucide-react";
import { useCourseStore } from "@/hooks/useCourseStore";
import type { DBLesson } from "@/lib/types";

type LessonWithModule = DBLesson & { moduleTitle: string };

export default function AdminLessons() {
  const {
    loading,
    allModules,
    allTags,
    getAllDBLessonsWithModule,
    saveLesson,
    deleteLesson,
    reorderLessons,
    bulkAssignModule,
  } = useCourseStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonWithModule | null>(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  // Drag & drop local order state
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModule, setBulkModule] = useState<string>("");
  const [showBulkBar, setShowBulkBar] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const allLessons = getAllDBLessonsWithModule();

  // Apply local order if dirty
  const orderedLessons: LessonWithModule[] = localOrder
    ? (localOrder
        .map((id) => allLessons.find((l) => l.id === id))
        .filter(Boolean) as LessonWithModule[])
    : [...allLessons].sort((a, b) => a.order_index - b.order_index);

  const filtered = orderedLessons.filter((l) => {
    const matchSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchModule = filterModule === "all" || l.module_id === filterModule;
    return matchSearch && matchModule;
  });

  // ── Drag & drop ──
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const currentOrder = localOrder ?? orderedLessons.map((l) => l.id);
      const oldIdx = currentOrder.indexOf(active.id as string);
      const newIdx = currentOrder.indexOf(over.id as string);
      if (oldIdx === -1 || newIdx === -1) return;

      const newOrder = arrayMove(currentOrder, oldIdx, newIdx);
      setLocalOrder(newOrder);
      setOrderDirty(true);
    },
    [localOrder, orderedLessons],
  );

  const handleSaveOrder = async () => {
    if (!localOrder) return;
    setSaving(true);
    await reorderLessons(localOrder);
    setLocalOrder(null);
    setOrderDirty(false);
    setSaving(false);
    showToast("Orden guardado correctamente");
  };

  const handleDiscardOrder = () => {
    setLocalOrder(null);
    setOrderDirty(false);
  };

  // ── Selection ──
  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      setShowBulkBar(next.size > 0);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(filtered.map((l) => l.id));
      setSelectedIds(ids);
      setShowBulkBar(ids.size > 0);
    } else {
      setSelectedIds(new Set());
      setShowBulkBar(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkModule || selectedIds.size === 0) return;
    setSaving(true);
    await bulkAssignModule(Array.from(selectedIds), bulkModule);
    setSelectedIds(new Set());
    setShowBulkBar(false);
    setBulkModule("");
    setSaving(false);
    showToast(`${selectedIds.size} lección(es) movidas al módulo`);
  };

  // ── CRUD ──
  const handleSave = async (data: Partial<DBLesson> & { moduleId: string }) => {
    setSaving(true);
    const { moduleId, ...lessonFields } = data;
    await saveLesson(moduleId, lessonFields);
    setSaving(false);
    setShowForm(false);
    setEditingLesson(null);
    showToast(editingLesson ? "Lección actualizada" : "Lección creada");
  };

  const handleDelete = async (lesson: LessonWithModule) => {
    if (!window.confirm(`¿Eliminar "${lesson.title}"?`)) return;
    await deleteLesson(lesson.id);
    showToast("Lección eliminada");
  };

  const allSelected = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">
        {toast && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-medium">
            <i className="ri-check-line mr-2"></i>{toast}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lecciones</h1>
            <p className="text-gray-500 mt-1">
              Gestiona el contenido · <span className="font-medium text-gray-700">{allLessons.length}</span> lecciones
              {orderDirty && (
                <span className="ml-2 text-amber-600 font-medium text-xs">· Orden modificado sin guardar</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {orderDirty && (
              <>
                <button
                  onClick={handleDiscardOrder}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap text-sm"
                >
                  Descartar
                </button>
                <button
                  onClick={handleSaveOrder}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap text-sm"
                >
                  <Save className="w-4 h-4" /> Guardar orden
                </button>
              </>
            )}
            <button
              onClick={() => { setEditingLesson(null); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> Nueva lección
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar lecciones..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm"
            />
          </div>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 outline-none bg-white text-sm cursor-pointer"
          >
            <option value="all">Todos los módulos</option>
            {allModules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>

        {/* Drag hint */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
            <i className="ri-drag-move-line"></i>
            Arrastra las filas para reordenar · selecciona varias para moverlas de módulo
          </p>
        )}

        {/* Bulk action bar */}
        {showBulkBar && (
          <div className="mb-4 flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-5 py-3">
            <Layers className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span className="text-sm font-medium text-rose-700 whitespace-nowrap">
              {selectedIds.size} seleccionada{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <span className="text-sm text-rose-600 whitespace-nowrap">→ Mover a:</span>
            <select
              value={bulkModule}
              onChange={(e) => setBulkModule(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-sm focus:outline-none focus:border-rose-400 cursor-pointer"
            >
              <option value="">Selecciona un módulo...</option>
              {allModules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={!bulkModule}
              className="px-4 py-1.5 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
            >
              Aplicar
            </button>
            <button
              onClick={() => { setSelectedIds(new Set()); setShowBulkBar(false); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-100 text-rose-400 cursor-pointer"
            >
              <i className="ri-close-line text-base"></i>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-rose-400 animate-spin" />
            <span className="ml-3 text-gray-500">Cargando lecciones...</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 accent-rose-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-2 py-4 w-8 text-center text-xs font-semibold text-gray-400">#</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700">Lección</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700">Módulo</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700">Tipo</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700">Duración</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700">Contenido</th>
                      <th className="text-right px-4 py-4 text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <SortableContext
                    items={filtered.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((lesson, idx) => (
                        <DraggableLessonRow
                          key={lesson.id}
                          lesson={lesson}
                          index={idx}
                          selected={selectedIds.has(lesson.id)}
                          onSelect={handleSelect}
                          onEdit={(l) => { setEditingLesson(l); setShowForm(true); }}
                          onDelete={handleDelete}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No se encontraron lecciones</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showForm && (
        <LessonForm
          lesson={editingLesson ? { ...editingLesson, moduleId: editingLesson.module_id } : null}
          modules={allModules.map((m) => ({ id: m.id, title: m.title }))}
          tags={allTags}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingLesson(null); }}
        />
      )}
      {saving && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl px-8 py-6 flex items-center gap-4">
            <Loader className="w-6 h-6 text-rose-500 animate-spin" />
            <span className="text-gray-700 font-medium">Guardando...</span>
          </div>
        </div>
      )}
    </div>
  );
}
