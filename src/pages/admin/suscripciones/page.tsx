import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "../components/AdminSidebar";
import { useSEO } from "@/hooks/useSEO";
import { 
  Search, 
  Plus, 
  Ticket, 
  User, 
  Calendar, 
  Play, 
  Pause, 
  Trash2, 
  PlusCircle, 
  MinusCircle, 
  Edit3, 
  Loader2, 
  X,
  Sparkles,
  AlertTriangle
} from "lucide-react";

interface SubscriptionRow {
  id: string;
  client_account_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  sessions_total: number;
  sessions_used: number;
  paused_days: number;
  client_accounts: {
    name: string | null;
    phone: string;
    email: string | null;
  } | null;
  subscription_plans: {
    name: string;
    total_price: number;
    duration_months: number;
  } | null;
}

interface ClientAccountOption {
  id: string;
  name: string | null;
  phone: string;
}

interface PlanOption {
  id: string;
  name: string;
  total_price: number;
  total_sessions: number;
}

export default function AdminSubscriptionsPage() {
  useSEO({
    title: "Gestión de Bonos y Suscripciones | Admin",
    description: "Panel de administración para la gestión de bonos de clientes y control de saldo de sesiones.",
    noindex: true,
  });

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [clients, setClients] = useState<ClientAccountOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Manual Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    client_account_id: "",
    plan_id: "",
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Edit Sessions Modal State
  const [editingSub, setEditingSub] = useState<SubscriptionRow | null>(null);
  const [newSessionsUsed, setNewSessionsUsed] = useState(0);

  async function loadData() {
    try {
      setLoading(true);
      // Fetch subscriptions with joins
      const { data: subsData } = await supabase
        .from("client_subscriptions")
        .select(`
          *,
          client_accounts (name, phone, email),
          subscription_plans (name, total_price, duration_months)
        `)
        .order("created_at", { ascending: false });

      if (subsData) setSubscriptions(subsData as SubscriptionRow[]);

      // Fetch client accounts for manual assignment dropdown
      const { data: clientsData } = await supabase
        .from("client_accounts")
        .select("id, name, phone")
        .order("name");
      if (clientsData) setClients(clientsData as ClientAccountOption[]);

      // Fetch active plans catalog
      const { data: plansData } = await supabase
        .from("subscription_plans")
        .select("id, name, total_price, total_sessions")
        .eq("active", true)
        .order("name");
      if (plansData) setPlans(plansData as PlanOption[]);

    } catch (err) {
      console.error("Error loading admin subscriptions:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter subscriptions based on search and status
  const filteredSubs = subscriptions.filter(sub => {
    const clientName = sub.client_accounts?.name?.toLowerCase() || "";
    const clientPhone = sub.client_accounts?.phone || "";
    const planName = sub.subscription_plans?.name?.toLowerCase() || "";
    const searchTerm = search.toLowerCase();
    
    const matchesSearch = clientName.includes(searchTerm) || 
                          clientPhone.includes(searchTerm) || 
                          planName.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Action handlers
  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!confirm(`¿Estás seguro de cambiar el estado de este bono a '${newStatus}'?`)) return;

    try {
      const { error } = await supabase
        .from("client_subscriptions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      loadData();
    } catch (err) {
      alert("Error al actualizar el estado: " + (err as Error).message);
    }
  };

  // Manual Pause: adds 14 days or extends expiration date
  const handleExtendOrPause = async (sub: SubscriptionRow, action: "pause" | "resume") => {
    const promptMsg = action === "pause" 
      ? "¿Pausar este bono por vacaciones? (Se bloqueará su uso temporalmente)"
      : "¿Reactivar este bono pausado?";

    if (!confirm(promptMsg)) return;

    try {
      const status = action === "pause" ? "paused" : "active";
      const { error } = await supabase
        .from("client_subscriptions")
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", sub.id);

      if (error) throw error;
      loadData();
    } catch (err) {
      alert("Error al procesar la acción: " + (err as Error).message);
    }
  };

  // Adjust Expiration Date manually (+30 days)
  const handleAdd30Days = async (id: string, currentEndDate: string) => {
    if (!confirm("¿Deseas extender la vigencia de este bono +30 días adicionales?")) return;

    try {
      const date = new Date(currentEndDate);
      date.setDate(date.getDate() + 30);

      const { error } = await supabase
        .from("client_subscriptions")
        .update({ 
          end_date: date.toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq("id", id);

      if (error) throw error;
      loadData();
    } catch (err) {
      alert("Error al extender la fecha: " + (err as Error).message);
    }
  };

  // Update sessions used count
  const handleUpdateSessions = async () => {
    if (!editingSub) return;
    
    if (newSessionsUsed < 0 || newSessionsUsed > editingSub.sessions_total) {
      alert("El número de sesiones usadas debe estar entre 0 y el total de sesiones.");
      return;
    }

    try {
      const { error } = await supabase
        .from("client_subscriptions")
        .update({ 
          sessions_used: newSessionsUsed,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingSub.id);

      if (error) throw error;
      setEditingSub(null);
      loadData();
    } catch (err) {
      alert("Error al actualizar sesiones: " + (err as Error).message);
    }
  };

  // Assign plan manually (cash payment at salon)
  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.client_account_id || !assignForm.plan_id) {
      alert("Por favor selecciona un cliente y un plan.");
      return;
    }

    setModalSubmitting(true);

    try {
      const plan = plans.find(p => p.id === assignForm.plan_id);
      const { data: dbPlan } = await supabase
        .from("subscription_plans")
        .select("duration_months, total_sessions")
        .eq("id", assignForm.plan_id)
        .single();

      if (!dbPlan) throw new Error("Plan no encontrado");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + dbPlan.duration_months);

      const { error } = await supabase
        .from("client_subscriptions")
        .insert({
          client_account_id: assignForm.client_account_id,
          plan_id: assignForm.plan_id,
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          sessions_total: dbPlan.total_sessions,
          sessions_used: 0,
          stripe_session_id: "manual-admin-" + crypto.randomUUID().slice(0,8)
        });

      if (error) throw error;

      setShowAssignModal(false);
      setAssignForm({ client_account_id: "", plan_id: "" });
      loadData();
      alert("Bono asignado con éxito a la ficha del cliente.");
    } catch (err) {
      alert("Error al asignar bono: " + (err as Error).message);
    } finally {
      setModalSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">Activo</span>;
      case "paused":
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">Pausado</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold uppercase tracking-wider">Cancelado</span>;
      case "expired":
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider">Caducado</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-rose-500" />
              Gestión de Bonos y Suscripciones
            </h1>
            <p className="text-slate-500 mt-1">Controla el saldo de sesiones, vencimientos y pausas de clientes</p>
          </div>
          
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors shadow-md shadow-rose-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Asignar Bono Manual
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono o plan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-300 transition-colors"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="paused">Pausados</option>
            <option value="expired">Caducados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>

        {/* Subscriptions Grid / Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-semibold">Cargando suscripciones de clientes...</p>
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm text-slate-400">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-25 text-slate-500" />
            <p className="text-base font-bold text-slate-700">No se encontraron bonos activos</p>
            <p className="text-xs text-slate-400 mt-1">Intenta cambiar el filtro o asigna un bono manual.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Plan / Cobertura</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-center">Sesiones Usadas</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Vencimiento</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSubs.map(sub => {
                    const sessionsLeft = sub.sessions_total - sub.sessions_used;
                    
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Client details */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center">
                              {sub.client_accounts?.name ? sub.client_accounts.name.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{sub.client_accounts?.name || "Sin nombre"}</p>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">{sub.client_accounts?.phone}</p>
                            </div>
                          </div>
                        </td>

                        {/* Plan details */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">{sub.subscription_plans?.name || "Bono Especial"}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Precio: {sub.subscription_plans?.total_price || "0"} €</p>
                        </td>

                        {/* Sessions status */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="inline-block text-center">
                            <span className="text-base font-black text-slate-900">{sub.sessions_used}</span>
                            <span className="text-xs text-slate-400"> / {sub.sessions_total}</span>
                            <p className={`text-[10px] font-bold mt-0.5 ${sessionsLeft > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              ({sessionsLeft} libres)
                            </p>
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 space-y-1">
                          <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expiración: <strong>{new Date(sub.end_date).toLocaleDateString("es-ES")}</strong></p>
                          <p className="text-[10px] text-slate-400">Desde: {new Date(sub.start_date).toLocaleDateString("es-ES")}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(sub.status)}
                        </td>

                        {/* Quick Controls */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit Sessions button */}
                            <button
                              onClick={() => {
                                setEditingSub(sub);
                                setNewSessionsUsed(sub.sessions_used);
                              }}
                              title="Editar sesiones"
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-rose-500 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Pause / Resume button */}
                            {sub.status === "active" ? (
                              <button
                                onClick={() => handleExtendOrPause(sub, "pause")}
                                title="Pausar por vacaciones"
                                className="p-2 hover:bg-slate-100 rounded-lg text-amber-600 hover:text-amber-700 transition-colors"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            ) : sub.status === "paused" ? (
                              <button
                                onClick={() => handleExtendOrPause(sub, "resume")}
                                title="Reactivar bono"
                                className="p-2 hover:bg-slate-100 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            ) : null}

                            {/* Add +30 days extension */}
                            <button
                              onClick={() => handleAdd30Days(sub.id, sub.end_date)}
                              title="Extender +30 días"
                              className="p-1.5 border border-slate-200 hover:border-rose-200 text-xs font-bold text-slate-500 hover:text-rose-500 rounded-lg transition-colors px-2"
                            >
                              +30 d
                            </button>

                            {/* Cancel / Expire */}
                            {sub.status !== "cancelled" && sub.status !== "expired" && (
                              <button
                                onClick={() => handleStatusChange(sub.id, "cancelled")}
                                title="Cancelar bono"
                                className="p-2 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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

        {/* Modal: Manual Assignment */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-md w-full border border-slate-100 shadow-2xl relative">
              <button
                onClick={() => setShowAssignModal(false)}
                className="absolute right-4 top-4 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-rose-500" />
                Asignar Bono Manual
              </h3>
              <p className="text-xs text-slate-400 mb-6">Usa este panel para asignar un plan comprado de forma presencial (efectivo en el salón)</p>

              <form onSubmit={handleAssignPlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">1. Selecciona el cliente</label>
                  <select
                    value={assignForm.client_account_id}
                    onChange={e => setAssignForm({ ...assignForm, client_account_id: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-300"
                    required
                  >
                    <option value="">-- Elige un cliente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name || "Sin Nombre"} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">2. Selecciona el plan / bono</label>
                  <select
                    value={assignForm.plan_id}
                    onChange={e => setAssignForm({ ...assignForm, plan_id: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-300"
                    required
                  >
                    <option value="">-- Elige un plan --</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.total_sessions} ses. · {p.total_price}€)</option>
                    ))}
                  </select>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 flex items-start gap-2 mt-4 leading-relaxed">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Nota:</strong> Esta acción no procesará cobros en Stripe. El bono se creará inmediatamente a coste 0€ y se habilitará para reservas online. Asegúrate de registrar el cobro en efectivo.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-2 cursor-pointer mt-6"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Asignando bono...
                    </>
                  ) : (
                    "Confirmar Asignación"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Sessions */}
        {editingSub && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative">
              <button
                onClick={() => setEditingSub(null)}
                className="absolute right-4 top-4 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black text-slate-900 mb-2 uppercase tracking-tight">Editar Saldo de Sesiones</h3>
              <p className="text-xs text-slate-400 mb-6">Ajusta el número de sesiones ya disfrutadas por la clienta</p>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <p className="text-xs text-slate-400">Total sesiones del bono</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{editingSub.sessions_total} sesiones</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Sesiones ya consumidas (usadas)</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setNewSessionsUsed(prev => Math.max(0, prev - 1))}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer"
                    >
                      <MinusCircle className="w-6 h-6" />
                    </button>
                    
                    <input
                      type="number"
                      value={newSessionsUsed}
                      onChange={e => setNewSessionsUsed(Math.max(0, Math.min(editingSub.sessions_total, Number(e.target.value))))}
                      className="flex-1 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black focus:outline-none focus:border-rose-300"
                    />

                    <button
                      onClick={() => setNewSessionsUsed(prev => Math.min(editingSub.sessions_total, prev + 1))}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    Quedarán <strong>{editingSub.sessions_total - newSessionsUsed} sesiones disponibles</strong> para reservar.
                  </p>
                </div>

                <button
                  onClick={handleUpdateSessions}
                  className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-rose-200 cursor-pointer mt-4"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
