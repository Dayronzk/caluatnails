import { useState } from "react";
import { X, Save } from "lucide-react";
import type { DBModule, DBLessonTag } from "@/lib/types";

interface ModuleFormProps {
  module?: DBModule | null;
  tags?: DBLessonTag[];
  onSave: (data: Partial<DBModule> & { id?: string }) => void;
  onCancel: () => void;
}

const iconOptions = [
  { value: "ri-book-line", label: "Libro" },
  { value: "ri-palette-line", label: "Paleta" },
  { value: "ri-scissors-cut-line", label: "Tijeras" },
  { value: "ri-drop-line", label: "Gota" },
  { value: "ri-flower-line", label: "Flor" },
  { value: "ri-magic-line", label: "Magia" },
  { value: "ri-shield-check-line", label: "Escudo" },
  { value: "ri-artboard-line", label: "Arte" },
  { value: "ri-ink-bottle-line", label: "Tinta" },
  { value: "ri-pencil-ruler-line", label: "Regla" },
  { value: "ri-flashlight-line", label: "Flash" },
];

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const SYNC_FN = `${SUPABASE_URL}/functions/v1/stripe-sync-product`;

export function ModuleForm({ module, tags = [], onSave, onCancel }: ModuleFormProps) {
  const [form, setForm] = useState({
    title: module?.title ?? "",
    description: module?.description ?? "",
    level: module?.level ?? "Principiante",
    duration: module?.duration ?? "",
    color: (module?.color ?? "rose") as "rose" | "orange",
    icon: module?.icon ?? "ri-book-line",
    tag_id: module?.tag_id ?? null as string | null,
    price: module?.price != null ? String(module.price) : "",
  });
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "ok" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = form.price !== "" ? parseFloat(form.price) : null;
    const finalPrice = isNaN(priceNum as number) ? null : priceNum;

    let stripeProductId = module?.stripe_product_id ?? null;
    let stripePriceId = module?.stripe_price_id ?? null;

    if (finalPrice && finalPrice > 0) {
      setSyncing(true);
      setSyncStatus("idle");
      try {
        const res = await fetch(SYNC_FN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.title,
            description: form.description || undefined,
            price_eur: finalPrice,
            stripe_product_id: stripeProductId ?? undefined,
          }),
        });
        const data = await res.json() as { stripe_product_id?: string; stripe_price_id?: string; error?: string };
        if (data.stripe_product_id && data.stripe_price_id) {
          stripeProductId = data.stripe_product_id;
          stripePriceId = data.stripe_price_id;
          setSyncStatus("ok");
        } else {
          setSyncStatus("error");
        }
      } catch {
        setSyncStatus("error");
      } finally {
        setSyncing(false);
      }
    }

    onSave({
      ...form,
      price: finalPrice,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      id: module?.id,
    });
  };

  const tagColorMap: Record<string, string> = {
    rose: "bg-rose-100 text-rose-700 ring-rose-300",
    orange: "bg-orange-100 text-orange-700 ring-orange-300",
    amber: "bg-amber-100 text-amber-700 ring-amber-300",
    pink: "bg-pink-100 text-pink-700 ring-pink-300",
    green: "bg-green-100 text-green-700 ring-green-300",
    purple: "bg-purple-100 text-purple-700 ring-purple-300",
    teal: "bg-teal-100 text-teal-700 ring-teal-300",
    blue: "bg-blue-100 text-blue-700 ring-blue-300",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{module ? "Editar Módulo" : "Nuevo Módulo"}</h2>
          <button onClick={onCancel} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título <span className="text-rose-500">*</span></label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm"
              placeholder="Ej: Fundamentos de Manicura" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción <span className="text-rose-500">*</span></label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all resize-none text-sm"
              placeholder="Describe el contenido del módulo..." />
          </div>

          {/* Price + Stripe sync */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio <span className="text-gray-400 font-normal">(EUR · dejar vacío o 0 para no mostrar en tienda)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => { setForm({ ...form, price: e.target.value }); setSyncStatus("idle"); }}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm"
                placeholder="49.99"
              />
            </div>
            {/* Stripe status indicators */}
            <div className="mt-2 flex items-center gap-2">
              {module?.stripe_price_id && syncStatus === "idle" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <i className="ri-shield-check-fill"></i>
                  Sincronizado con Stripe
                </span>
              )}
              {syncStatus === "ok" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <i className="ri-check-line"></i>
                  Producto creado/actualizado en Stripe
                </span>
              )}
              {syncStatus === "error" && (
                <span className="flex items-center gap-1.5 text-xs text-amber-600">
                  <i className="ri-error-warning-line"></i>
                  No se pudo sincronizar con Stripe (el módulo se guardará igualmente)
                </span>
              )}
              {!module?.stripe_price_id && syncStatus === "idle" && form.price && parseFloat(form.price) > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <i className="ri-upload-cloud-line"></i>
                  Se creará como producto en Stripe al guardar
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm">
                <option>Principiante</option>
                <option>Intermedio</option>
                <option>Avanzado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duración <span className="text-rose-500">*</span></label>
              <input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm"
                placeholder="Ej: 2h 30min" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Color</label>
              <div className="flex gap-3">
                {(["rose", "orange"] as const).map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`w-12 h-12 rounded-xl ${c === "rose" ? "bg-rose-500" : "bg-orange-500"} transition-all cursor-pointer ${form.color === c ? "ring-4 ring-offset-2 ring-current scale-110" : ""}`} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icono</label>
              <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm">
                {iconOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sección del sidebar <span className="text-gray-400 font-normal">(agrupa módulos en la columna lateral)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setForm({ ...form, tag_id: null })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap border ${
                    form.tag_id === null
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}>
                  <i className="ri-layout-line text-sm"></i>
                  Sin sección
                </button>
                {tags.map((tag) => {
                  const cls = tagColorMap[tag.color] ?? tagColorMap.rose;
                  const isSelected = form.tag_id === tag.id;
                  return (
                    <button key={tag.id} type="button" onClick={() => setForm({ ...form, tag_id: tag.id })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap border ${
                        isSelected ? `${cls} ring-2` : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}>
                      <i className={`${tag.icon} text-sm`}></i>
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors cursor-pointer whitespace-nowrap">Cancelar</button>
            <button type="submit" disabled={syncing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap">
              {syncing ? (
                <><i className="ri-loader-4-line animate-spin"></i> Sincronizando con Stripe...</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar módulo</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
