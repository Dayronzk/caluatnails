import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { DBService } from "@/lib/types";

type FormData = Omit<DBService, "id" | "created_at" | "updated_at">;

const EMPTY: FormData = {
  name: "",
  description: "",
  duration_minutes: 60,
  price: 0,
  service_type: "General",
  active: true,
  reward_points: 0,
  order_index: 0,
  guarantee_window_days: 0,
  guarantee_duration_minutes: 0,
};

const DURATION_PRESETS = [15, 30, 45, 60, 75, 90, 120];

interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  type: string;
  unit: string;
  quantity: number;
  usage_capacity: number | null;
  usage_unit: string;
  cost_price: number;
}

interface UsageRow {
  id?: string;
  inventory_id: string;
  quantity_per_service: number;
  notes: string | null;
}

interface Props {
  editing: DBService | null;
  serviceTypes: string[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ServiceModal({ editing, serviceTypes, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormData>(
    editing
      ? {
          name: editing.name,
          description: editing.description ?? "",
          duration_minutes: editing.duration_minutes,
          price: editing.price,
          service_type: editing.service_type,
          active: editing.active,
          reward_points: editing.reward_points ?? 0,
          order_index: editing.order_index ?? 0,
          guarantee_window_days: editing.guarantee_window_days ?? 0,
          guarantee_duration_minutes: editing.guarantee_duration_minutes ?? 0,
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Inventory consumption
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [usageRows, setUsageRows] = useState<UsageRow[]>([]);
  const [showInventory, setShowInventory] = useState(false);
  const [showGuaranteeSettings, setShowGuaranteeSettings] = useState(false);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(p => ({ ...p, [key]: value }));

  const loadInventory = useCallback(async () => {
    const { data } = await supabase
      .from("inventory")
      .select("id, name, brand, type, unit, quantity, usage_capacity, usage_unit, cost_price")
      .eq("active", true)
      .order("name");
    setInventoryItems((data ?? []) as InventoryItem[]);
  }, []);

  const loadUsage = useCallback(async () => {
    if (!editing) return;
    const { data } = await supabase
      .from("service_inventory_usage")
      .select("id, inventory_id, quantity_per_service, notes")
      .eq("service_id", editing.id);
    setUsageRows((data ?? []) as UsageRow[]);
  }, [editing]);

  useEffect(() => {
    loadInventory();
    loadUsage();
  }, [loadInventory, loadUsage]);

  const addUsageRow = () => {
    const usedIds = new Set(usageRows.map(r => r.inventory_id));
    const available = inventoryItems.find(i => !usedIds.has(i.id));
    if (!available) return;
    setUsageRows(p => [...p, { inventory_id: available.id, quantity_per_service: 1, notes: null }]);
  };

  const updateUsageRow = (idx: number, patch: Partial<UsageRow>) => {
    setUsageRows(p => p.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const removeUsageRow = (idx: number) => {
    setUsageRows(p => p.filter((_, i) => i !== idx));
  };

  // Total material cost per service
  const materialCost = usageRows.reduce((sum, row) => {
    const item = inventoryItems.find(i => i.id === row.inventory_id);
    if (!item || !item.usage_capacity || item.usage_capacity <= 0) return sum;
    const costPerUse = item.cost_price / item.usage_capacity;
    return sum + costPerUse * row.quantity_per_service;
  }, 0);

  const handleSave = async () => {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    setError("");
    setSaving(true);

    let serviceId: string;
    if (editing) {
      await supabase.from("services").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editing.id);
      serviceId = editing.id;
    } else {
      const { data } = await supabase.from("services").insert({ ...form }).select("id").single();
      serviceId = data?.id ?? "";
    }

    if (serviceId) {
      // Sync inventory usage: delete old, insert current
      await supabase.from("service_inventory_usage").delete().eq("service_id", serviceId);
      if (usageRows.length > 0) {
        await supabase.from("service_inventory_usage").insert(
          usageRows.map(r => ({
            service_id: serviceId,
            inventory_id: r.inventory_id,
            quantity_per_service: r.quantity_per_service,
            notes: r.notes,
          }))
        );
      }
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {editing ? "Editar servicio" : "Nuevo servicio"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
            <i className="ri-close-line text-gray-500"></i>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
              placeholder="Ej. Manicura Clásica"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
            <textarea
              value={form.description ?? ""}
              onChange={e => set("description", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 resize-none"
              rows={3}
              placeholder="Describe el servicio..."
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{(form.description ?? "").length}/500</p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de servicio</label>
            <div className="flex flex-wrap gap-2">
              {serviceTypes.map(t => (
                <button
                  key={t}
                  onClick={() => set("service_type", t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${form.service_type === t ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DURATION_PRESETS.map(d => (
                <button
                  key={d}
                  onClick={() => set("duration_minutes", d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${form.duration_minutes === d ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {d < 60 ? `${d} min` : d === 60 ? "1 h" : `${Math.floor(d / 60)} h ${d % 60 > 0 ? `${d % 60} min` : ""}`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                step={5}
                value={form.duration_minutes}
                onChange={e => set("duration_minutes", Number(e.target.value))}
                className="w-28 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-rose-400"
              />
              <span className="text-sm text-gray-400">minutos</span>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio (€) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.price}
                onChange={e => set("price", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* Reward points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <i className="ri-coin-line text-amber-500 mr-1"></i>
              Puntos de recompensa
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[0, 50, 100, 150, 200, 300, 500].map(v => (
                <button
                  key={v}
                  onClick={() => set("reward_points", v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${form.reward_points === v ? "bg-amber-400 text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                >
                  {v === 0 ? "Sin puntos" : `${v} pts`}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0}
              step={10}
              value={form.reward_points}
              onChange={e => set("reward_points", Number(e.target.value))}
              className="w-28 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-rose-400"
              placeholder="0"
            />
            <p className="text-xs text-gray-400 mt-1">Puntos que ganará el cliente al reservar este servicio</p>
          </div>

          {/* Inventory consumption */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowInventory(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-left">
                <i className="ri-archive-2-line text-rose-500"></i>
                <span className="text-sm font-semibold text-gray-800">Consumo de inventario</span>
                {usageRows.length > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {usageRows.length}
                  </span>
                )}
              </div>
              <i className={`ri-arrow-${showInventory ? "up" : "down"}-s-line text-gray-400`}></i>
            </button>

            {showInventory && (
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-500">
                  Define qué artículos del inventario consume este servicio. Te ayudará a calcular el coste real y predecir cuándo se agotará el stock.
                </p>

                {usageRows.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">
                    <i className="ri-archive-line text-2xl block mb-2 opacity-50"></i>
                    Aún no has añadido artículos
                  </div>
                ) : (
                  <div className="space-y-2">
                    {usageRows.map((row, idx) => {
                      const item = inventoryItems.find(i => i.id === row.inventory_id);
                      const usedIds = new Set(usageRows.filter((_, i) => i !== idx).map(r => r.inventory_id));
                      const availableItems = inventoryItems.filter(i => !usedIds.has(i.id));
                      return (
                        <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={row.inventory_id}
                              onChange={e => updateUsageRow(idx, { inventory_id: e.target.value })}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400 bg-white cursor-pointer"
                            >
                              {availableItems.map(i => (
                                <option key={i.id} value={i.id}>
                                  {i.name}{i.brand ? ` · ${i.brand}` : ""}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeUsageRow(idx)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 cursor-pointer transition-colors"
                            >
                              <i className="ri-delete-bin-line text-sm"></i>
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              step={item?.usage_unit === "ml" || item?.usage_unit === "gr" ? 0.5 : 1}
                              value={row.quantity_per_service}
                              onChange={e => updateUsageRow(idx, { quantity_per_service: Number(e.target.value) })}
                              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400 bg-white"
                            />
                            <span className="text-xs text-gray-500 flex-1">
                              {item?.usage_unit ?? "usos"} por servicio
                              {item?.usage_capacity && (
                                <span className="block text-gray-400">
                                  Rinde para {item.usage_capacity} {item.usage_unit} por unidad
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {inventoryItems.length > usageRows.length && (
                  <button
                    type="button"
                    onClick={addUsageRow}
                    className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/40 transition-all cursor-pointer"
                  >
                    <i className="ri-add-line"></i>Añadir artículo
                  </button>
                )}

                {materialCost > 0 && (
                  <div className="bg-rose-50 rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-rose-700">Coste de materiales por servicio</span>
                    <span className="text-sm font-bold text-rose-700">€{materialCost.toFixed(3)}</span>
                  </div>
                )}
                {form.price > 0 && materialCost > 0 && (
                  <div className="bg-emerald-50 rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-emerald-700">Margen estimado</span>
                    <span className="text-sm font-bold text-emerald-700">
                      €{(form.price - materialCost).toFixed(2)} ({((1 - materialCost / form.price) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service Guarantee settings */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuaranteeSettings(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-left">
                <i className="ri-shield-check-line text-rose-500"></i>
                <span className="text-sm font-semibold text-gray-800">Garantía del servicio</span>
                {form.guarantee_window_days > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    Activa ({form.guarantee_window_days}d)
                  </span>
                )}
              </div>
              <i className={`ri-arrow-${showGuaranteeSettings ? "up" : "down"}-s-line text-gray-400`}></i>
            </button>

            {showGuaranteeSettings && (
              <div className="p-4 space-y-4">
                <p className="text-xs text-gray-500">
                  Configura si este servicio ofrece garantía gratuita de reparación y por cuánto tiempo. Las clientas podrán solicitarla desde su historial de citas.
                </p>

                {/* Guarantee Window Days */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plazo de garantía (en días)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={form.guarantee_window_days}
                      onChange={e => set("guarantee_window_days", Number(e.target.value))}
                      className="w-28 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-rose-400"
                    />
                    <span className="text-sm text-gray-400">días</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Número de días posterior a la cita en el que se puede pedir la garantía. 0 = sin garantía.</p>
                </div>

                {/* Guarantee Duration Minutes */}
                {form.guarantee_window_days > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Duración de la reparación (en minutos)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={form.guarantee_duration_minutes}
                        onChange={e => set("guarantee_duration_minutes", Number(e.target.value))}
                        className="w-28 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-rose-400"
                      />
                      <span className="text-sm text-gray-400">minutos</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Tiempo que ocupará el profesional en su agenda para realizar la reparación gratuita.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => set("active", !form.active)}
              className={`w-11 h-6 rounded-full transition-all cursor-pointer relative flex-shrink-0 ${form.active ? "bg-rose-500" : "bg-gray-200"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.active ? "left-6" : "left-1"}`} />
            </button>
            <div>
              <span className="text-sm font-medium text-gray-700">Servicio activo</span>
              <p className="text-xs text-gray-400">Visible en el sistema de reservas</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-2"><i className="ri-loader-4-line animate-spin"></i>Guardando...</span>
            ) : editing ? "Guardar cambios" : "Crear servicio"}
          </button>
        </div>
      </div>
    </div>
  );
}
