import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DBInventory } from "@/lib/types";

interface Props {
  editing: DBInventory | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function InventoryModal({ editing, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<DBInventory, "id" | "created_at" | "updated_at">>({
    name: "",
    description: "",
    brand: "",
    category: "",
    sku: "",
    type: "insumo",
    quantity: 0,
    unit: "unidades",
    min_stock: 0,
    cost_price: 0,
    sell_price: 0,
    image_url: null,
    active: true,
    notes: "",
    expiry_date: null,
    location: "",
    usage_capacity: null,
    usage_unit: null,
    pack_size: null,
    pack_unit: null,
    last_restock_at: null,
  });

  useEffect(() => {
    if (editing) {
      setFormData({
        name: editing.name,
        description: editing.description || "",
        brand: editing.brand || "",
        category: editing.category || "",
        sku: editing.sku || "",
        type: editing.type,
        quantity: editing.quantity,
        unit: editing.unit,
        min_stock: editing.min_stock,
        cost_price: editing.cost_price || 0,
        sell_price: editing.sell_price || 0,
        image_url: editing.image_url,
        active: editing.active ?? true,
        notes: editing.notes || "",
        expiry_date: editing.expiry_date,
        location: editing.location || "",
        usage_capacity: editing.usage_capacity,
        usage_unit: editing.usage_unit,
        pack_size: editing.pack_size ?? null,
        pack_unit: editing.pack_unit ?? null,
        last_restock_at: editing.last_restock_at,
      });
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editing) {
        const { error } = await supabase
          .from("inventory")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("inventory")
          .insert([formData]);
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      console.error("Error saving inventory item:", err);
      alert("Error al guardar el ítem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
          <h2 className="font-bold text-gray-900">{editing ? "Editar ítem" : "Nuevo ítem de inventario"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Nombre</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors"
                placeholder="Ej. Esmalte Rojo Pasión"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Marca</label>
              <input
                type="text"
                value={formData.brand || ""}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors"
                placeholder="Ej. Bella vida"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Categoría</label>
              <input
                type="text"
                value={formData.category || ""}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors"
                placeholder="Ej. Limas, Herramientas"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Descripción</label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors resize-none"
                rows={2}
                placeholder="Detalles adicionales..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors bg-white cursor-pointer"
              >
                <option value="insumo">Insumo</option>
                <option value="herramienta">Herramienta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">SKU / Código</label>
              <input
                type="text"
                value={formData.sku || ""}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors"
                placeholder="Ej. LIM-001"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Cantidad Actual</label>
              <input
                required
                type="number"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Unidad</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors"
                placeholder="Ej. unidades, ml, g"
              />
            </div>

            {/* ─── Paquete (opcional) ─── */}
            <div className="md:col-span-2 bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <i className="ri-archive-2-line text-indigo-500"></i>
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">¿Viene en paquete?</p>
                <span className="text-[10px] text-indigo-400 ml-auto">opcional</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Nombre del paquete</label>
                  <input
                    type="text"
                    value={formData.pack_unit || ""}
                    onChange={(e) => setFormData({ ...formData, pack_unit: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg border border-indigo-100 bg-white focus:outline-none focus:border-indigo-400 transition-colors text-sm"
                    placeholder="Ej. caja, blister, rollo"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">
                    Cantidad por paquete
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.pack_size ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pack_size: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-indigo-100 bg-white focus:outline-none focus:border-indigo-400 transition-colors text-sm"
                    placeholder="Ej. 100"
                  />
                </div>
              </div>
              {formData.pack_size && formData.pack_size > 0 && (
                <p className="text-[11px] text-indigo-600 mt-2 leading-relaxed">
                  <i className="ri-information-line mr-1"></i>
                  Cada {formData.pack_unit || "paquete"} contiene <strong>{formData.pack_size} {formData.unit || "uds"}</strong>.
                  {formData.quantity > 0 && formData.pack_size > 0 && (
                    <> · En stock: <strong>{(formData.quantity / formData.pack_size).toFixed(2)} {formData.pack_unit || "paquetes"}</strong> ≈ {formData.quantity} {formData.unit || "uds"}</>
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Stock Mínimo</label>
              <input
                required
                type="number"
                step="any"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Ubicación</label>
              <input
                type="text"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors"
                placeholder="Ej. Estante A-1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Precio Costo (Gasto)</label>
              <input
                type="number"
                step="any"
                value={formData.cost_price || 0}
                onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Precio Venta (PVP)</label>
              <input
                type="number"
                step="any"
                value={formData.sell_price || 0}
                onChange={(e) => setFormData({ ...formData, sell_price: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-full bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200 disabled:opacity-50"
            >
              {loading ? (
                <i className="ri-loader-4-line animate-spin text-xl"></i>
              ) : (
                editing ? "Guardar cambios" : "Crear ítem"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
