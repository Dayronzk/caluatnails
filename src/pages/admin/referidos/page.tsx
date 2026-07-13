import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "@/pages/admin/components/AdminSidebar";
import { Gift, Link2, TrendingUp, Coins, Search, Plus, X, Check } from "lucide-react";

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_email: string | null;
  event_type: string;
  points_awarded: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  referrer_name: string | null;
  referrer_email: string | null;
  discount_applied_eur?: number | null;
}

interface TopReferrer {
  referrer_id: string;
  referrer_name: string | null;
  referrer_email: string | null;
  referral_code: string | null;
  total_referrals: number;
  completed: number;
  total_points: number;
}

interface UserOption {
  id: string;
  name: string | null;
  email: string | null;
  points: number;
}

const EVENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  booking: { label: "Reserva", color: "bg-teal-50 text-teal-600", icon: "ri-calendar-check-line" },
  purchase: { label: "Compra de curso", color: "bg-rose-50 text-rose-600", icon: "ri-shopping-bag-line" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-50 text-amber-600" },
  completed: { label: "Completado", color: "bg-emerald-50 text-emerald-600" },
};

export default function AdminReferidosPage() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Points modal state
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  const [pointsType, setPointsType] = useState<"add" | "subtract">("add");
  const [userSearch, setUserSearch] = useState("");
  const [savingPoints, setSavingPoints] = useState(false);
  const [pointsToast, setPointsToast] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [refsRes, usersRes] = await Promise.all([
      supabase
        .from("referrals")
        .select("*, profiles!referrals_referrer_id_fkey(name, email), bookings!bookings_referral_id_fkey(referral_discount_eur)")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, name, email, points, referral_code")
        .order("name"),
    ]);

    type RawRefRow = ReferralRow & {
      profiles: { name: string | null; email: string | null } | null;
      bookings?: Array<{ referral_discount_eur: number | null }> | null;
    };
    const rawRefs = (refsRes.data ?? []) as RawRefRow[];
    const mapped: ReferralRow[] = rawRefs.map(r => {
      const totalDiscount = (r.bookings ?? []).reduce(
        (s, b) => s + (Number(b.referral_discount_eur) || 0),
        0,
      );
      return {
        ...r,
        referrer_name: r.profiles?.name ?? null,
        referrer_email: r.profiles?.email ?? null,
        discount_applied_eur: totalDiscount > 0 ? totalDiscount : null,
      };
    });
    setReferrals(mapped);

    const usersData = (usersRes.data ?? []) as (UserOption & { referral_code: string | null })[];
    setUsers(usersData.map(u => ({ id: u.id, name: u.name, email: u.email, points: u.points ?? 0 })));

    // Build top referrers from referrals
    const map = new Map<string, TopReferrer>();
    for (const ref of mapped) {
      if (!map.has(ref.referrer_id)) {
        const u = usersData.find(u => u.id === ref.referrer_id);
        map.set(ref.referrer_id, {
          referrer_id: ref.referrer_id,
          referrer_name: ref.referrer_name,
          referrer_email: ref.referrer_email,
          referral_code: u?.referral_code ?? null,
          total_referrals: 0,
          completed: 0,
          total_points: 0,
        });
      }
      const entry = map.get(ref.referrer_id)!;
      entry.total_referrals++;
      if (ref.status === "completed") {
        entry.completed++;
        entry.total_points += ref.points_awarded;
      }
    }
    setTopReferrers(Array.from(map.values()).sort((a, b) => b.total_points - a.total_points));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = referrals.filter(r => {
    const matchSearch = !search ||
      (r.referrer_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.referrer_email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.referred_email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchType = filterType === "all" || r.event_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const totalCompleted = referrals.filter(r => r.status === "completed").length;
  const totalPoints = referrals.filter(r => r.status === "completed").reduce((s, r) => s + r.points_awarded, 0);
  const totalPending = referrals.filter(r => r.status === "pending").length;

  const filteredUsers = users.filter(u =>
    !userSearch ||
    (u.name ?? "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSavePoints = async () => {
    if (!selectedUser || !pointsAmount || !pointsReason.trim()) return;
    const pts = parseInt(pointsAmount, 10);
    if (isNaN(pts) || pts <= 0) return;
    setSavingPoints(true);
    try {
      const delta = pointsType === "add" ? pts : -pts;
      const newTotal = Math.max(0, (selectedUser.points ?? 0) + delta);

      await supabase.from("points_transactions").insert({
        user_id: selectedUser.id,
        points: delta,
        type: pointsType === "add" ? "admin_grant" : "admin_deduct",
        description: pointsReason.trim(),
        reference_id: null,
      });

      await supabase
        .from("profiles")
        .update({ points: newTotal })
        .eq("id", selectedUser.id);

      setPointsToast(`${pointsType === "add" ? "+" : "-"}${pts} puntos ${pointsType === "add" ? "añadidos" : "deducidos"} a ${selectedUser.name ?? selectedUser.email}`);
      setShowPointsModal(false);
      setSelectedUser(null);
      setPointsAmount("");
      setPointsReason("");
      setUserSearch("");
      await loadData();
      setTimeout(() => setPointsToast(""), 4000);
    } finally {
      setSavingPoints(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referidos y Puntos</h1>
            <p className="text-gray-500 mt-1">Estadísticas del programa de referidos y gestión manual de puntos</p>
          </div>
          <button
            onClick={() => setShowPointsModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Asignar puntos manualmente
          </button>
        </div>

        {/* Toast */}
        {pointsToast && (
          <div className="mb-6 bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />{pointsToast}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total referidos", value: referrals.length, icon: <Link2 className="w-5 h-5" />, color: "text-rose-500 bg-rose-50" },
            { label: "Completados", value: totalCompleted, icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-500 bg-emerald-50" },
            { label: "Pendientes", value: totalPending, icon: <Gift className="w-5 h-5" />, color: "text-amber-500 bg-amber-50" },
            { label: "Puntos acreditados", value: totalPoints.toLocaleString(), icon: <Coins className="w-5 h-5" />, color: "text-orange-500 bg-orange-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? "—" : s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Top referrers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-400" />
            Top referidores
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : topReferrers.length === 0 ? (
            <div className="text-center py-10">
              <Gift className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-gray-400 text-sm">Aún no hay referidos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Usuario</th>
                    <th className="pb-3 font-medium">Código</th>
                    <th className="pb-3 font-medium text-center">Total</th>
                    <th className="pb-3 font-medium text-center">Completados</th>
                    <th className="pb-3 font-medium text-right">Puntos ganados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topReferrers.map((r, i) => (
                    <tr key={r.referrer_id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 pr-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-gray-50 text-gray-400"}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{r.referrer_name ?? "Sin nombre"}</p>
                        <p className="text-xs text-gray-400">{r.referrer_email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                          {r.referral_code ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center font-semibold text-gray-700">{r.total_referrals}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className="text-emerald-600 font-semibold">{r.completed}</span>
                        <span className="text-gray-300 text-xs"> / {r.total_referrals}</span>
                      </td>
                      <td className="py-3 text-right font-bold text-amber-600">
                        +{r.total_points.toLocaleString()} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Referral log */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-rose-400" />
              Historial de referidos
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar usuario..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none w-48"
                />
              </div>
              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none bg-white cursor-pointer"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completados</option>
              </select>
              {/* Type filter */}
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none bg-white cursor-pointer"
              >
                <option value="all">Todos los tipos</option>
                <option value="booking">Reservas</option>
                <option value="purchase">Compras</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-gray-400 text-sm">No hay referidos con estos filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-medium">Referidor</th>
                    <th className="pb-3 font-medium">Referido</th>
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium text-right">Puntos</th>
                    <th className="pb-3 font-medium text-right">Descuento</th>
                    <th className="pb-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(ref => {
                    const ev = EVENT_LABELS[ref.event_type] ?? EVENT_LABELS.booking;
                    const st = STATUS_LABELS[ref.status] ?? STATUS_LABELS.pending;
                    return (
                      <tr key={ref.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-gray-900">{ref.referrer_name ?? "—"}</p>
                          <p className="text-xs text-gray-400">{ref.referrer_email}</p>
                        </td>
                        <td className="py-3 pr-4 text-gray-600 text-xs">{ref.referred_email ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${ev.color}`}>
                            <i className={`${ev.icon} text-xs`}></i>{ev.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right font-bold text-amber-600">
                          {ref.status === "completed" ? `+${ref.points_awarded}` : "—"}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {ref.discount_applied_eur && ref.discount_applied_eur > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              -{ref.discount_applied_eur}€
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 text-xs text-gray-400">
                          {new Date(ref.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Points modal */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Asignar puntos manualmente</h2>
              <button
                onClick={() => { setShowPointsModal(false); setSelectedUser(null); setPointsAmount(""); setPointsReason(""); setUserSearch(""); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* User search */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Usuario</label>
                {selectedUser ? (
                  <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <div className="w-9 h-9 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold text-sm shrink-0">
                      {(selectedUser.name ?? selectedUser.email ?? "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{selectedUser.name ?? "Sin nombre"}</p>
                      <p className="text-xs text-gray-500 truncate">{selectedUser.email} · {(selectedUser.points ?? 0).toLocaleString()} pts actuales</p>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-rose-200 cursor-pointer">
                      <X className="w-3 h-3 text-rose-600" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        placeholder="Buscar por nombre o email..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none"
                      />
                    </div>
                    {userSearch && (
                      <div className="border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        {filteredUsers.slice(0, 8).map(u => (
                          <button
                            key={u.id}
                            onClick={() => { setSelectedUser(u); setUserSearch(""); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer text-left border-b border-gray-50 last:border-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs shrink-0">
                              {(u.name ?? u.email ?? "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{u.name ?? "Sin nombre"}</p>
                              <p className="text-xs text-gray-400 truncate">{u.email}</p>
                            </div>
                            <span className="text-xs text-amber-600 font-semibold shrink-0">{(u.points ?? 0).toLocaleString()} pts</span>
                          </button>
                        ))}
                        {filteredUsers.length === 0 && (
                          <p className="text-center text-sm text-gray-400 py-4">Sin resultados</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Add / subtract toggle */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Operación</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPointsType("add")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${pointsType === "add" ? "bg-emerald-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    <i className="ri-add-line mr-1"></i>Añadir puntos
                  </button>
                  <button
                    onClick={() => setPointsType("subtract")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${pointsType === "subtract" ? "bg-red-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    <i className="ri-subtract-line mr-1"></i>Deducir puntos
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cantidad de puntos</label>
                <input
                  type="number"
                  min="1"
                  value={pointsAmount}
                  onChange={e => setPointsAmount(e.target.value)}
                  placeholder="Ej: 500"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none"
                />
                {selectedUser && pointsAmount && (
                  <p className="text-xs text-gray-400 mt-1">
                    Saldo resultante: <strong className="text-gray-700">
                      {Math.max(0, (selectedUser.points ?? 0) + (pointsType === "add" ? 1 : -1) * (parseInt(pointsAmount) || 0)).toLocaleString()} pts
                    </strong>
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Motivo</label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={e => setPointsReason(e.target.value)}
                  placeholder="Ej: Compensación por incidencia, Premio especial..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-rose-400 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowPointsModal(false); setSelectedUser(null); setPointsAmount(""); setPointsReason(""); setUserSearch(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePoints}
                  disabled={savingPoints || !selectedUser || !pointsAmount || !pointsReason.trim()}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${pointsType === "add" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                >
                  {savingPoints
                    ? <><i className="ri-loader-4-line animate-spin"></i>Guardando...</>
                    : <><i className={pointsType === "add" ? "ri-add-line" : "ri-subtract-line"}></i>{pointsType === "add" ? "Añadir" : "Deducir"} puntos</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
