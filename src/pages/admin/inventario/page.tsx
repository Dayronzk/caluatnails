import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "@/pages/admin/components/AdminSidebar";
import {
  Package, Plus, Search, X, AlertTriangle, Copy,
  Droplets, Wrench, Sparkles, Monitor, Filter,
  ArrowUpDown, TrendingDown, Archive,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  type: "insumo" | "herramienta" | "equipo" | "decoracion";
  category: string;
  brand: string | null;
  sku: string | null;
  quantity: number;
  unit: string;
  min_stock: number;
  cost_price: number;
  sell_price: number | null;
  image_url: string | null;
  active: boolean;
  notes: string | null;
  expiry_date: string | null;
  location: string | null;
  last_restock_at: string | null;
  usage_capacity: number | null;
  usage_unit: string;
  pack_size: number | null;
  pack_unit: string | null;
  created_at: string;
  updated_at: string;
}

const USAGE_UNITS = ["usos", "servicios", "aplicaciones", "manicuras", "pedicuras", "ml", "gr", "días", "semanas", "meses"];

const TYPES = [
  { value: "insumo", label: "Insumo", icon: Droplets, color: "text-sky-500 bg-sky-50" },
  { value: "herramienta", label: "Herramienta", icon: Wrench, color: "text-amber-500 bg-amber-50" },
  { value: "equipo", label: "Equipo", icon: Monitor, color: "text-violet-500 bg-violet-50" },
  { value: "decoracion", label: "Decoración", icon: Sparkles, color: "text-pink-500 bg-pink-50" },
] as const;

const CATEGORIES: Record<string, string[]> = {
  insumo: [
    "Esmaltes permanentes", "Esmaltes tradicionales", "Geles de construcción",
    "Acrílico (polvo/líquido)", "Bases y top coats", "Primers y deshidratadores",
    "Removedores y acetona", "Aceites cutícula", "Cremas y lociones",
    "Algodón y celulosas", "Tips y moldes", "Fibra de vidrio/seda",
  ],
  herramienta: [
    "Limas y bloques", "Empujadores de cutícula", "Alicates y tijeras",
    "Pinceles de diseño", "Dotting tools", "Brochas de limpieza",
    "Separadores de dedos", "Pinzas", "Cortauñas",
  ],
  equipo: [
    "Lámparas UV/LED", "Tornos/fresadoras", "Esterilizadores",
    "Aspiradores de polvo", "Calentadores de cera/parafina", "Secadores",
  ],
  decoracion: [
    "Glitters y purpurinas", "Foils", "Stickers y calcomanías",
    "Piedras y cristales", "Stamping (placas/sellos)", "Pigmentos y chromes",
    "Hilos y cintas", "Flores secas", "Charms 3D",
  ],
};

const UNITS = ["unidades", "ml", "gr", "oz", "pares", "sets", "cajas", "botes"];

type InvType = "insumo" | "herramienta" | "equipo" | "decoracion";

const EMPTY_FORM = {
  name: "",
  description: "",
  type: "insumo" as InvType,
  category: "",
  brand: "",
  sku: "",
  quantity: "0" as string | number,
  unit: "unidades",
  min_stock: "0" as string | number,
  cost_price: "0" as string | number,
  sell_price: "" as string | number | null,
  image_url: "",
  active: true,
  notes: "",
  expiry_date: "",
  location: "",
  usage_capacity: "" as string | number | null,
  usage_unit: "usos",
  pack_size: "" as string | number | null,
  pack_unit: "",
};

type SortField = "name" | "quantity" | "cost_price" | "updated_at";
type SortDir = "asc" | "desc";

export default function AdminInventarioPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStock, setFilterStock] = useState<"all" | "low" | "out">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showInactive, setShowInactive] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Restock modal
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(0);

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as InventoryItem[]);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadItems().finally(() => setLoading(false));
  }, [loadItems]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const ext = file.name.split(".").pop();
    const fileName = `inventory_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("shop-images")
      .upload(fileName, file, { upsert: true });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("shop-images").getPublicUrl(data.path);
      setForm(p => ({ ...p, image_url: urlData.publicUrl }));
    }
    setUploadingImage(false);
    e.target.value = "";
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      type: item.type,
      category: item.category,
      brand: item.brand ?? "",
      sku: item.sku ?? "",
      quantity: String(item.quantity),
      unit: item.unit,
      min_stock: String(item.min_stock),
      cost_price: String(item.cost_price),
      sell_price: item.sell_price !== null ? String(item.sell_price) : "",
      image_url: item.image_url ?? "",
      active: item.active,
      notes: item.notes ?? "",
      expiry_date: item.expiry_date ?? "",
      location: item.location ?? "",
      usage_capacity: item.usage_capacity !== null ? String(item.usage_capacity) : "",
      usage_unit: item.usage_unit ?? "usos",
      pack_size: item.pack_size !== null && item.pack_size !== undefined ? String(item.pack_size) : "",
      pack_unit: item.pack_unit ?? "",
    });
    setShowModal(true);
  };

  const handleDuplicate = (item: InventoryItem) => {
    setEditing(null);
    setForm({
      name: `${item.name} (copia)`,
      description: item.description ?? "",
      type: item.type,
      category: item.category,
      brand: item.brand ?? "",
      sku: "",
      quantity: "0",
      unit: item.unit,
      min_stock: String(item.min_stock),
      cost_price: String(item.cost_price),
      sell_price: item.sell_price !== null ? String(item.sell_price) : "",
      image_url: item.image_url ?? "",
      active: true,
      notes: item.notes ?? "",
      expiry_date: "",
      location: item.location ?? "",
      usage_capacity: item.usage_capacity !== null ? String(item.usage_capacity) : "",
      usage_unit: item.usage_unit ?? "usos",
      pack_size: item.pack_size !== null && item.pack_size !== undefined ? String(item.pack_size) : "",
      pack_unit: item.pack_unit ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      type: form.type,
      category: form.category || (CATEGORIES[form.type]?.[0] ?? "general"),
      brand: form.brand || null,
      sku: form.sku || null,
      quantity: Number(form.quantity) || 0,
      unit: form.unit,
      min_stock: Number(form.min_stock) || 0,
      cost_price: Number(form.cost_price) || 0,
      sell_price: form.sell_price !== "" ? Number(form.sell_price) : null,
      image_url: form.image_url || null,
      active: form.active,
      notes: form.notes || null,
      expiry_date: form.expiry_date || null,
      location: form.location || null,
      usage_capacity: form.usage_capacity !== "" ? Number(form.usage_capacity) : null,
      usage_unit: form.usage_unit || "usos",
      pack_size: form.pack_size !== "" && form.pack_size !== null ? Number(form.pack_size) : null,
      pack_unit: form.pack_unit?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from("inventory").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("inventory").insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    await loadItems();
  };

  const handleDeactivate = async (id: string) => {
    await supabase.from("inventory").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id);
    setDeleteConfirm(null);
    await loadItems();
  };

  const handleRestock = async () => {
    if (!restockItem || restockQty <= 0) return;
    const newQty = restockItem.quantity + restockQty;
    await supabase.from("inventory").update({
      quantity: newQty,
      last_restock_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", restockItem.id);
    setRestockItem(null);
    setRestockQty(0);
    await loadItems();
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = items
    .filter(i => showInactive ? !i.active : i.active)
    .filter(i => {
      if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.brand?.toLowerCase().includes(search.toLowerCase()) && !i.sku?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && i.type !== filterType) return false;
      if (filterStock === "low" && i.quantity > i.min_stock) return false;
      if (filterStock === "out" && i.quantity > 0) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      if (sortField === "quantity") return (a.quantity - b.quantity) * dir;
      if (sortField === "cost_price") return (a.cost_price - b.cost_price) * dir;
      return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * dir;
    });

  const totalItems = items.filter(i => i.active).length;
  const lowStock = items.filter(i => i.active && i.quantity > 0 && i.quantity <= i.min_stock).length;
  const outOfStock = items.filter(i => i.active && i.quantity === 0).length;
  const totalValue = items.filter(i => i.active).reduce((s, i) => s + i.cost_price * i.quantity, 0);

  const typeInfo = (type: string) => TYPES.find(t => t.value === type) ?? TYPES[0];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-500 text-sm mt-1">Gestión de insumos, herramientas y equipos de uñas</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />Nuevo artículo
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total artículos", value: totalItems, icon: <Package className="w-5 h-5" />, color: "text-rose-500 bg-rose-50" },
            { label: "Stock bajo", value: lowStock, icon: <TrendingDown className="w-5 h-5" />, color: "text-amber-500 bg-amber-50" },
            { label: "Agotados", value: outOfStock, icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-500 bg-red-50" },
            { label: "Valor inventario", value: `€${totalValue.toFixed(2)}`, icon: <Archive className="w-5 h-5" />, color: "text-emerald-500 bg-emerald-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{loading ? "—" : s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, marca o SKU..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none w-64"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none bg-white cursor-pointer"
          >
            <option value="all">Todos los tipos</option>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={filterStock}
            onChange={e => setFilterStock(e.target.value as typeof filterStock)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none bg-white cursor-pointer"
          >
            <option value="all">Todo el stock</option>
            <option value="low">Stock bajo</option>
            <option value="out">Agotados</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer ml-auto">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
            Mostrar inactivos
          </label>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">No hay artículos con estos filtros</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="px-5 py-4 font-medium">Artículo</th>
                    <th className="px-4 py-4 font-medium">Tipo</th>
                    <th className="px-4 py-4 font-medium">Categoría</th>
                    <th className="px-4 py-4 font-medium cursor-pointer hover:text-gray-600" onClick={() => toggleSort("quantity")}>
                      <span className="flex items-center gap-1">Stock <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="px-4 py-4 font-medium cursor-pointer hover:text-gray-600" onClick={() => toggleSort("cost_price")}>
                      <span className="flex items-center gap-1">Coste <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="px-4 py-4 font-medium">Usos disponibles</th>
                    <th className="px-4 py-4 font-medium">Estado</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(item => {
                    const ti = typeInfo(item.type);
                    const Icon = ti.icon;
                    const isLow = item.quantity > 0 && item.quantity <= item.min_stock;
                    const isOut = item.quantity === 0;
                    return (
                      <tr key={item.id} className={`hover:bg-gray-50/60 transition-colors ${!item.active ? "opacity-50" : ""}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${ti.color}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-400 truncate">
                                {[item.brand, item.sku && `SKU: ${item.sku}`].filter(Boolean).join(" · ") || "Sin marca"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ti.color}`}>{ti.label}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600 max-w-[140px] truncate">{item.category}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-gray-900"}`}>
                              {item.quantity}
                            </span>
                            <span className="text-xs text-gray-400">{item.unit}</span>
                          </div>
                          {item.min_stock > 0 && (
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1">
                              <div
                                className={`h-full rounded-full transition-all ${isOut ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-emerald-400"}`}
                                style={{ width: `${Math.min(100, (item.quantity / Math.max(item.min_stock * 2, 1)) * 100)}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-600">€{Number(item.cost_price).toFixed(2)}</td>
                        <td className="px-4 py-4">
                          {item.usage_capacity ? (
                            <div>
                              <p className="font-semibold text-gray-900">
                                {(item.usage_capacity * item.quantity).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400">{item.usage_unit}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isOut ? (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-500">Agotado</span>
                          ) : isLow ? (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">Stock bajo</span>
                          ) : (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">OK</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setRestockItem(item); setRestockQty(0); }}
                              title="Reabastecer"
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(item)}
                              title="Duplicar"
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-600 transition-colors cursor-pointer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(item)}
                              title="Editar"
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                            >
                              <i className="ri-edit-line text-sm"></i>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(item.id)}
                              title="Desactivar"
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <i className="ri-delete-bin-line text-sm"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">{editing ? "Editar artículo" : "Nuevo artículo"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Tipo de artículo *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TYPES.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setForm(p => ({ ...p, type: t.value, category: CATEGORIES[t.value]?.[0] ?? "" }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                          form.type === t.value
                            ? "border-rose-300 bg-rose-50 text-rose-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />{t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name + Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Ej. Gel constructor rosa"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div className="shrink-0 pt-6">
                    <button 
                      type="button"
                      onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                      className={`relative w-12 h-6.5 rounded-full transition-all duration-300 ease-in-out cursor-pointer shadow-inner ${form.active ? "bg-rose-500 shadow-rose-200" : "bg-gray-300"}`}
                      title={form.active ? "Artículo Activo" : "Artículo Inactivo"}
                    >
                      <span className={`absolute top-1 left-1 w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${form.active ? "translate-x-5.5" : "translate-x-0"}`} />
                    </button>
                    <p className="text-[10px] font-bold text-center mt-1 text-gray-400 uppercase tracking-tighter">
                      {form.active ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Marca</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                    placeholder="Ej. Semilac, Masglo, OPI..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Detalles del artículo..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 resize-none"
                />
              </div>

              {/* Category + SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Categoría</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white cursor-pointer"
                  >
                    <option value="">Seleccionar...</option>
                    {(CATEGORIES[form.type] ?? []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">SKU / Referencia</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                    placeholder="Ej. GEL-ROSA-30ML"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Stock fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cantidad</label>
                  <input
                    type="number"
                    min={0}
                    value={form.quantity}
                    onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unidad</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white cursor-pointer"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock mínimo</label>
                  <input
                    type="number"
                    min={0}
                    value={form.min_stock}
                    onChange={e => setForm(p => ({ ...p, min_stock: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ubicación</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Estante A3"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Capacidad de uso mejorada para bolsas/cajas */}
              {/* ─── PAQUETE ─── */}
              <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                    <i className="ri-archive-2-line text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">¿Viene en paquete?</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Si lo compras por <strong>caja, blister, bolsa o rollo</strong>, indica el nombre del paquete y cuántas unidades contiene. <span className="text-gray-400">Opcional.</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">Nombre del paquete</label>
                    <input
                      type="text"
                      value={form.pack_unit ?? ""}
                      onChange={e => setForm(p => ({ ...p, pack_unit: e.target.value }))}
                      placeholder="Ej: caja, blister, rollo"
                      className="w-full border border-indigo-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 bg-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">{form.unit || 'Unidades'} por paquete</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={form.pack_size ?? ""}
                      onChange={e => setForm(p => ({ ...p, pack_size: e.target.value }))}
                      placeholder="Ej: 100"
                      className="w-full border border-indigo-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 bg-white shadow-sm font-semibold"
                    />
                  </div>
                </div>

                {form.pack_size !== "" && Number(form.pack_size) > 0 && (
                  <div className="bg-white/80 rounded-xl p-3 border border-indigo-100 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Equivalencia:</span>
                      <span className="font-bold text-indigo-600">
                        1 {form.pack_unit || 'paquete'} = {Number(form.pack_size)} {form.unit || 'uds'}
                      </span>
                    </div>
                    {Number(form.quantity) > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Stock actual en paquetes:</span>
                        <span className="font-bold text-gray-700">
                          {(Number(form.quantity) / Number(form.pack_size)).toFixed(Number(form.quantity) % Number(form.pack_size) === 0 ? 0 : 2)} {form.pack_unit || 'paq'}
                        </span>
                      </div>
                    )}
                    {Number(form.cost_price) > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Coste por {form.pack_unit || 'paquete'}:</span>
                        <span className="font-bold text-gray-700">
                          €{(Number(form.cost_price) * Number(form.pack_size)).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                    <i className="ri-calculator-line text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Contenido y Rendimiento</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Cuántos <strong>usos o servicios</strong> rinde cada unidad. Útil para calcular tu coste por cliente.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1.5">Unidades por {form.unit || 'unidad'}</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.usage_capacity ?? ""}
                      onChange={e => setForm(p => ({ ...p, usage_capacity: e.target.value }))}
                      placeholder="Ej: 50"
                      className="w-full border border-rose-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white shadow-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1.5">Se gasta por...</label>
                    <select
                      value={form.usage_unit}
                      onChange={e => setForm(p => ({ ...p, usage_unit: e.target.value }))}
                      className="w-full border border-rose-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white cursor-pointer shadow-sm"
                    >
                      {USAGE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {form.usage_capacity && form.quantity > 0 && (
                  <div className="bg-white/80 rounded-xl p-3 border border-rose-100 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Stock total para clientes:</span>
                      <span className="font-bold text-rose-600">{(form.usage_capacity * form.quantity).toLocaleString()} {form.usage_unit}</span>
                    </div>
                    {form.cost_price > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Coste por {form.usage_unit.slice(0, -1)}:</span>
                        <span className="font-bold text-gray-700">€{(Number(form.cost_price) / Number(form.usage_capacity)).toFixed(3)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Precio coste (€) *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.cost_price}
                    onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Precio venta (€)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.sell_price ?? ""}
                    onChange={e => setForm(p => ({ ...p, sell_price: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha caducidad</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Imagen</label>
                <label className="flex items-center gap-3 w-full border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-rose-300 hover:bg-rose-50/40 transition-all group">
                  <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-rose-100 transition-colors shrink-0">
                    <i className="ri-upload-cloud-line text-gray-400 group-hover:text-rose-500 text-lg"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-rose-600 transition-colors">
                      {uploadingImage ? "Subiendo imagen..." : "Subir imagen"}
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG, WEBP</p>
                  </div>
                  {uploadingImage && <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin shrink-0" />}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
                {form.image_url && (
                  <div className="mt-2 relative inline-block">
                    <img src={form.image_url} alt="preview" className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, image_url: "" }))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notas internas</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Notas internas, proveedor, observaciones..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 resize-none"
                />
              </div>


              {/* Low stock warning */}
              {form.min_stock > 0 && form.quantity <= form.min_stock && form.quantity > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">
                    La cantidad actual ({form.quantity} {form.unit}) está por debajo del stock mínimo ({form.min_stock}).
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors">
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear artículo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock modal */}
      {restockItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-1">Reabastecer</h3>
            <p className="text-center text-sm text-gray-500 mb-4">{restockItem.name}</p>
            <p className="text-center text-xs text-gray-400 mb-4">
              Stock actual: <strong className="text-gray-700">{restockItem.quantity} {restockItem.unit}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cantidad a añadir</label>
              <input
                type="number"
                min={1}
                value={restockQty || ""}
                onChange={e => setRestockQty(e.target.value ? Number(e.target.value) : 0)}
                placeholder="0"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-center text-lg font-bold focus:outline-none focus:border-emerald-400"
              />
              {restockQty > 0 && (
                <p className="text-center text-xs text-emerald-600 mt-2">
                  Nuevo stock: {restockItem.quantity + restockQty} {restockItem.unit}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRestockItem(null)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer">Cancelar</button>
              <button onClick={handleRestock} disabled={restockQty <= 0}
                className="flex-1 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50">
                Reabastecer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-delete-bin-line text-red-500 text-xl"></i>
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-2">¿Desactivar artículo?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">El artículo se ocultará del inventario activo. Puedes reactivarlo editándolo.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer">Cancelar</button>
              <button onClick={() => handleDeactivate(deleteConfirm)} className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold cursor-pointer transition-colors">Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
