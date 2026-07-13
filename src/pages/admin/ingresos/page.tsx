import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "@/pages/admin/components/AdminSidebar";
import {
  TrendingUp, Plus, Search, X, Calendar, Package,
  UserCog, Sparkles, Coins, Banknote, CreditCard,
  Smartphone, FileText, Trash2, CalendarDays, Wallet,
  Ticket, ArrowUpRight, ArrowDownRight, Layers
} from "lucide-react";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  client_email: string | null;
  client_phone: string;
  total_price: number;
  deposit_amount: number;
  deposit_paid: boolean;
  payment_method: string | null;
  status: string;
  professional_id: string | null;
  professional_name_snapshot: string | null;
  stripe_session_id: string | null;
  created_at: string;
}

interface Purchase {
  id: string;
  email: string;
  product_id: string;
  amount_total: number;
  status: string;
  created_at: string;
}

interface ManualIncome {
  id: string;
  income_date: string;
  category: string;
  subcategory: string | null;
  description: string;
  amount: number;
  payment_method: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  related_booking_id: string | null;
  related_user_id: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurring_period: string | null;
  created_at: string;
}

interface ProfileRef {
  id: string;
  name: string | null;
  email: string;
}

const INCOME_CATEGORIES = [
  { value: "venta_productos", label: "Venta de productos", icon: Package, color: "text-emerald-500 bg-emerald-50" },
  { value: "cursos", label: "Cursos / Formación", icon: Coins, color: "text-blue-500 bg-blue-50" },
  { value: "servicios_offline", label: "Servicios fuera de agenda", icon: Sparkles, color: "text-amber-500 bg-amber-50" },
  { value: "otros", label: "Otros ingresos", icon: TrendingUp, color: "text-slate-500 bg-slate-50" },
] as const;

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo", icon: Banknote },
  { value: "tarjeta", label: "Tarjeta", icon: CreditCard },
] as const;

const EMPTY_FORM = {
  income_date: new Date().toISOString().slice(0, 10),
  category: "venta_productos",
  subcategory: "",
  description: "",
  amount: 0,
  payment_method: "efectivo",
  client_name: "",
  client_phone: "",
  client_email: "",
  related_user_id: null as string | null,
  notes: "",
  is_recurring: false,
  recurring_period: "mensual",
};

type Tab = "citas" | "ventas" | "manual";
type RangeType = "day" | "week" | "month" | "year" | "custom";

export default function AdminIngresosPage() {
  const [tab, setTab] = useState<Tab>("citas");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [manualIncomes, setManualIncomes] = useState<ManualIncome[]>([]);
  const [staff, setStaff] = useState<ProfileRef[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterPro, setFilterPro] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Date range selectors
  const [rangeType, setRangeType] = useState<RangeType>("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [customStart, setCustomStart] = useState(new Date().toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10));

  // Modal manual incomes
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ManualIncome | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [bk, pc, mn, st] = await Promise.all([
      supabase.from("bookings").select("id, booking_date, booking_time, client_name, client_email, client_phone, total_price, deposit_amount, deposit_paid, payment_method, status, professional_id, professional_name_snapshot, stripe_session_id, created_at").order("booking_date", { ascending: false }),
      supabase.from("purchases").select("id, email, product_id, amount_total, status, created_at").order("created_at", { ascending: false }),
      supabase.from("incomes").select("*").order("income_date", { ascending: false }),
      supabase.from("profiles").select("id, name, email").order("name"),
    ]);

    setBookings((bk.data ?? []) as Booking[]);
    setPurchases((pc.data ?? []) as Purchase[]);
    setManualIncomes((mn.data ?? []) as ManualIncome[]);
    setStaff((st.data ?? []) as ProfileRef[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Date range calculations
  const dateRange = useMemo(() => {
    const base = new Date(selectedDate + "T12:00:00");
    let start = new Date(base);
    let end = new Date(base);

    if (rangeType === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (rangeType === "week") {
      const day = base.getDay();
      const diff = base.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(base.setDate(diff));
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (rangeType === "month") {
      start = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (rangeType === "year") {
      start = new Date(base.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(base.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      start = new Date(customStart + "T00:00:00");
      end = new Date(customEnd + "T23:59:59");
    }

    return { start, end };
  }, [rangeType, selectedDate, customStart, customEnd]);

  // Classification Helpers
  const getPaymentMethodGroup = (method: string | null) => {
    if (!method) return "efectivo";
    const m = method.toLowerCase();
    if (m === "stripe" || m === "tarjeta") return "tarjeta";
    return "efectivo";
  };

  const getBookingPaymentGroup = (b: Booking) => {
    // A booking is card-based if it was created via Stripe (has a stripe_session_id),
    // regardless of whether the deposit has been marked as paid yet.
    const isCard = b.payment_method === "stripe" && !!b.stripe_session_id;
    return isCard ? "tarjeta" : "efectivo";
  };

  const getPaymentLabel = (method: string | null) => {
    const group = getPaymentMethodGroup(method);
    const found = PAYMENT_METHODS.find(p => p.value === group);
    return found ? found.label : "Efectivo";
  };

  // Filter Bookings — only completed bookings count as income
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Date filter
      const bDate = new Date(b.booking_date + "T12:00:00");
      if (bDate < dateRange.start || bDate > dateRange.end) return false;

      // Only completed bookings count as realised income
      if (b.status !== "completed") return false;

      // Payment method filter
      if (filterPayment !== "all") {
        const group = getBookingPaymentGroup(b);
        if (group !== filterPayment) return false;
      }

      // Professional filter — support both active (UUID) and deleted (snapshot name) keys
      if (filterPro !== "all") {
        const key = b.professional_id || b.professional_name_snapshot || "sin_asignar";
        if (key !== filterPro) return false;
      }

      // Search filter
      if (search && !b.client_name.toLowerCase().includes(search.toLowerCase())) return false;

      return true;
    });
  }, [bookings, dateRange, filterPayment, filterPro, search]);

  // Filter Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      // Date filter
      const pDate = new Date(p.created_at);
      if (pDate < dateRange.start || pDate > dateRange.end) return false;

      // Status: must be completed/succeeded
      if (p.status !== "completed" && p.status !== "succeeded") return false;

      // Search filter
      if (search && !p.email.toLowerCase().includes(search.toLowerCase())) return false;

      return true;
    });
  }, [purchases, dateRange, search]);

  // Filter Manual Incomes
  const filteredManualIncomes = useMemo(() => {
    return manualIncomes.filter(i => {
      // Date filter
      const iDate = new Date(i.income_date + "T12:00:00");
      if (iDate < dateRange.start || iDate > dateRange.end) return false;

      // Payment method filter
      if (filterPayment !== "all") {
        const group = getPaymentMethodGroup(i.payment_method);
        if (group !== filterPayment) return false;
      }

      // Category filter
      if (filterCategory !== "all" && i.category !== filterCategory) return false;

      // Search filter
      if (search &&
        !i.description.toLowerCase().includes(search.toLowerCase()) &&
        !(i.client_name ?? "").toLowerCase().includes(search.toLowerCase())
      ) return false;

      return true;
    });
  }, [manualIncomes, dateRange, filterPayment, filterCategory, search]);

  // Income Sum calculations — only completed bookings
  const totalBookingsIncome = useMemo(() => {
    return filteredBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
  }, [filteredBookings]);

  const totalPurchasesIncome = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + (p.amount_total || 0) / 100, 0);
  }, [filteredPurchases]);

  const totalManualIncome = useMemo(() => {
    return filteredManualIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
  }, [filteredManualIncomes]);

  const grandTotalIncome = totalBookingsIncome + totalPurchasesIncome + totalManualIncome;

  // Breakdown by Payment Method
  const byPaymentMethod = useMemo(() => {
    const map = new Map<string, number>();

    // 1. Bookings (only completed — already filtered)
    filteredBookings.forEach(b => {
      const amt = Number(b.total_price);
      if (amt > 0) {
        const group = getBookingPaymentGroup(b);
        map.set(group, (map.get(group) ?? 0) + amt);
      }
    });

    // 2. Purchases (always stripe/card)
    filteredPurchases.forEach(p => {
      const amt = (p.amount_total || 0) / 100;
      map.set("tarjeta", (map.get("tarjeta") ?? 0) + amt);
    });

    // 3. Manual Incomes
    filteredManualIncomes.forEach(i => {
      const group = getPaymentMethodGroup(i.payment_method);
      map.set(group, (map.get(group) ?? 0) + Number(i.amount));
    });

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredBookings, filteredPurchases, filteredManualIncomes]);

  // Breakdown by Professional (Bookings only)
  // For deleted professionals (professional_id = null) we use the name snapshot
  // as the grouping key so they appear as a named row instead of "Sin asignar".
  const byProfessional = useMemo(() => {
    const map = new Map<string, number>();

    filteredBookings.forEach(b => {
      const amt = b.status === "completed" ? Number(b.total_price) : (b.deposit_paid ? Number(b.deposit_amount) : 0);
      if (amt > 0) {
        // Use professional_id when available; fall back to snapshot name for deleted pros
        const key = b.professional_id || b.professional_name_snapshot || "sin_asignar";
        map.set(key, (map.get(key) ?? 0) + amt);
      }
    });

    // Also include manual incomes if they are linked to a professional
    filteredManualIncomes.forEach(i => {
      if (i.related_user_id) {
        map.set(i.related_user_id, (map.get(i.related_user_id) ?? 0) + Number(i.amount));
      }
    });

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredBookings, filteredManualIncomes]);

  // Build combined professional list: active staff + deleted ones inferred from snapshots
  const allProfessionals = useMemo(() => {
    const active = staff.map(s => ({ key: s.id, label: s.name || s.email }));
    // Find deleted professionals: bookings with no professional_id but with a snapshot name
    const deletedNames = new Set<string>();
    bookings.forEach(b => {
      if (!b.professional_id && b.professional_name_snapshot) {
        deletedNames.add(b.professional_name_snapshot);
      }
    });
    const deleted = Array.from(deletedNames).map(name => ({ key: name, label: `${name} (eliminada)` }));
    return [...active, ...deleted];
  }, [staff, bookings]);

  // Helpers
  const catInfo = (val: string) => INCOME_CATEGORIES.find(c => c.value === val) ?? INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1];
  const payInfo = (val: string) => PAYMENT_METHODS.find(p => p.value === val) ?? PAYMENT_METHODS[0];

  const dateLabel = useMemo(() => {
    const base = new Date(selectedDate + "T12:00:00");
    if (rangeType === "day") {
      return base.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    } else if (rangeType === "week") {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      return `${start.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;
    } else if (rangeType === "month") {
      return base.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    } else if (rangeType === "year") {
      return `Año ${base.getFullYear()}`;
    } else {
      return `${new Date(customStart + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - ${new Date(customEnd + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;
    }
  }, [rangeType, selectedDate, dateRange, customStart, customEnd]);

  // Modal Handlers
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (i: ManualIncome) => {
    setEditing(i);
    setForm({
      income_date: i.income_date,
      category: i.category,
      subcategory: i.subcategory ?? "",
      description: i.description,
      amount: Number(i.amount),
      payment_method: i.payment_method,
      client_name: i.client_name ?? "",
      client_phone: i.client_phone ?? "",
      client_email: i.client_email ?? "",
      related_user_id: i.related_user_id,
      notes: i.notes ?? "",
      is_recurring: i.is_recurring,
      recurring_period: i.recurring_period ?? "mensual",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.description.trim() || form.amount <= 0) return;
    setSaving(true);
    const payload = {
      income_date: form.income_date,
      category: form.category,
      subcategory: form.subcategory || null,
      description: form.description.trim(),
      amount: form.amount,
      payment_method: form.payment_method,
      client_name: form.client_name.trim() || null,
      client_phone: form.client_phone.trim() || null,
      client_email: form.client_email.trim() || null,
      related_user_id: form.related_user_id,
      notes: form.notes.trim() || null,
      is_recurring: form.is_recurring,
      recurring_period: form.is_recurring ? form.recurring_period : null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editing) {
        const { error } = await supabase.from("incomes").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("incomes").insert(payload);
        if (error) throw error;
      }
      setShowModal(false);
      await loadAll();
    } catch (err) {
      console.error("Save income error:", err);
      alert("Error al guardar el ingreso.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("incomes").delete().eq("id", id);
      if (error) throw error;
      setDeleteConfirm(null);
      await loadAll();
    } catch (err) {
      console.error("Delete income error:", err);
      alert("Error al eliminar el ingreso.");
    }
  };

  const adjustDate = (amount: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    if (rangeType === "day") {
      d.setDate(d.getDate() + amount);
    } else if (rangeType === "week") {
      d.setDate(d.getDate() + amount * 7);
    } else if (rangeType === "month") {
      d.setMonth(d.getMonth() + amount);
    } else if (rangeType === "year") {
      d.setFullYear(d.getFullYear() + amount);
    }
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ingresos</h1>
            <p className="text-gray-500 text-sm mt-1">Control de caja y facturación · {dateLabel}</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />Nuevo ingreso
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex gap-1 bg-gray-200/60 p-1 rounded-xl w-fit mb-6">
          {(["day", "week", "month", "year", "custom"] as const).map(t => (
            <button
              key={t}
              onClick={() => setRangeType(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${rangeType === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "day" ? "Día" : t === "week" ? "Semana" : t === "month" ? "Mes" : t === "year" ? "Año" : "Rango"}
            </button>
          ))}
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {rangeType !== "custom" && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => adjustDate(-1)}
                className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center cursor-pointer text-gray-600 font-bold"
              >
                <ArrowDownRight className="w-4 h-4 rotate-45" />
              </button>
              <span className="text-xs font-bold text-gray-700 px-2">{dateLabel}</span>
              <button
                onClick={() => adjustDate(1)}
                className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center cursor-pointer text-gray-600 font-bold"
              >
                <ArrowUpRight className="w-4 h-4 -rotate-45" />
              </button>
            </div>
          )}

          {rangeType === "day" && (
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-emerald-400 outline-none bg-white cursor-pointer"
            />
          )}

          {rangeType === "month" && (
            <input
              type="month"
              value={selectedDate.slice(0, 7)}
              onChange={e => setSelectedDate(e.target.value + "-01")}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-emerald-400 outline-none bg-white cursor-pointer"
            />
          )}

          {rangeType === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-emerald-400 outline-none bg-white"
              />
              <span className="text-xs text-gray-400">al</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-emerald-400 outline-none bg-white"
              />
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Citas agenda", value: `€${totalBookingsIncome.toFixed(2)}`, icon: <CalendarDays className="w-5 h-5 text-emerald-600" />, color: "bg-emerald-50" },
            { label: "Ventas online", value: `€${totalPurchasesIncome.toFixed(2)}`, icon: <Package className="w-5 h-5 text-blue-600" />, color: "bg-blue-50" },
            { label: "Ingresos manuales", value: `€${totalManualIncome.toFixed(2)}`, icon: <Coins className="w-5 h-5 text-purple-600" />, color: "bg-purple-50" },
            { label: "Total ingresos", value: `€${grandTotalIncome.toFixed(2)}`, icon: <TrendingUp className="w-5 h-5 text-teal-600" />, color: "bg-teal-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{loading ? "—" : s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Breakdown Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* By Professional */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <UserCog className="w-4 h-4 text-emerald-500" /> Ingresos por profesional
            </h3>
            {byProfessional.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">No hay ingresos registrados en este periodo.</p>
            ) : (
              <div className="space-y-3">
                {byProfessional.map(([proId, amount]) => {
                  const pro = staff.find(s => s.id === proId);
                  // If no staff match it's either a deleted professional (snapshot name used as key)
                  // or truly unassigned
                  const isUUID = /^[0-9a-f-]{36}$/.test(proId);
                  const name = proId === "sin_asignar"
                    ? "Venta directa / Online"
                    : (pro?.name || pro?.email || (isUUID ? "Profesional" : `${proId} (eliminada)`));
                  const pct = grandTotalIncome > 0 ? (amount / grandTotalIncome) * 100 : 0;
                  return (
                    <div key={proId}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-semibold text-gray-700 truncate">{name}</span>
                        <span className="font-bold text-gray-900">€{amount.toFixed(2)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full animate-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* By Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-500" /> Distribución de cobro
            </h3>
            {byPaymentMethod.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">No hay ingresos registrados en este periodo.</p>
            ) : (
              <div className="space-y-3">
                {byPaymentMethod.map(([method, amount]) => {
                  const pi = payInfo(method);
                  const PIcon = pi.icon;
                  const pct = grandTotalIncome > 0 ? (amount / grandTotalIncome) * 100 : 0;
                  return (
                    <div key={method} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <PIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="font-semibold text-gray-700 truncate">{pi.label}</span>
                          <span className="font-bold text-gray-900">€{amount.toFixed(2)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 w-10 text-right font-semibold">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {[
            { key: "citas" as Tab, label: "Citas agenda", count: filteredBookings.length },
            { key: "ventas" as Tab, label: "Ventas online", count: filteredPurchases.length },
            { key: "manual" as Tab, label: "Ingresos manuales", count: filteredManualIncomes.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Interactive Filters */}
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === "citas" ? "Buscar por cliente..." : tab === "ventas" ? "Buscar por email..." : "Buscar por descripción..."}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-emerald-400 outline-none w-52 bg-white"
            />
          </div>

          {tab !== "ventas" && (
            <select
              value={filterPayment}
              onChange={e => setFilterPayment(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-emerald-400 outline-none bg-white cursor-pointer"
            >
              <option value="all">Todos los métodos de pago</option>
              {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          )}

          {tab === "citas" && (
            <select
              value={filterPro}
              onChange={e => setFilterPro(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-emerald-400 outline-none bg-white cursor-pointer"
            >
              <option value="all">Todos los profesionales</option>
              {allProfessionals.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          )}

          {tab === "manual" && (
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-emerald-400 outline-none bg-white cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {INCOME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}
        </div>

        {/* CITAS TAB */}
        {tab === "citas" && (
          loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">No hay citas registradas en este periodo</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="px-5 py-4 font-medium">Fecha / Hora</th>
                      <th className="px-4 py-4 font-medium">Cliente</th>
                      <th className="px-4 py-4 font-medium">Profesional</th>
                      <th className="px-4 py-4 font-medium">Cobro</th>
                      <th className="px-4 py-4 font-medium">Estado</th>
                      <th className="px-4 py-4 font-medium text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBookings.map(b => {
                      const pro = staff.find(s => s.id === b.professional_id);
                      // Resolve professional display name: live name > snapshot (deleted) > fallback
                      const proName = pro?.name || pro?.email
                        || (b.professional_name_snapshot ? `${b.professional_name_snapshot} (eliminada)` : "Sin asignar");
                      return (
                        <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-gray-700 font-medium">
                              {new Date(b.booking_date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                            </p>
                            <p className="text-xs text-gray-400">{b.booking_time}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-gray-900">{b.client_name}</p>
                            <p className="text-xs text-gray-400">{b.client_phone}</p>
                          </td>
                          <td className="px-4 py-4 text-gray-600 font-medium">
                            {proName}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs font-medium text-gray-600">
                              {getBookingPaymentGroup(b) === "tarjeta" ? "Tarjeta (Stripe)" : "Efectivo"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              Completada
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-bold text-gray-900">
                            €{Number(b.total_price).toFixed(2)}
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

        {/* VENTAS ONLINE TAB */}
        {tab === "ventas" && (
          loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">No hay compras online registradas en este periodo</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="px-5 py-4 font-medium">Fecha</th>
                      <th className="px-4 py-4 font-medium">Email</th>
                      <th className="px-4 py-4 font-medium">ID Producto</th>
                      <th className="px-4 py-4 font-medium">Pasarela</th>
                      <th className="px-4 py-4 font-medium text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPurchases.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4 text-gray-600">
                          {new Date(p.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-4 text-gray-900 font-semibold">{p.email}</td>
                        <td className="px-4 py-4 font-mono text-xs text-gray-500">{p.product_id}</td>
                        <td className="px-4 py-4 text-xs font-semibold text-sky-600">Tarjeta (Stripe)</td>
                        <td className="px-4 py-4 text-right font-bold text-gray-900">€{((p.amount_total || 0) / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* MANUAL TAB */}
        {tab === "manual" && (
          loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : filteredManualIncomes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Coins className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">No hay ingresos manuales en este periodo</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
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
                    {filteredManualIncomes.map(i => {
                      const ci = catInfo(i.category);
                      const pi = payInfo(i.payment_method);
                      const Icon = ci.icon;
                      const PIcon = pi.icon;
                      return (
                        <tr key={i.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-gray-700 font-medium">
                              {new Date(i.income_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(i.income_date).toLocaleDateString("es-ES", { weekday: "short" })}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${ci.color}`}>
                              <Icon className="w-3 h-3" />
                              {ci.label.split(" ")[0]}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-gray-900">{i.description}</p>
                            {i.client_name && <p className="text-xs text-gray-400">Cliente: {i.client_name}</p>}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                              <PIcon className="w-3.5 h-3.5" />{pi.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-bold text-gray-900">€{Number(i.amount).toFixed(2)}</td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => openEdit(i)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
                              >
                                <i className="ri-edit-line text-sm"></i>
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(i.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
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
      </main>

      {/* Manual Income Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">{editing ? "Editar ingreso manual" : "Nuevo ingreso manual"}</h2>
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
                    value={form.income_date}
                    onChange={e => setForm(p => ({ ...p, income_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 font-semibold"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Categoría *</label>
                <div className="grid grid-cols-2 gap-2">
                  {INCOME_CATEGORIES.map(c => {
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.value}
                        onClick={() => setForm(p => ({ ...p, category: c.value }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer text-left ${
                          form.category === c.value
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
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
                    form.category === "venta_productos" ? "Ej. Venta de aceite de cutículas Dadi Oil" :
                    form.category === "cursos" ? "Ej. Matrícula curso de manicura combinada" :
                    "Describe el ingreso..."
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Client Name + Payment method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre cliente</label>
                  <input
                    type="text"
                    value={form.client_name}
                    onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Método de cobro</label>
                  <select
                    value={form.payment_method}
                    onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 bg-white cursor-pointer"
                  >
                    {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Professional Linker */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Profesional responsable (opcional)</label>
                <select
                  value={form.related_user_id ?? ""}
                  onChange={e => setForm(p => ({ ...p, related_user_id: e.target.value || null }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 bg-white cursor-pointer"
                >
                  <option value="">Ninguno / Venta directa</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notas internas</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Observaciones, número de ticket, etc."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.description.trim() || form.amount <= 0}
                className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors">
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar ingreso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete manual income confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-2">¿Eliminar ingreso?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Esta acción borrará el ingreso manual y no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold cursor-pointer transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
