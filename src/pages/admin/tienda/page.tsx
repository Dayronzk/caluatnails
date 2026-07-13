import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "@/pages/admin/components/AdminSidebar";
import { ShoppingBag, Plus, Package, Star, TrendingUp, X, Search } from "lucide-react";

interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string;
  reward_points: number;
  active: boolean;
  created_at: string;
}

interface ShopOrder {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  delivery_type: string;
  delivery_address: string | null;
  items: { product_id: string; name: string; qty: number; price: number }[];
  total_price: number;
  points_earned: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const CATEGORIES = ["General", "Kits", "Herramientas", "Equipos", "Geles", "Esmaltes", "Accesorios"];

const EMPTY_PRODUCT = {
  name: "", description: "", price: 0, stock: 0,
  image_url: "", category: "General", reward_points: 0, active: true,
};

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-50 text-amber-600" },
  processing: { label: "Procesando", color: "bg-teal-50 text-teal-600" },
  shipped: { label: "Enviado", color: "bg-indigo-50 text-indigo-600" },
  delivered: { label: "Entregado", color: "bg-emerald-50 text-emerald-600" },
  cancelled: { label: "Cancelado", color: "bg-red-50 text-red-500" },
};

type AdminTab = "products" | "orders";

export default function AdminTiendaPage() {
  const [tab, setTab] = useState<AdminTab>("products");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  // Product modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const ext = file.name.split(".").pop();
    const fileName = `product_${Date.now()}.${ext}`;
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

  // Order detail
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase
      .from("shop_products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts((data ?? []) as ShopProduct[]);
  }, []);

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from("shop_orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as ShopOrder[]);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadProducts(), loadOrders()]);
      setLoading(false);
    };
    load();
  }, [loadProducts, loadOrders]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setShowModal(true);
  };

  const openEdit = (p: ShopProduct) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description ?? "",
      price: p.price, stock: p.stock,
      image_url: p.image_url ?? "", category: p.category,
      reward_points: p.reward_points, active: p.active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      image_url: form.image_url || null,
      description: form.description || null,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from("shop_products").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("shop_products").insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    await loadProducts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("shop_products").update({ active: false }).eq("id", id);
    setDeleteConfirm(null);
    await loadProducts();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingStatus(true);
    await supabase.from("shop_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
    await loadOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status } : null);
    }
    setUpdatingStatus(false);
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_price), 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tienda</h1>
            <p className="text-gray-500 text-sm mt-1">Gestiona productos, pedidos y puntos de recompensa</p>
          </div>
          {tab === "products" && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />Nuevo producto
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Productos activos", value: products.filter(p => p.active).length, icon: <Package className="w-5 h-5" />, color: "text-rose-500 bg-rose-50" },
            { label: "Pedidos totales", value: orders.length, icon: <ShoppingBag className="w-5 h-5" />, color: "text-teal-500 bg-teal-50" },
            { label: "Pedidos pendientes", value: pendingOrders, icon: <TrendingUp className="w-5 h-5" />, color: "text-amber-500 bg-amber-50" },
            { label: "Ingresos tienda", value: `€${totalRevenue.toFixed(2)}`, icon: <Star className="w-5 h-5" />, color: "text-emerald-500 bg-emerald-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{loading ? "—" : s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {[
            { key: "products" as AdminTab, label: "Productos", icon: "ri-store-line" },
            { key: "orders" as AdminTab, label: "Pedidos", icon: "ri-shopping-bag-line" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${tab === t.key ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              <i className={t.icon}></i>{t.label}
              {t.key === "orders" && pendingOrders > 0 && (
                <span className="bg-amber-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingOrders}</span>
              )}
            </button>
          ))}
        </div>

        {/* PRODUCTS TAB */}
        {tab === "products" && (
          <div>
            {/* Filters */}
            <div className="flex gap-3 mb-5 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none w-52"
                />
              </div>
              <select
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none bg-white cursor-pointer"
              >
                <option value="all">Todas las categorías</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(p => (
                  <div key={p.id} className={`bg-white rounded-2xl border overflow-hidden ${p.active ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
                    {/* Image */}
                    <div className="w-full h-44 bg-gray-50 relative overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-200" />
                        </div>
                      )}
                      {!p.active && (
                        <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                          <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full">Inactivo</span>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-gray-700">{p.category}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{p.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-gray-900">€{Number(p.price).toFixed(2)}</span>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <i className="ri-box-3-line"></i>{p.stock} uds
                          </span>
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <i className="ri-coin-line"></i>+{p.reward_points} pts
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <i className="ri-edit-line mr-1"></i>Editar
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">No hay productos con estos filtros</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">Aún no hay pedidos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="px-6 py-4 font-medium">Cliente</th>
                      <th className="px-4 py-4 font-medium">Entrega</th>
                      <th className="px-4 py-4 font-medium">Productos</th>
                      <th className="px-4 py-4 font-medium">Total</th>
                      <th className="px-4 py-4 font-medium">Estado</th>
                      <th className="px-4 py-4 font-medium">Fecha</th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map(order => {
                      const st = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending;
                      return (
                        <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{order.client_name}</p>
                            <p className="text-xs text-gray-400">{order.client_email}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${order.delivery_type === "pickup" ? "bg-teal-50 text-teal-600" : "bg-rose-50 text-rose-600"}`}>
                              <i className={`${order.delivery_type === "pickup" ? "ri-store-line" : "ri-truck-line"} mr-1`}></i>
                              {order.delivery_type === "pickup" ? "Recogida" : "Envío"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-600 text-xs">
                            {(order.items ?? []).length} producto{(order.items ?? []).length !== 1 ? "s" : ""}
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-900">€{Number(order.total_price).toFixed(2)}</td>
                          <td className="px-4 py-4">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-xs font-medium text-rose-500 hover:text-rose-700 cursor-pointer whitespace-nowrap"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Product modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900">{editing ? "Editar producto" : "Nuevo producto"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej. Kit Iniciación Manicura"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} maxLength={500} placeholder="Describe el producto..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Imagen del producto</label>
                {/* Upload button */}
                <label className="flex items-center gap-3 w-full border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-rose-300 hover:bg-rose-50/40 transition-all group">
                  <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-rose-100 transition-colors shrink-0">
                    <i className="ri-upload-cloud-line text-gray-400 group-hover:text-rose-500 text-lg"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-rose-600 transition-colors">
                      {uploadingImage ? "Subiendo imagen..." : "Subir imagen"}
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG, WEBP · máx. 5 MB</p>
                  </div>
                  {uploadingImage && <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin shrink-0" />}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
                {/* Or URL */}
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">o pega una URL</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <input type="url" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
                {form.image_url && (
                  <div className="mt-2 w-full h-36 rounded-xl overflow-hidden border border-gray-100 relative">
                    <img src={form.image_url} alt="preview" className="w-full h-full object-cover object-top" />
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, image_url: "" }))}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 cursor-pointer"
                    >
                      <i className="ri-close-line text-gray-500 text-sm"></i>
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Precio (€) *</label>
                  <input type="number" min={0} step={0.5} value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock (unidades)</label>
                  <input type="number" min={0} value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Categoría</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white cursor-pointer">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Puntos de recompensa <span className="text-amber-500 font-normal">al comprar</span>
                  </label>
                  <input type="number" min={0} value={form.reward_points} onChange={e => setForm(p => ({ ...p, reward_points: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <button onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.active ? "bg-rose-500" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.active ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className="text-sm text-gray-700">Producto activo (visible en tienda)</span>
              </div>
              {form.reward_points > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-3">
                  <i className="ri-coin-line text-amber-500"></i>
                  <p className="text-xs text-amber-700">
                    El cliente recibirá <strong>+{form.reward_points} puntos</strong> al completar la compra de este producto.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors">
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear producto"}
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
            <h3 className="text-center font-bold text-gray-900 mb-2">¿Desactivar producto?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">El producto dejará de mostrarse en la tienda. Puedes reactivarlo editándolo.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold cursor-pointer transition-colors">Desactivar</button>
            </div>
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900">Detalle del pedido</h2>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Client */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Cliente</p>
                <p className="font-semibold text-gray-900">{selectedOrder.client_name}</p>
                <p className="text-sm text-gray-500">{selectedOrder.client_email}</p>
                {selectedOrder.client_phone && <p className="text-sm text-gray-500">{selectedOrder.client_phone}</p>}
              </div>

              {/* Delivery */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Tipo de entrega</p>
                <div className="flex items-center gap-2">
                  <i className={`${selectedOrder.delivery_type === "pickup" ? "ri-store-line text-teal-500" : "ri-truck-line text-rose-500"}`}></i>
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.delivery_type === "pickup" ? "Recogida en centro" : "Envío a domicilio"}
                  </p>
                </div>
                {selectedOrder.delivery_address && (
                  <p className="text-sm text-gray-500 mt-1">{selectedOrder.delivery_address}</p>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Productos</p>
                <div className="space-y-2">
                  {(selectedOrder.items ?? []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400">x{item.qty} · €{Number(item.price).toFixed(2)} c/u</p>
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">€{(item.qty * Number(item.price)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 mt-2">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">€{Number(selectedOrder.total_price).toFixed(2)}</span>
                </div>
                {selectedOrder.points_earned > 0 && (
                  <div className="flex items-center gap-2 mt-2 bg-amber-50 rounded-xl px-3 py-2">
                    <i className="ri-coin-line text-amber-500 text-sm"></i>
                    <p className="text-xs text-amber-700">+{selectedOrder.points_earned} puntos acreditados al cliente</p>
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Notas</p>
                  <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status update */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Actualizar estado</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ORDER_STATUS).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, key)}
                      disabled={updatingStatus || selectedOrder.status === key}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap ${selectedOrder.status === key ? val.color + " ring-2 ring-offset-1 ring-current" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
