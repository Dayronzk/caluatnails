import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { supabase } from "@/lib/supabase";
import { type TemplateMeta, inferVariableKinds, renderPreview } from "@/lib/whatsappTemplates";
import { 
  Send, Users, MessageSquare, Mail, Plus, History,
  CheckCircle, AlertCircle, Loader, Calendar, ChevronRight,
  Target, X, GraduationCap, Bell, Settings, ClipboardList, Zap
} from "lucide-react";


type MainTab = "campaigns";

interface Campaign {
  id: string;
  name: string;
  type: "whatsapp" | "email";
  content: string;
  status: "draft" | "sending" | "completed";
  target_segment: string;
  created_at: string;
  sent_count: number;
  total_targets: number;
  opened_count?: number;
  clicked_count?: number;
}

type RecencyMode = "none" | "inactive" | "recent";
type VarSource = "name" | "next_booking_date" | "last_booking_date" | "next_booking_time" | "professional" | "points" | "fixed";
interface VarConfig { source: VarSource; value?: string; fallback?: string }

const VAR_SOURCE_LABELS: Record<VarSource, string> = {
  name: "Nombre de la clienta",
  next_booking_date: "Fecha próxima cita",
  last_booking_date: "Fecha última cita",
  next_booking_time: "Hora próxima cita",
  professional: "Profesional",
  points: "Puntos disponibles",
  fixed: "Texto fijo",
};

const normPhone = (p?: string | null) => (p || "").replace(/\D/g, "").slice(-9);

const kindToSource = (kind: string): VarSource => {
  switch (kind) {
    case "name": return "name";
    case "date": return "next_booking_date";
    case "time": return "next_booking_time";
    case "professional": return "professional";
    case "points": return "points";
    default: return "fixed";
  }
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState<MainTab>("campaigns");
  
  // Wizard state
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "whatsapp" as "whatsapp" | "email",
    segment: "all",
    content: "",
    subject: "",
    use_24h_filter: false,
    meta_template_name: "",
    template_language: "es",
    template_variables: [] as VarConfig[],
    recency_mode: "none" as RecencyMode,
    recency_days: 45,
    specific_ids: [] as string[],
    image_url: ""
  });

  const [allContacts, setAllContacts] = useState<{ id: string; name: string; phone: string; type: string; last_interaction?: string }[]>([]);
  const [searchContact, setSearchContact] = useState("");
  const [active24hCount, setActive24hCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const [counts, setCounts] = useState({ clients: 0, students: 0, all: 0 });

  // Meta templates + booking recency for targeting/auto-fill
  const [metaTemplates, setMetaTemplates] = useState<TemplateMeta[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [lastBookingByPhone, setLastBookingByPhone] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadCampaigns();
    loadStats();
    loadActive24h();
    loadMetaTemplates();
    loadBookingRecency();
  }, []);

  const loadMetaTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-templates", { body: {} });
      if (error) throw error;
      if (data?.error) setTemplatesError(data.error);
      else setMetaTemplates(data?.templates ?? []);
    } catch (err) {
      setTemplatesError(err instanceof Error ? err.message : "Error al cargar plantillas");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadBookingRecency = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("bookings")
      .select("client_phone, booking_date")
      .neq("status", "cancelled")
      .lte("booking_date", today)
      .order("booking_date", { ascending: false });
    const map = new Map<string, string>();
    for (const b of data || []) {
      const key = normPhone(b.client_phone);
      if (key && !map.has(key)) map.set(key, b.booking_date); // first = most recent (desc order)
    }
    setLastBookingByPhone(map);
  };

  // How many contacts in the current segment match the recency rule.
  const recencyCount = (mode: RecencyMode, days: number): number => {
    if (mode === "none") return 0;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const pool = newCampaign.segment === "clients"
      ? allContacts.filter(c => c.type === "client")
      : newCampaign.segment === "students"
      ? allContacts.filter(c => c.type === "student")
      : allContacts;
    return pool.filter(c => {
      const last = lastBookingByPhone.get(normPhone(c.phone));
      const bookedRecently = !!last && last >= cutoff;
      // "inactive" = no booking in the last N days (includes never-booked clients).
      // "recent" = booked within the last N days (requires a prior booking).
      return mode === "inactive" ? !bookedRecently : bookedRecently;
    }).length;
  };

  const selectTemplate = (t: TemplateMeta) => {
    const kinds = inferVariableKinds(t.body_text, t.variable_count);
    const vars: VarConfig[] = kinds.map(kind => ({ source: kindToSource(kind), fallback: kind === "name" ? "amiga" : "" }));
    setNewCampaign(c => ({
      ...c,
      meta_template_name: t.name,
      template_language: t.language,
      template_variables: vars,
    }));
  };

  const selectedTemplate = metaTemplates.find(t => t.name === newCampaign.meta_template_name) || null;

  const loadActive24h = async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("customer_phone")
      .eq("from_client", true)
      .gt("created_at", yesterday);
    
    const uniquePhones = new Set(data?.map(m => m.customer_phone));
    setActive24hCount(uniquePhones.size);
  };

  const loadCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };

  const loadStats = async () => {
    const [{ count: cCount, data: clients }, { count: sCount, data: students }] = await Promise.all([
      supabase.from("client_accounts").select("id, name, phone, created_at", { count: "exact" }),
      supabase.from("students").select("id, name, phone, created_at", { count: "exact" }),
    ]);
    
    setCounts({
      clients: cCount || 0,
      students: sCount || 0,
      all: (cCount || 0) + (sCount || 0)
    });

    const combined = [
      ...(clients || []).map(c => ({ ...c, type: "client" })),
      ...(students || []).map(s => ({ ...s, type: "student" }))
    ];
    setAllContacts(combined);
  };

  const handleCreate = async () => {
    const total = newCampaign.segment === "all" ? counts.all 
                : newCampaign.segment === "clients" ? counts.clients 
                : counts.students;

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert({
        name: newCampaign.name,
        type: newCampaign.type,
        target_segment: newCampaign.segment,
        content: newCampaign.content,
        subject: newCampaign.subject,
        total_targets: total,
        use_24h_filter: newCampaign.use_24h_filter,
        meta_template_name: newCampaign.meta_template_name,
        template_language: newCampaign.template_language,
        template_variables: newCampaign.template_variables,
        recency_mode: newCampaign.recency_mode,
        recency_days: newCampaign.recency_days,
        specific_recipient_ids: newCampaign.specific_ids,
        status: "draft"
      })
      .select()
      .single();

    if (!error) {
      loadCampaigns();
      setShowWizard(false);
      setStep(1);
    }
  };

  const handleSend = async (campaignId: string) => {
    if (!window.confirm("¿Estás segura? Esta acción enviará mensajes masivamente a todos los contactos seleccionados.")) return;
    
    // Optimistic UI update
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: "sending" } : c));
    
    const { error } = await supabase.functions.invoke("marketing-campaigns", {
      body: { campaignId }
    });

    if (error) {
      alert("Error al iniciar el envío: " + error.message);
      loadCampaigns();
    } else {
      // The function continues in background
      loadCampaigns();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">
        
        {/* Tab Navigation — only WhatsApp/Email campaigns remain here */}
        {/* Push, Automations, Templates and Logs are now at /admin/notificaciones */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-6">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-gray-900 shadow-sm">
            <MessageSquare className="w-3.5 h-3.5" />WhatsApp / Email
          </button>
        </div>

        {/* Original Campaigns Tab */}
        {activeTab === "campaigns" && (<>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campañas de Marketing</h1>
            <p className="text-gray-500 mt-1">Envía promociones masivas por WhatsApp y Email</p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-rose-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nueva Campaña
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Alcance Total</p>
              <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <i className="ri-mail-open-line text-2xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Aperturas</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0)}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <i className="ri-cursor-line text-2xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Clics</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns.reduce((acc, c) => acc + (c.clicked_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Campaign List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-700">Historial de Campañas</h2>
          </div>
          
          {loading ? (
            <div className="p-20 text-center">
              <Loader className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-20 text-center">
              <p className="text-gray-400">No hay campañas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                  <tr>
                    <th className="px-6 py-4">Campaña</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Público</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-center">📈 Éxito</th>
                    <th className="px-6 py-4">Progreso</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          c.type === "whatsapp" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                        }`}>
                          {c.type === "whatsapp" ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                          {c.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-600 capitalize">{c.target_segment}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase ${
                          c.status === "completed" ? "text-emerald-500" : "text-amber-500"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center" title="Aperturas">
                            <p className="text-[10px] font-bold text-emerald-600">{c.opened_count || 0}</p>
                            <i className="ri-mail-open-line text-[10px] text-gray-400"></i>
                          </div>
                          <div className="text-center" title="Clics">
                            <p className="text-[10px] font-bold text-amber-600">{c.clicked_count || 0}</p>
                            <i className="ri-cursor-line text-[10px] text-gray-400"></i>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span>{Math.round((c.sent_count / c.total_targets) * 100 || 0)}%</span>
                            <span>{c.sent_count}/{c.total_targets}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-rose-500 transition-all duration-1000"
                              style={{ width: `${(c.sent_count / c.total_targets) * 100 || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.status === "draft" && (
                          <button 
                            onClick={() => handleSend(c.id)}
                            className="mr-3 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-black transition-colors cursor-pointer flex items-center gap-1 inline-flex"
                          >
                            <Send className="w-3 h-3" /> Lanzar
                          </button>
                        )}
                        <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Wizard Modal */}
        {showWizard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
              <div className="bg-rose-500 p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Crear Nueva Campaña</h3>
                  <p className="text-rose-100 text-xs">Paso {step} de 4</p>
                </div>
                <button onClick={() => setShowWizard(false)} className="text-white/80 hover:text-white cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Campaña</label>
                      <input 
                        type="text" 
                        value={newCampaign.name}
                        onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                        placeholder="Ej: Promo Verano 2024"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-4">Elige el Canal</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setNewCampaign({...newCampaign, type: "whatsapp"})}
                          className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                            newCampaign.type === "whatsapp" ? "border-rose-500 bg-rose-50 text-rose-600" : "border-gray-100 hover:border-gray-200 text-gray-400"
                          }`}
                        >
                          <MessageSquare className="w-8 h-8" />
                          <span className="font-bold">WhatsApp</span>
                        </button>
                        <button 
                          onClick={() => setNewCampaign({...newCampaign, type: "email"})}
                          className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                            newCampaign.type === "email" ? "border-rose-500 bg-rose-50 text-rose-600" : "border-gray-100 hover:border-gray-200 text-gray-400"
                          }`}
                        >
                          <Mail className="w-8 h-8" />
                          <span className="font-bold">Email</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Selecciona tu audiencia</label>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { id: "all", label: "Todos", count: counts.all },
                        { id: "clients", label: "Clientes", count: counts.clients },
                        { id: "students", label: "Alumnas", count: counts.students },
                        { id: "specific", label: "Selección", count: newCampaign.specific_ids.length },
                      ].map(seg => (
                        <button
                          key={seg.id}
                          onClick={() => setNewCampaign({...newCampaign, segment: seg.id as any})}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                            newCampaign.segment === seg.id ? "border-rose-500 bg-rose-50 text-rose-600 font-bold" : "border-gray-50 text-gray-400"
                          }`}
                        >
                          <p className="text-xs uppercase tracking-wider">{seg.label}</p>
                          <p className="text-lg">{seg.count}</p>
                        </button>
                      ))}
                    </div>

                    {newCampaign.segment !== "specific" && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtrar por actividad de citas</p>
                        <div className="grid grid-cols-3 gap-3">
                          {([
                            { id: "none", label: "Sin filtro", desc: "Todo el segmento" },
                            { id: "inactive", label: "Sin agendar", desc: "Hace mucho tiempo" },
                            { id: "recent", label: "Agendó reciente", desc: "Últimos días" },
                          ] as { id: RecencyMode; label: string; desc: string }[]).map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setNewCampaign({ ...newCampaign, recency_mode: opt.id, recency_days: opt.id === "recent" ? 30 : 45 })}
                              className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                                newCampaign.recency_mode === opt.id ? "border-rose-500 bg-rose-50" : "border-gray-100 hover:border-gray-200"
                              }`}
                            >
                              <p className={`text-xs font-bold ${newCampaign.recency_mode === opt.id ? "text-rose-600" : "text-gray-700"}`}>{opt.label}</p>
                              <p className="text-[10px] text-gray-400">{opt.desc}</p>
                            </button>
                          ))}
                        </div>

                        {newCampaign.recency_mode !== "none" && (
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-600">
                                {newCampaign.recency_mode === "inactive" ? "Sin cita desde hace al menos" : "Agendaron en los últimos"}
                              </span>
                              <input
                                type="number"
                                min={1}
                                value={newCampaign.recency_days}
                                onChange={e => setNewCampaign({ ...newCampaign, recency_days: parseInt(e.target.value) || 0 })}
                                className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-rose-500/20"
                              />
                              <span className="text-xs font-bold text-gray-600">días</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-700">
                              <Target className="w-4 h-4" />
                              <p className="text-xs font-bold">
                                {recencyCount(newCampaign.recency_mode, newCampaign.recency_days)} clientas coinciden con este filtro.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(newCampaign.recency_mode === "inactive" ? [45, 60, 90] : [15, 30, 60]).map(d => (
                                <button
                                  key={d}
                                  onClick={() => setNewCampaign({ ...newCampaign, recency_days: d })}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                                    newCampaign.recency_days === d ? "bg-rose-500 text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-rose-200"
                                  }`}
                                >
                                  {d} días
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {newCampaign.segment === "specific" && (
                      <div className="space-y-4">
                        <div className="relative">
                          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                          <input 
                            type="text" 
                            placeholder="Buscar contacto..." 
                            value={searchContact}
                            onChange={e => setSearchContact(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border-none outline-none text-sm focus:ring-2 focus:ring-rose-500/10"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                          {allContacts.filter(c => 
                            c.name?.toLowerCase().includes(searchContact.toLowerCase()) || 
                            c.phone?.includes(searchContact)
                          ).map(c => (
                            <label key={c.id} className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                              <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox"
                                  checked={newCampaign.specific_ids.includes(c.id)}
                                  onChange={e => {
                                    const ids = e.target.checked 
                                      ? [...newCampaign.specific_ids, c.id]
                                      : newCampaign.specific_ids.filter(id => id !== c.id);
                                    setNewCampaign({...newCampaign, specific_ids: ids});
                                  }}
                                  className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-400"
                                />
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{c.name || "Sin nombre"}</p>
                                  <p className="text-[10px] text-gray-400">{c.phone}</p>
                                </div>
                              </div>
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${c.type === "client" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                                {c.type === "client" ? "Cliente" : "Alumna"}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <label className="block text-sm font-bold text-gray-700 mb-4">Configuración de Seguridad {newCampaign.type === "whatsapp" ? "(WhatsApp)" : "(Email)"}</label>
                    
                    <div className="space-y-4">
                      {newCampaign.type === "whatsapp" ? (
                        <>
                          {/* 24h Filter */}
                          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <History className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">Filtro de 24 Horas</p>
                                <p className="text-[10px] text-gray-400">Enviar solo a quienes interactuaron recientemente</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={newCampaign.use_24h_filter}
                                onChange={e => {
                                  setNewCampaign({...newCampaign, use_24h_filter: e.target.checked});
                                  if (e.target.checked) loadActive24h();
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                            </label>
                          </div>

                          {newCampaign.use_24h_filter && (
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold animate-pulse">
                              ✨ ¡Genial! Vas a llegar a {active24hCount} clientas que han estado activas recientemente.
                            </div>
                          )}

                          {/* Meta Template Selector */}
                          {!newCampaign.use_24h_filter && (
                            <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50 flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white">
                                  <Target className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-rose-900">Plantilla Oficial de Meta</p>
                                  <p className="text-[10px] text-rose-600">Obligatorio si quieres enviar fuera de las 24h</p>
                                </div>
                              </div>

                              {templatesLoading ? (
                                <div className="py-6 text-center text-rose-400 text-xs flex items-center justify-center gap-2">
                                  <Loader className="w-4 h-4 animate-spin" /> Cargando plantillas aprobadas...
                                </div>
                              ) : templatesError ? (
                                <div className="p-3 bg-white rounded-xl border border-rose-200 text-[11px] text-rose-700 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {templatesError}
                                </div>
                              ) : metaTemplates.length === 0 ? (
                                <p className="text-[11px] text-rose-500 py-2">No hay plantillas aprobadas. Créalas en Meta Business Manager → WhatsApp Manager → Plantillas.</p>
                              ) : !selectedTemplate ? (
                                <div className="space-y-2 max-h-56 overflow-y-auto">
                                  {metaTemplates.map(t => (
                                    <button
                                      key={`${t.name}_${t.language}`}
                                      onClick={() => selectTemplate(t)}
                                      className="w-full text-left p-3 bg-white border border-rose-100 rounded-xl hover:border-rose-300 transition-colors"
                                    >
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">{t.category}</span>
                                      </div>
                                      <p className="text-[11px] text-gray-500 line-clamp-2 whitespace-pre-wrap">{t.body_text}</p>
                                      {t.variable_count > 0 && (
                                        <p className="text-[10px] text-rose-500 font-semibold mt-1">{t.variable_count} variable{t.variable_count !== 1 ? "s" : ""}</p>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <button
                                    onClick={() => setNewCampaign({ ...newCampaign, meta_template_name: "", template_variables: [] })}
                                    className="text-[11px] text-rose-500 hover:text-rose-700 font-medium"
                                  >
                                    ← Elegir otra plantilla
                                  </button>
                                  <div className="bg-white rounded-xl p-3 border border-rose-100">
                                    <p className="font-semibold text-gray-900 text-sm mb-1">{selectedTemplate.name}</p>
                                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedTemplate.body_text}</p>
                                  </div>

                                  {newCampaign.template_variables.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                                        Variables — se rellenan por clienta automáticamente
                                      </p>
                                      {newCampaign.template_variables.map((v, i) => (
                                        <div key={i} className="bg-white rounded-xl p-3 border border-rose-100 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-[11px] font-bold flex items-center justify-center shrink-0">{`{${i + 1}}`}</span>
                                            <select
                                              value={v.source}
                                              onChange={e => {
                                                const vars = [...newCampaign.template_variables];
                                                vars[i] = { ...vars[i], source: e.target.value as VarSource };
                                                setNewCampaign({ ...newCampaign, template_variables: vars });
                                              }}
                                              className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
                                            >
                                              {(Object.keys(VAR_SOURCE_LABELS) as VarSource[]).map(s => (
                                                <option key={s} value={s}>{VAR_SOURCE_LABELS[s]}</option>
                                              ))}
                                            </select>
                                          </div>
                                          {v.source === "fixed" ? (
                                            <input
                                              type="text"
                                              placeholder="Valor para todas (ej: 15%)"
                                              value={v.value || ""}
                                              onChange={e => {
                                                const vars = [...newCampaign.template_variables];
                                                vars[i] = { ...vars[i], value: e.target.value };
                                                setNewCampaign({ ...newCampaign, template_variables: vars });
                                              }}
                                              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
                                            />
                                          ) : (
                                            <input
                                              type="text"
                                              placeholder="Valor de reserva si falta el dato (ej: amiga)"
                                              value={v.fallback || ""}
                                              onChange={e => {
                                                const vars = [...newCampaign.template_variables];
                                                vars[i] = { ...vars[i], fallback: e.target.value };
                                                setNewCampaign({ ...newCampaign, template_variables: vars });
                                              }}
                                              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
                                            />
                                          )}
                                        </div>
                                      ))}
                                      <p className="text-[9px] text-rose-400">
                                        Si una clienta no tiene el dato (p. ej. sin próxima cita) y no hay valor de reserva, se omite su envío para no mandar un mensaje roto.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8" />
                          </div>
                          <p className="text-sm font-bold text-gray-700 mb-1">Configuración Inteligente de Email</p>
                          <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                            El email no tiene restricciones de ventana de 24h. Tu campaña se enviará de forma segura con tracking de apertura y clics activado.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    {/* Image Support */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Imagen de la Campaña (Opcional)</label>
                      <div className="flex gap-4 items-start">
                        <div className="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                          {newCampaign.image_url ? (
                            <img src={newCampaign.image_url} className="w-full h-full object-cover" />
                          ) : (
                            <i className="ri-image-add-line text-3xl text-gray-300"></i>
                          )}
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const { data, error } = await supabase.storage.from("campaigns").upload(`${Date.now()}-${file.name}`, file);
                                if (data) {
                                  const { data: { publicUrl } } = supabase.storage.from("campaigns").getPublicUrl(data.path);
                                  setNewCampaign({...newCampaign, image_url: publicUrl});
                                }
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <button 
                            onClick={async () => {
                              const prompt = window.prompt("Describe la imagen que quieres generar (ej: Elegant pink nails with glitter)");
                              if (prompt) {
                                setIsGenerating(true);
                                const encodedPrompt = encodeURIComponent(prompt);
                                const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
                                
                                // We "pre-load" it to check if it's ready
                                const img = new Image();
                                img.src = imageUrl;
                                img.onload = () => {
                                  setNewCampaign({...newCampaign, image_url: imageUrl});
                                  setIsGenerating(false);
                                };
                              }
                            }}
                            className="w-full py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                            disabled={isGenerating}
                          >
                            {isGenerating ? "🎨 Generando..." : "🎨 Generar imagen con IA"}
                          </button>
                          <p className="text-[10px] text-gray-400">La imagen aparecerá como una tarjeta enriquecida en WhatsApp o en el cuerpo del email.</p>
                        </div>
                      </div>
                    </div>

                    {newCampaign.type === "email" && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Asunto del Email</label>
                        <input 
                          type="text" 
                          value={newCampaign.subject}
                          onChange={e => setNewCampaign({...newCampaign, subject: e.target.value})}
                          placeholder="Ej: ¡Sorpresa! Mira lo que tenemos para ti 💅"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                        />
                      </div>
                    )}

                    {newCampaign.type === "whatsapp" && selectedTemplate && !newCampaign.use_24h_filter ? (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Vista previa de la plantilla</label>
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {renderPreview(
                              selectedTemplate.body_text,
                              newCampaign.template_variables.map(v =>
                                v.source === "fixed" ? (v.value || `{ejemplo}`) :
                                v.source === "name" ? "María" :
                                v.source === "next_booking_date" ? "jueves 5 de junio" :
                                v.source === "last_booking_date" ? "lunes 14 de abril" :
                                v.source === "next_booking_time" ? "17:30" :
                                v.source === "professional" ? "Laura" : 
                                v.source === "points" ? "350" : `{${v.source}}`
                              )
                            )}
                          </p>
                          <p className="text-[10px] text-emerald-600 mt-3 font-medium">
                            Ejemplo con datos de muestra. Cada clienta recibe sus propios datos.
                          </p>
                        </div>
                      </div>
                    ) : (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm font-bold text-gray-700">Mensaje</label>
                        <button
                          onClick={async () => {
                            const topic = window.prompt("¿De qué quieres que trate el mensaje? (ej: Promoción de uñas de gel para San Valentín)");
                            if (topic) {
                              setIsGenerating(true);
                              try {
                                const response = await fetch("https://text.pollinations.ai/", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    messages: [
                                      { role: "system", content: "Eres un experto en marketing para salones de manicura y pedicura. Escribe mensajes cortos, persuasivos y cariñosos. Usa emojis. Importante: usa {{name}} para referirte al cliente." },
                                      { role: "user", content: `Escribe un mensaje de marketing para WhatsApp sobre: ${topic}` }
                                    ]
                                  })
                                });
                                const text = await response.text();
                                setNewCampaign({...newCampaign, content: text});
                              } catch (err) {
                                alert("Error al generar el texto. Inténtalo de nuevo.");
                              } finally {
                                setIsGenerating(false);
                              }
                            }
                          }}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          disabled={isGenerating}
                        >
                          {isGenerating ? "🪄 Generando..." : "🪄 Redactar con IA"}
                        </button>
                      </div>
                      <textarea 
                        value={newCampaign.content}
                        onChange={e => setNewCampaign({...newCampaign, content: e.target.value})}
                        rows={6}
                        placeholder={newCampaign.type === "whatsapp" ? "Hola! Queremos informarte que..." : "Estimada clienta,\n\nLe escribimos para..."}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none font-sans"
                      />
                    </div>
                    )}
                  </div>
                )}

                <div className="mt-8 flex justify-between">
                  <button 
                    onClick={() => step > 1 ? setStep(step - 1) : setShowWizard(false)}
                    className="px-6 py-2.5 text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                  >
                    {step === 1 ? "Cancelar" : "Atrás"}
                  </button>
                  <button 
                    onClick={() => step < 4 ? setStep(step + 1) : handleCreate()}
                    disabled={step === 1 && !newCampaign.name}
                    className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold shadow-xl hover:bg-gray-800 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {step === 4 ? "Crear Campaña" : "Siguiente"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </>)}
      </main>
    </div>
  );
}

// Additional Icons needed
function ShoppingBag(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
