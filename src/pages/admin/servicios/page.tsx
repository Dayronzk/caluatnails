import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { DBService } from "@/lib/types";
import { AdminSidebar } from "@/pages/admin/components/AdminSidebar";
import ServiceModal from "./components/ServiceModal";
import BulkEditBar from "./components/BulkEditBar";
import ServiceRow from "./components/ServiceRow";
import { TREATWELL_SERVICES } from "@/data/servicesCatalog";

const SERVICE_TYPES = [
  "Manicura", "Pedicura", "Manos y pies", "Uñas de gel y acrílico",
  "Nail art", "Depilación con hilo", "Pestañas y cejas",
];

export { SERVICE_TYPES };

export const DEFAULT_CALUATNAILS_SERVICES: DBService[] = TREATWELL_SERVICES.map((s, idx) => ({
  id: s.id,
  name: s.name,
  description: s.description,
  duration_minutes: s.duration_minutes,
  price: s.price,
  service_type: s.service_type,
  active: s.active,
  reward_points: s.reward_points ?? (s.price > 30 ? 15 : 5),
  order_index: s.order_index ?? idx + 1,
  guarantee_window_days: s.guarantee_window_days ?? 7,
  guarantee_duration_minutes: s.guarantee_duration_minutes ?? 20,
}));

export default function AdminServiciosPage() {
  const [services, setServices] = useState<DBService[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DBService | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("services")
        .select("*")
        .order("order_index")
        .order("name");
      
      if (data && data.length > 0) {
        setServices(data);
      } else {
        setServices(DEFAULT_CALUATNAILS_SERVICES);
      }
    } catch {
      setServices(DEFAULT_CALUATNAILS_SERVICES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSeedServices = async () => {
    setSeeding(true);
    try {
      for (const s of DEFAULT_CALUATNAILS_SERVICES) {
        await supabase.from("services").upsert({
          id: s.id,
          name: s.name,
          description: s.description,
          duration_minutes: s.duration_minutes,
          price: s.price,
          service_type: s.service_type,
          active: s.active,
          reward_points: s.reward_points,
          order_index: s.order_index,
          guarantee_window_days: s.guarantee_window_days,
          guarantee_duration_minutes: s.guarantee_duration_minutes,
        }, { onConflict: "id" });
      }
      showToast("Catálogo completo de Caluatnails (35 servicios) guardado en BD");
      await load();
    } catch (err) {
      showToast("Error al sincronizar catálogo", "error");
    } finally {
      setSeeding(false);
    }
  };

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (s: DBService) => { setEditing(s); setShowModal(true); };

  const handleSaved = () => { setShowModal(false); load(); };

  const handleDelete = async (id: string) => {
    await supabase.from("services").update({ active: false }).eq("id", id);
    setDeleteConfirm(null);
    showToast("Servicio desactivado");
    load();
  };

  // ── Selection ──────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(s => s.id)));
    }
  };

  // ── Bulk actions ───────────────────────────────────────────
  const bulkSetType = async (type: string) => {
    if (selected.size === 0) return;
    setBulkSaving(true);
    await supabase.from("services").update({ service_type: type, updated_at: new Date().toISOString() }).in("id", [...selected]);
    setBulkSaving(false);
    setSelected(new Set());
    showToast(`Tipo actualizado a "${type}" en ${selected.size} servicio(s)`);
    load();
  };

  const bulkSetPoints = async (points: number) => {
    if (selected.size === 0) return;
    setBulkSaving(true);
    await supabase.from("services").update({ reward_points: points, updated_at: new Date().toISOString() }).in("id", [...selected]);
    setBulkSaving(false);
    setSelected(new Set());
    showToast(`Puntos actualizados a ${points} en ${selected.size} servicio(s)`);
    load();
  };

  const bulkToggleActive = async (active: boolean) => {
    if (selected.size === 0) return;
    setBulkSaving(true);
    await supabase.from("services").update({ active, updated_at: new Date().toISOString() }).in("id", [...selected]);
    setBulkSaving(false);
    setSelected(new Set());
    showToast(`${selected.size} servicio(s) ${active ? "activados" : "desactivados"}`);
    load();
  };

  // ── Drag & drop reorder ────────────────────────────────────
  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOver(id);
  };
  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOver(null); return; }
    const reordered = [...services];
    const fromIdx = reordered.findIndex(s => s.id === dragId);
    const toIdx = reordered.findIndex(s => s.id === targetId);
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, order_index: i }));
    setServices(updated);
    setDragId(null);
    setDragOver(null);
    await Promise.all(
      updated.map(s => supabase.from("services").update({ order_index: s.order_index }).eq("id", s.id))
    );
    showToast("Orden guardado");
  };

  // ── Filters ────────────────────────────────────────────────
  const filtered = services.filter(s => {
    if (filterType !== "all" && s.service_type !== filterType) return false;
    if (filterActive === "active" && !s.active) return false;
    if (filterActive === "inactive" && s.active) return false;
    return true;
  });

  const types = [...new Set(services.map(s => s.service_type))];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Servicios</h1>
              <p className="text-gray-500 text-sm mt-1">Catálogo oficial Caluatnails ({services.length} servicios registrados)</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSeedServices}
                disabled={seeding}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-4 py-2.5 rounded-full flex items-center gap-2 border border-rose-200 transition-colors cursor-pointer text-xs"
              >
                <i className={`ri-refresh-line ${seeding ? "animate-spin" : ""}`}></i>
                {seeding ? "Guardando en BD..." : "Sincronizar 35 Servicios"}
              </button>
              <button
                onClick={openCreate}
                className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 transition-colors cursor-pointer text-sm"
              >
                <i className="ri-add-line"></i>
                Nuevo servicio
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total servicios", value: services.length, icon: "ri-scissors-line", color: "text-rose-500", bg: "bg-rose-50" },
              { label: "Activos", value: services.filter(s => s.active).length, icon: "ri-check-double-line", color: "text-teal-600", bg: "bg-teal-50" },
              { label: "Categorías", value: types.length, icon: "ri-price-tag-3-line", color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Precio medio", value: `€${services.length ? (services.reduce((a, s) => a + Number(s.price), 0) / services.length).toFixed(1) : 0}`, icon: "ri-money-euro-circle-line", color: "text-indigo-600", bg: "bg-indigo-50" },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-lg ${stat.bg}`}>
                    <i className={`${stat.icon} ${stat.color} text-sm`}></i>
                  </div>
                  <span className="text-xs text-gray-400">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-1 py-1">
              {["all", "active", "inactive"].map(v => (
                <button
                  key={v}
                  onClick={() => setFilterActive(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${filterActive === v ? "bg-rose-500 text-white" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {v === "all" ? "Todos" : v === "active" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-full px-4 py-1.5 text-xs bg-white text-gray-600 focus:outline-none focus:border-rose-400 cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {filtered.length !== services.length && (
              <span className="text-xs text-gray-400">{filtered.length} de {services.length} servicios</span>
            )}
          </div>

          {/* Bulk edit bar */}
          {selected.size > 0 && (
            <BulkEditBar
              count={selected.size}
              serviceTypes={SERVICE_TYPES}
              saving={bulkSaving}
              onSetType={bulkSetType}
              onSetPoints={bulkSetPoints}
              onActivate={() => bulkToggleActive(true)}
              onDeactivate={() => bulkToggleActive(false)}
              onClear={() => setSelected(new Set())}
            />
          )}

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <i className="ri-scissors-line text-4xl text-gray-200 mb-3 block"></i>
              <p className="text-gray-400 text-sm">No hay servicios con estos filtros</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selected.size === filtered.length && filtered.length > 0}
                          onChange={toggleAll}
                          className="rounded cursor-pointer accent-rose-500"
                        />
                      </th>
                      <th className="w-8 px-2 py-3"></th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Servicio</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoría</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Duración</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Precio</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Puntos</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(s => (
                      <ServiceRow
                        key={s.id}
                        service={s}
                        selected={selected.has(s.id)}
                        isDragOver={dragOver === s.id}
                        onSelect={() => toggleSelect(s.id)}
                        onEdit={() => openEdit(s)}
                        onDelete={() => setDeleteConfirm(s.id)}
                        onDragStart={() => handleDragStart(s.id)}
                        onDragOver={e => handleDragOver(e, s.id)}
                        onDrop={() => handleDrop(s.id)}
                        onDragEnd={() => { setDragId(null); setDragOver(null); }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <ServiceModal
          editing={editing}
          serviceTypes={SERVICE_TYPES}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-delete-bin-line text-red-500 text-xl"></i>
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-2">¿Desactivar servicio?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">El servicio dejará de aparecer en el sistema de reservas. Puedes reactivarlo más tarde.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold cursor-pointer transition-colors">Desactivar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-medium text-white shadow-lg transition-all ${toast.type === "success" ? "bg-teal-500" : "bg-red-500"}`}>
          <i className={`${toast.type === "success" ? "ri-check-line" : "ri-error-warning-line"} mr-2`}></i>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
