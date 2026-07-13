import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { supabase } from "@/lib/supabase";
import { Loader, Plus, Trash2, Tag, Gift, Percent, DollarSign, Coins } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "points";
  value: number;
  min_purchase: number;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  expires_at: string | null;
  description: string | null;
  applies_to: "all" | "services" | "products" | "category";
  target_ids: string[];
  created_at: string;
}

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  percentage: { label: "Porcentaje", icon: "ri-percent-line", color: "text-rose-500 bg-rose-50" },
  fixed: { label: "Monto fijo", icon: "ri-money-euro-circle-line", color: "text-emerald-600 bg-emerald-50" },
  points: { label: "Puntos", icon: "ri-coin-line", color: "text-amber-500 bg-amber-50" },
};

const EMPTY_FORM = {
  code: "",
  type: "percentage" as Coupon["type"],
  value: "10",
  min_purchase: "0",
  max_uses: "",
  expires_at: "",
  description: "",
  applies_to: "all" as Coupon["applies_to"],
  target_ids: [] as string[],
};

export default function AdminCuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" as "success" | "error" });
  
  // Data for selection
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: cData }, { data: sData }, { data: pData }] = await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("services").select("id, name").order("name"),
      supabase.from("shop_products").select("id, name").order("name"),
    ]);
    setCoupons((cData ?? []) as Coupon[]);
    setServices(sData ?? []);
    setProducts(pData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.code.trim() || !form.value) {
      showToast("Código y valor son obligatorios", "error");
      return;
    }
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_purchase: Number(form.min_purchase) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      description: form.description || null,
      applies_to: form.applies_to,
      target_ids: form.target_ids,
      active: true,
    };

    const query = editingId 
      ? supabase.from("coupons").update(payload).eq("id", editingId)
      : supabase.from("coupons").insert(payload);

    const { error } = await query;
    if (error) {
      console.error("Error saving coupon:", error);
      showToast(error.message.includes("unique") ? "Ese código ya existe" : `Error: ${error.message}`, "error");
    } else {
      showToast(editingId ? "Cupón actualizado" : "Cupón creado correctamente");
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditingId(null);
      load();
    }
    setSaving(false);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      min_purchase: coupon.min_purchase.toString(),
      max_uses: coupon.max_uses?.toString() || "",
      expires_at: coupon.expires_at || "",
      description: coupon.description || "",
      applies_to: coupon.applies_to || "all",
      target_ids: coupon.target_ids || [],
    });
    setShowForm(true);
  };

  const handleToggle = async (coupon: Coupon) => {
    await supabase.from("coupons").update({ active: !coupon.active }).eq("id", coupon.id);
    setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, active: !c.active } : c));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este cupón?")) return;
    await supabase.from("coupons").update({ active: false }).eq("id", id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    showToast("Cupón eliminado");
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm((f) => ({ ...f, code }));
  };

  const formatValue = (coupon: Coupon) => {
    if (coupon.type === "percentage") return `${coupon.value}% dto.`;
    if (coupon.type === "fixed") return `${coupon.value.toFixed(2)} € dto.`;
    return `${coupon.value} pts → ${(coupon.value / 100).toFixed(2)} €`;
  };

  const activeCoupons = coupons.filter((c) => c.active);
  const inactiveCoupons = coupons.filter((c) => !c.active);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">

        {/* Toast */}
        {toast.msg && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium text-white ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
            <i className={`${toast.type === "error" ? "ri-error-warning-line" : "ri-check-line"} mr-2`}></i>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cupones y Recompensas</h1>
            <p className="text-gray-500 mt-1">Gestiona descuentos, cupones y el sistema de puntos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100">
              <Tag className="w-4 h-4 text-rose-500" />
              <span className="font-bold text-gray-900">{activeCoupons.length}</span>
              <span className="text-gray-500 text-sm">activos</span>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Nuevo cupón
            </button>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Percent className="w-5 h-5 text-rose-500" />, label: "Porcentaje", desc: "Descuento % sobre el total", bg: "bg-rose-50" },
            { icon: <DollarSign className="w-5 h-5 text-emerald-600" />, label: "Monto fijo", desc: "Descuento en euros fijo", bg: "bg-emerald-50" },
            { icon: <Coins className="w-5 h-5 text-amber-500" />, label: "Puntos", desc: "100 puntos = 1 € de descuento", bg: "bg-amber-50" },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-2xl p-5 flex items-start gap-4`}>
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-rose-500" /> Crear nuevo cupón
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Código del cupón *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="NAILOX20"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm font-mono tracking-widest transition-all"
                  />
                  <button
                    onClick={generateCode}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-medium text-gray-600 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    Generar
                  </button>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo de descuento *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Coupon["type"] }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all bg-white cursor-pointer"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo (€)</option>
                  <option value="points">Puntos (100 pts = 1 €)</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Valor *{" "}
                  <span className="text-gray-400 font-normal">
                    {form.type === "percentage" ? "(% de descuento)" : form.type === "fixed" ? "(€ de descuento)" : "(puntos equivalentes)"}
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
                />
              </div>

              {/* Min purchase */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Compra mínima (€)</label>
                <input
                  type="number"
                  min="0"
                  value={form.min_purchase}
                  onChange={(e) => setForm((f) => ({ ...f, min_purchase: e.target.value }))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
                />
              </div>

              {/* Max uses */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Usos máximos <span className="text-gray-400 font-normal">(vacío = ilimitado)</span></label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Ilimitado"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
                />
              </div>

              {/* Expires */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha de expiración <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all cursor-pointer"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción interna</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ej: Cupón de bienvenida para nuevas alumnas"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
                />
              </div>

              {/* Applies to */}
              <div className="sm:col-span-2 pt-4 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-600 mb-2.5 flex items-center gap-2">
                  <i className="ri-list-check text-rose-500"></i> ¿A qué se aplica este cupón?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "all", label: "Todo", icon: "ri-global-line" },
                    { id: "services", label: "Servicios", icon: "ri-scissors-line" },
                    { id: "products", label: "Productos", icon: "ri-shopping-bag-line" },
                    { id: "category", label: "Categoría", icon: "ri-price-tag-3-line" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setForm(f => ({ ...f, applies_to: opt.id as any, target_ids: [] }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                        form.applies_to === opt.id 
                          ? "border-rose-500 bg-rose-50 text-rose-700 font-bold" 
                          : "border-gray-100 hover:border-gray-200 text-gray-500"
                      }`}
                    >
                      <i className={`${opt.icon} text-lg`}></i>
                      <span className="text-[10px] uppercase tracking-wider">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target selection (if not 'all') */}
              {(form.applies_to === "services" || form.applies_to === "products") && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Selecciona los {form.applies_to === "services" ? "servicios" : "productos"} específicos:
                  </label>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 max-h-48 overflow-y-auto space-y-2">
                    {(form.applies_to === "services" ? services : products).map(item => (
                      <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={form.target_ids.includes(item.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked 
                              ? [...form.target_ids, item.id]
                              : form.target_ids.filter(id => id !== item.id);
                            setForm(f => ({ ...f, target_ids: newIds }));
                          }}
                          className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-400"
                        />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </label>
                    ))}
                    {(form.applies_to === "services" ? services : products).length === 0 && (
                      <p className="text-xs text-gray-400 p-2 italic">No hay elementos disponibles</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-gray-100">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2"
              >
                {saving ? <><i className="ri-loader-4-line animate-spin"></i> Guardando...</> : <><i className="ri-save-line"></i> {editingId ? "Guardar cambios" : "Crear cupón"}</>}
              </button>
            </div>
          </div>
        )}

        {/* Coupons list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-7 h-7 text-rose-400 animate-spin" />
            <span className="ml-3 text-gray-500">Cargando cupones...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-coupon-3-line text-2xl text-rose-300"></i>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Sin cupones todavía</h3>
            <p className="text-sm text-gray-400">Crea tu primer cupón para empezar a ofrecer descuentos</p>
          </div>
        ) : (
          <div className="space-y-6">
            {[{ title: "Cupones activos", list: activeCoupons }, { title: "Cupones inactivos", list: inactiveCoupons }]
              .filter((g) => g.list.length > 0)
              .map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{group.title}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {group.list.map((coupon) => {
                      const typeInfo = TYPE_LABELS[coupon.type];
                      const usagePct = coupon.max_uses ? Math.round((coupon.uses_count / coupon.max_uses) * 100) : null;
                      const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();

                      return (
                        <div
                          key={coupon.id}
                          className={`bg-white rounded-2xl border p-5 transition-all ${coupon.active && !isExpired ? "border-gray-100" : "border-gray-100 opacity-60"}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${typeInfo.color}`}>
                                <i className={`${typeInfo.icon} text-lg`}></i>
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 font-mono tracking-widest text-base">{coupon.code}</p>
                                <p className="text-xs text-gray-500">{typeInfo.label} · {formatValue(coupon)}</p>
                              </div>
                            </div>
                             <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={coupon.active}
                                  onChange={() => handleToggle(coupon)}
                                  className="sr-only peer"
                                />
                                <div className={`w-9 h-5 rounded-full transition-colors ${coupon.active ? "bg-rose-500" : "bg-gray-300"} relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${coupon.active ? "after:translate-x-4" : ""}`}></div>
                              </label>
                              <button
                                onClick={() => handleEdit(coupon)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-gray-300 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <i className="ri-pencil-line text-sm"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(coupon.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {coupon.description && (
                            <p className="text-xs text-gray-500 mb-3 italic">{coupon.description}</p>
                          )}

                          <div className="flex flex-wrap gap-2 text-xs">
                             {coupon.applies_to && coupon.applies_to !== "all" && (
                              <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full font-medium">
                                <i className="ri-filter-3-line mr-1"></i>
                                {coupon.applies_to === "services" ? `${coupon.target_ids?.length || 0} serv.` : coupon.applies_to === "products" ? `${coupon.target_ids?.length || 0} prod.` : "Categoría"}
                              </span>
                            )}
                            <span className="px-2.5 py-1 bg-gray-50 rounded-full text-gray-600">
                              <i className="ri-bar-chart-line mr-1"></i>
                              {coupon.uses_count} uso{coupon.uses_count !== 1 ? "s" : ""}
                              {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                            </span>
                            {coupon.min_purchase > 0 && (
                              <span className="px-2.5 py-1 bg-gray-50 rounded-full text-gray-600">
                                Mín. {Number(coupon.min_purchase).toFixed(2)} €
                              </span>
                            )}
                            {coupon.expires_at && (
                              <span className={`px-2.5 py-1 rounded-full ${isExpired ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-600"}`}>
                                <i className="ri-calendar-line mr-1"></i>
                                {isExpired ? "Expirado" : `Hasta ${new Date(coupon.expires_at).toLocaleDateString("es-ES")}`}
                              </span>
                            )}
                          </div>

                          {usagePct !== null && (
                            <div className="mt-3">
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${usagePct >= 100 ? "bg-red-400" : "bg-rose-400"}`}
                                  style={{ width: `${Math.min(usagePct, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

function formatValue(coupon: Coupon): string {
  if (coupon.type === "percentage") return `${coupon.value}% dto.`;
  if (coupon.type === "fixed") return `${Number(coupon.value).toFixed(2)} € dto.`;
  return `${coupon.value} pts → ${(coupon.value / 100).toFixed(2)} €`;
}
