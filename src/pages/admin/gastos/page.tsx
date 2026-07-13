import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "@/pages/admin/components/AdminSidebar";
import {
  Wallet, Plus, Search, X, TrendingDown, Calendar,
  Package, UserCog, Building2, Sparkles, Ticket, Coins,
  Banknote, CreditCard, Smartphone, FileText, Filter, Trash2,
} from "lucide-react";

interface Expense {
  id: string;
  expense_date: string;
  category: string;
  subcategory: string | null;
  description: string;
  amount: number;
  payment_method: string;
  vendor: string | null;
  inventory_id: string | null;
  related_user_id: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurring_period: string | null;
  created_at: string;
}

interface InventoryRef { id: string; name: string; }

interface ExpenseItem {
  id?: string;
  inventory_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}
interface ProfileRef { id: string; name: string | null; email: string; }

interface CouponUsage {
  id: string;
  used_at: string;
  user_id: string | null;
  coupon: { code: string; type: string; value: number } | null;
}

interface PointsTx {
  id: string;
  client_account_id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
  client_accounts?: {
    name: string;
    phone: string;
  } | null;
}

const CATEGORIES = [
  { value: "compra_inventario", label: "Compra de inventario", icon: Package, color: "text-sky-500 bg-sky-50" },
  { value: "mantenimiento", label: "Mantenimiento (afilado, reparaciones)", icon: Sparkles, color: "text-amber-500 bg-amber-50" },
  { value: "nominas", label: "Nóminas / Personal", icon: UserCog, color: "text-violet-500 bg-violet-50" },
  { value: "alquiler", label: "Alquiler / Local", icon: Building2, color: "text-rose-500 bg-rose-50" },
  { value: "suministros", label: "Suministros (luz, agua, internet)", icon: FileText, color: "text-teal-500 bg-teal-50" },
  { value: "marketing", label: "Marketing / Publicidad", icon: Sparkles, color: "text-pink-500 bg-pink-50" },
  { value: "formacion", label: "Formación", icon: FileText, color: "text-indigo-500 bg-indigo-50" },
  { value: "impuestos", label: "Impuestos / Tasas", icon: FileText, color: "text-gray-500 bg-gray-50" },
  { value: "otros", label: "Otros", icon: Wallet, color: "text-slate-500 bg-slate-50" },
] as const;

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo", icon: Banknote },
  { value: "tarjeta", label: "Tarjeta", icon: CreditCard },
  { value: "transferencia", label: "Transferencia", icon: Building2 },
  { value: "bizum", label: "Bizum", icon: Smartphone },
  { value: "otro", label: "Otro", icon: Wallet },
] as const;

const EMPTY_FORM = {
  expense_date: new Date().toISOString().slice(0, 10),
  category: "compra_inventario",
  subcategory: "",
  description: "",
  amount: 0,
  payment_method: "efectivo",
  vendor: "",
  inventory_id: null as string | null,
  related_user_id: null as string | null,
  notes: "",
  is_recurring: false,
  recurring_period: "mensual",
};

type Tab = "manual" | "descuentos" | "puntos";

export default function AdminGastosPage() {
  const [tab, setTab] = useState<Tab>("manual");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryRef[]>([]);
  const [staff, setStaff] = useState<ProfileRef[]>([]);
  const [couponUses, setCouponUses] = useState<CouponUsage[]>([]);
  const [pointsTx, setPointsTx] = useState<PointsTx[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Auto-calculate total from items when items change
  const itemsTotal = useMemo(() => items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0), [items]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [exp, inv, prof, cou, pts] = await Promise.all([
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
      supabase.from("inventory").select("id, name").eq("active", true).order("name"),
      supabase.from("profiles").select("id, name, email").order("name"),
      supabase.from("coupon_uses").select("id, used_at, user_id, coupon:coupons(code, type, value)").order("used_at", { ascending: false }),
      supabase.from("client_points_transactions").select("*, client_accounts(name, phone)").eq("type", "redeemed").order("created_at", { ascending: false }),
    ]);
    setExpenses((exp.data ?? []) as Expense[]);
    setInventory((inv.data ?? []) as InventoryRef[]);
    setStaff((prof.data ?? []) as ProfileRef[]);
    setCouponUses((cou.data ?? []) as unknown as CouponUsage[]);
    setPointsTx((pts.data ?? []) as PointsTx[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setItems([]);
    setShowModal(true);
  };

  const openEdit = async (e: Expense) => {
    setEditing(e);
    setForm({
      expense_date: e.expense_date,
      category: e.category,
      subcategory: e.subcategory ?? "",
      description: e.description,
      amount: e.amount,
      payment_method: e.payment_method,
      vendor: e.vendor ?? "",
      inventory_id: e.inventory_id,
      related_user_id: e.related_user_id,
      notes: e.notes ?? "",
      is_recurring: e.is_recurring,
      recurring_period: e.recurring_period ?? "mensual",
    });
    // Load expense items
    const { data: existingItems } = await supabase
      .from("expense_items")
      .select("id, inventory_id, item_name, quantity, unit_price, notes")
      .eq("expense_id", e.id)
      .order("created_at");
    setItems((existingItems ?? []) as ExpenseItem[]);
    setShowModal(true);
  };

  // Item helpers
  const addItem = () => {
    setItems(prev => [...prev, { inventory_id: null, item_name: "", quantity: 1, unit_price: 0 }]);
  };
  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };
  const updateItem = (idx: number, patch: Partial<ExpenseItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const handleSave = async () => {
    // If items exist, use itemsTotal as amount; else require manual amount > 0
    const hasItems = items.length > 0 && items.some(i => i.item_name.trim() && i.quantity > 0);
    const finalAmount = hasItems ? itemsTotal : form.amount;
    if (!form.description.trim() || finalAmount <= 0) return;
    setSaving(true);
    const payload = {
      expense_date: form.expense_date,
      category: form.category,
      subcategory: form.subcategory || null,
      description: form.description.trim(),
      amount: finalAmount,
      payment_method: form.payment_method,
      vendor: form.vendor || null,
      // For backward compatibility, keep inventory_id with first item if any
      inventory_id: hasItems ? (items[0].inventory_id ?? null) : form.inventory_id,
      related_user_id: form.related_user_id,
      notes: form.notes || null,
      is_recurring: form.is_recurring,
      recurring_period: form.is_recurring ? form.recurring_period : null,
      updated_at: new Date().toISOString(),
    };

    let expenseId = editing?.id;
    if (editing) {
      await supabase.from("expenses").update(payload).eq("id", editing.id);
    } else {
      const { data: created } = await supabase.from("expenses").insert(payload).select("id").single();
      expenseId = created?.id;
    }

    // Sync items: delete existing and insert new ones
    if (expenseId) {
      await supabase.from("expense_items").delete().eq("expense_id", expenseId);
      const validItems = items.filter(i => i.item_name.trim() && i.quantity > 0);
      if (validItems.length > 0) {
        await supabase.from("expense_items").insert(
          validItems.map(i => ({
            expense_id: expenseId,
            inventory_id: i.inventory_id,
            item_name: i.item_name.trim(),
            quantity: i.quantity,
            unit_price: i.unit_price,
            notes: i.notes || null,
          }))
        );
      }
    }

    setSaving(false);
    setShowModal(false);
    await loadAll();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    setDeleteConfirm(null);
    await loadAll();
  };

  // Filtered expenses by month + search + category
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (filterMonth && !e.expense_date.startsWith(filterMonth)) return false;
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.vendor?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [expenses, filterMonth, filterCategory, search]);

  const filteredCouponUses = useMemo(() => {
    return couponUses.filter(c => filterMonth ? c.used_at.startsWith(filterMonth) : true);
  }, [couponUses, filterMonth]);

  const filteredPoints = useMemo(() => {
    return pointsTx.filter(p => filterMonth ? p.created_at.startsWith(filterMonth) : true);
  }, [pointsTx, filterMonth]);

  // Stats
  const totalManual = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalDiscounts = filteredCouponUses.reduce((s, c) => {
    if (!c.coupon) return s;
    return s + (c.coupon.type === "fixed" ? Number(c.coupon.value) : 0);
  }, 0);
  const totalPoints = filteredPoints.reduce((s, p) => s + Math.abs(p.points), 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const catInfo = (val: string) => CATEGORIES.find(c => c.value === val) ?? CATEGORIES[CATEGORIES.length - 1];
  const payInfo = (val: string) => PAYMENT_METHODS.find(p => p.value === val) ?? PAYMENT_METHODS[0];

  const monthLabel = filterMonth
    ? new Date(filterMonth + "-01").toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    : "Todos";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
            <p className="text-gray-500 text-sm mt-1">Registro de gastos del centro · {monthLabel}</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />Nuevo gasto
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Gastos manuales", value: `€${totalManual.toFixed(2)}`, icon: <TrendingDown className="w-5 h-5" />, color: "text-rose-500 bg-rose-50" },
            { label: "Descuentos cupones", value: `€${totalDiscounts.toFixed(2)}`, icon: <Ticket className="w-5 h-5" />, color: "text-amber-500 bg-amber-50" },
            { label: "Puntos canjeados", value: totalPoints.toLocaleString() + " pts", icon: <Coins className="w-5 h-5" />, color: "text-violet-500 bg-violet-50" },
            { label: "Total mes", value: `€${(totalManual + totalDiscounts).toFixed(2)}`, icon: <Wallet className="w-5 h-5" />, color: "text-emerald-500 bg-emerald-50" },
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
            { key: "manual" as Tab, label: "Gastos manuales", count: filteredExpenses.length },
            { key: "descuentos" as Tab, label: "Descuentos cupones", count: filteredCouponUses.length },
            { key: "puntos" as Tab, label: "Puntos canjeados", count: filteredPoints.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${tab === t.key ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-rose-100 text-rose-600" : "bg-gray-200 text-gray-500"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="month"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none bg-white cursor-pointer"
            />
          </div>
          {tab === "manual" && (
            <>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar gasto..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none w-52"
                />
              </div>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none bg-white cursor-pointer"
              >
                <option value="all">Todas las categorías</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </>
          )}
        </div>

        {/* By category mini chart */}
        {tab === "manual" && byCategory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribución por categoría</h3>
            <div className="space-y-2">
              {byCategory.map(([cat, amount]) => {
                const ci = catInfo(cat);
                const Icon = ci.icon;
                const pct = totalManual > 0 ? (amount / totalManual) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ci.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 truncate">{ci.label}</span>
                        <span className="text-xs font-semibold text-gray-900">€{amount.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MANUAL TAB */}
        {tab === "manual" && (
          loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">No hay gastos registrados en este periodo</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="px-5 py-4 font-medium">Fecha</th>
                      <th className="px-4 py-4 font-medium">Categoría</th>
                      <th className="px-4 py-4 font-medium">Descripción</th>
                      <th className="px-4 py-4 font-medium">Pago</th>
                      <th className="px-4 py-4 font-medium text-right">Importe</th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredExpenses.map(e => {
                      const ci = catInfo(e.category);
                      const pi = payInfo(e.payment_method);
                      const Icon = ci.icon;
                      const PIcon = pi.icon;
                      return (
                        <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-gray-700 font-medium">
                              {new Date(e.expense_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(e.expense_date).toLocaleDateString("es-ES", { weekday: "short" })}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${ci.color}`}>
                              <Icon className="w-3 h-3" />
                              {ci.label.split(" ")[0]}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-900">{e.description}</p>
                            {e.vendor && <p className="text-xs text-gray-400">{e.vendor}</p>}
                            {e.is_recurring && (
                              <span className="inline-block mt-1 text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">
                                Recurrente · {e.recurring_period}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                              <PIcon className="w-3 h-3" />{pi.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-bold text-gray-900">€{Number(e.amount).toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEdit(e)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                              >
                                <i className="ri-edit-line text-sm"></i>
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(e.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
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
          )
        )}

        {/* COUPONS TAB */}
        {tab === "descuentos" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filteredCouponUses.length === 0 ? (
              <div className="text-center py-16">
                <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No se han usado cupones en este periodo</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="px-5 py-4 font-medium">Fecha</th>
                    <th className="px-4 py-4 font-medium">Cupón</th>
                    <th className="px-4 py-4 font-medium">Tipo</th>
                    <th className="px-4 py-4 font-medium text-right">Descuento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCouponUses.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(c.used_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs font-bold text-rose-600">
                        {c.coupon?.code ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-500">
                          {c.coupon?.type === "percentage" ? `Porcentaje ${c.coupon.value}%` : c.coupon?.type === "fixed" ? "Fijo" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-amber-600">
                        {c.coupon?.type === "fixed" ? `-€${Number(c.coupon.value).toFixed(2)}` : `-${c.coupon?.value ?? 0}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* POINTS TAB */}
        {tab === "puntos" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filteredPoints.length === 0 ? (
              <div className="text-center py-16">
                <Coins className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No hay puntos canjeados en este periodo</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="px-5 py-4 font-medium">Fecha</th>
                    <th className="px-4 py-4 font-medium">Descripción</th>
                    <th className="px-4 py-4 font-medium text-right">Puntos canjeados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPoints.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(p.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-4 text-gray-800">
                        <p className="font-medium">{p.description}</p>
                        {p.client_accounts?.name && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Cliente: <strong className="text-gray-600">{p.client_accounts.name}</strong> ({p.client_accounts.phone})
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-violet-600">
                        {Math.abs(p.points).toLocaleString()} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">{editing ? "Editar gasto" : "Nuevo gasto"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Date + Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha *</label>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Importe (€) *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.amount || ""}
                    onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 font-semibold"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Categoría *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => {
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.value}
                        onClick={() => setForm(p => ({ ...p, category: c.value }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer text-left ${
                          form.category === c.value
                            ? "border-rose-300 bg-rose-50 text-rose-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder={
                    form.category === "compra_inventario" ? "Ej. Caja de esmaltes Semilac" :
                    form.category === "mantenimiento" ? "Ej. Afilado de cortacutículas" :
                    form.category === "nominas" ? "Ej. Nómina mensual de empleada" :
                    "Describe el gasto..."
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Vendor + Payment method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Proveedor / Origen</label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Método de pago</label>
                  <select
                    value={form.payment_method}
                    onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white cursor-pointer"
                  >
                    {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Multi-item linker (only if compra_inventario) */}
              {form.category === "compra_inventario" && (
                <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-bold text-gray-900">Artículos comprados</label>
                      <p className="text-xs text-gray-500">Añade los artículos con cantidad y precio unitario</p>
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-full transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
                      <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aún no hay artículos. Haz click en "Añadir" para empezar.</p>
                      <p className="text-xs text-gray-400 mt-1">O introduce el importe total manualmente arriba.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center mt-1">
                              {idx + 1}
                            </span>
                            <div className="flex-1 space-y-2">
                              {/* Item name + inventory link */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={item.item_name}
                                  onChange={(e) => updateItem(idx, { item_name: e.target.value })}
                                  placeholder="Nombre del artículo"
                                  className="px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 outline-none text-sm"
                                />
                                {inventory.length > 0 && (
                                  <select
                                    value={item.inventory_id ?? ""}
                                    onChange={(e) => {
                                      const id = e.target.value || null;
                                      const matched = inventory.find(i => i.id === id);
                                      updateItem(idx, {
                                        inventory_id: id,
                                        // Auto-fill item name if matched and field empty
                                        item_name: matched && !item.item_name.trim() ? matched.name : item.item_name,
                                      });
                                    }}
                                    className="px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 bg-white outline-none text-sm cursor-pointer"
                                  >
                                    <option value="">— Sin vincular a inventario —</option>
                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                  </select>
                                )}
                              </div>

                              {/* Quantity + unit price + subtotal */}
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Cantidad</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Precio/unidad (€)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unit_price}
                                    onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Subtotal</label>
                                  <div className="px-3 py-2 rounded-lg bg-gray-50 text-sm font-semibold text-gray-900">
                                    €{(item.quantity * item.unit_price).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="shrink-0 w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 cursor-pointer"
                              title="Eliminar artículo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Total summary */}
                      <div className="flex items-center justify-between bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 mt-2">
                        <span className="text-sm font-semibold text-rose-700">
                          Total ({items.length} {items.length === 1 ? "artículo" : "artículos"})
                        </span>
                        <span className="text-lg font-bold text-rose-700">€{itemsTotal.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        💡 El importe total del gasto se calculará automáticamente sumando todos los subtotales.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Linked staff member (only if nominas) */}
              {form.category === "nominas" && staff.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Empleado/a (opcional)</label>
                  <select
                    value={form.related_user_id ?? ""}
                    onChange={e => setForm(p => ({ ...p, related_user_id: e.target.value || null }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white cursor-pointer"
                  >
                    <option value="">Sin vincular</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name ?? s.email}</option>)}
                  </select>
                </div>
              )}

              {/* Recurring */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setForm(p => ({ ...p, is_recurring: !p.is_recurring }))}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.is_recurring ? "bg-rose-500" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.is_recurring ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-sm text-gray-700">Gasto recurrente (alquiler, nómina, suministros...)</span>
                </div>
                {form.is_recurring && (
                  <select
                    value={form.recurring_period}
                    onChange={e => setForm(p => ({ ...p, recurring_period: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-rose-400 bg-white cursor-pointer"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notas internas</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Observaciones, número de factura, etc."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.description.trim() || form.amount <= 0}
                className="px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors">
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar gasto"}
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
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-2">¿Eliminar gasto?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold cursor-pointer transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
