import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { useSEO } from "@/hooks/useSEO";
import {
  Users,
  Star,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Profile {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_professional: boolean;
  role: string;
  created_at: string;
}

interface Schedule {
  profile_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

type FilterMode = "professionals" | "all";

interface NewProfForm {
  name: string;
  email: string;
  phone: string;
}

const EMPTY_FORM: NewProfForm = {
  name: "",
  email: "",
  phone: "",
};

export default function AdminProfesionalesPage() {
  useSEO({
    title: "Profesionales — Admin CALUATNAILS",
    description: "Gestión del equipo de profesionales del salón.",
    canonical: "/admin/profesionales",
    noindex: true,
  });

  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("professionals");
  const [search, setSearch] = useState("");

  // New professional modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewProfForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [profsRes, schedsRes, booksRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, email, phone, avatar_url, is_professional, role, created_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("professional_schedules")
          .select("profile_id, day_of_week, is_working, start_time, end_time"),
        supabase
          .from("bookings")
          .select("professional_id")
          .neq("status", "cancelled"),
      ]);

      if (profsRes.error) {
        setLoadError(`Error al leer profiles: ${profsRes.error.message} (código: ${profsRes.error.code})`);
        setAllProfiles([]);
      } else {
        setAllProfiles((profsRes.data ?? []) as Profile[]);
      }

      setSchedules((schedsRes.data ?? []) as Schedule[]);

      const counts: Record<string, number> = {};
      (booksRes.data ?? []).forEach((b: { professional_id: string }) => {
        if (b.professional_id) {
          counts[b.professional_id] = (counts[b.professional_id] || 0) + 1;
        }
      });
      setBookingCounts(counts);
    } catch (e: any) {
      setLoadError(e?.message ?? "Error desconocido al cargar perfiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleProfessional = async (profile: Profile) => {
    setSavingId(profile.id);
    try {
      const newVal = !profile.is_professional;
      const { error } = await supabase
        .from("profiles")
        .update({ is_professional: newVal })
        .eq("id", profile.id);

      if (!error) {
        // Sincronizar también con professional_settings para reservas públicas
        await supabase.from("professional_settings").upsert({
          profile_id: profile.id,
          display_name: profile.name || profile.email,
          is_active: newVal,
          slot_duration_minutes: 30,
          buffer_minutes: 5,
        });

        setAllProfiles((prev) =>
          prev.map((p) => p.id === profile.id ? { ...p, is_professional: newVal } : p)
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateProfessional = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setSaveError("Nombre y email son obligatorios.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    try {
      const email = form.email.trim().toLowerCase();
      const name = form.name.trim();

      // 1. Crear usuario en auth — esto satisface la FK de profiles
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: "Caluatnails2024!",
        options: { data: { name } },
      });

      if (authError) {
        setSaveError(authError.message);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setSaveError("No se pudo obtener el ID del usuario creado.");
        return;
      }

      // 2. Upsert del perfil con datos de profesional
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          name,
          email,
          phone: form.phone.trim() || null,
          is_professional: true,
          role: "professional",
        });

      if (profileError) {
        setSaveError(profileError.message);
        return;
      }

      // 3. Crear o actualizar la configuración de reservas públicas en professional_settings
      await supabase.from("professional_settings").upsert({
        profile_id: userId,
        display_name: name,
        is_active: true,
        slot_duration_minutes: 30,
        buffer_minutes: 5,
      });

      setSaveSuccess(true);
      setForm(EMPTY_FORM);
      await load();
      setTimeout(() => {
        setSaveSuccess(false);
        setShowModal(false);
        setFilterMode("professionals");
      }, 1500);
    } catch (e: any) {
      setSaveError(e?.message ?? "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  // Filtered list
  const displayed = allProfiles.filter((p) => {
    const matchesSearch =
      !search ||
      (p.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filterMode === "all" ||
      p.is_professional ||
      p.role === "admin" ||
      p.role === "professional";

    return matchesSearch && matchesFilter;
  });

  const professionals = allProfiles.filter(
    (p) => p.is_professional || p.role === "admin" || p.role === "professional"
  );

  const getScheduleForPro = (proId: string) =>
    schedules.filter((s) => s.profile_id === proId);

  const workingDays = (proId: string) =>
    getScheduleForPro(proId)
      .filter((s) => s.is_working)
      .map((s) => DAYS[s.day_of_week])
      .join(", ") || "Sin horario registrado";

  const getInitials = (p: Profile) =>
    (p.name ?? p.email).slice(0, 2).toUpperCase();

  const totalBookings = Object.values(bookingCounts).reduce((a, b) => a + b, 0);
  const todayDow = new Date().getDay();


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-organic-cream/40 via-white to-organic-blush/20">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-1">
              CALUATNAILS · Administración
            </p>
            <h1 className="font-playfair text-2xl sm:text-3xl font-extrabold text-gray-900">
              Equipo de Profesionales
            </h1>
            <p className="text-gray-500 text-sm font-medium mt-1">
              Gestiona los miembros del equipo, horarios y métricas de rendimiento.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => load()}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
              title="Recargar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowModal(true); setSaveError(null); setSaveSuccess(false); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-soft-xs hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva Profesional
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Equipo Activo", value: professionals.length, icon: <Users className="w-5 h-5" />, color: "rose", sub: `de ${allProfiles.length} perfiles` },
            {
              label: "Trabajan Hoy", icon: <CheckCircle2 className="w-5 h-5" />, color: "emerald", sub: "en el salón",
              value: professionals.filter((pro) => schedules.find((s) => s.profile_id === pro.id && s.day_of_week === todayDow && s.is_working)).length,
            },
            { label: "Citas Totales", value: totalBookings, icon: <Clock className="w-5 h-5" />, color: "blue", sub: "no canceladas" },
            {
              label: "Rating Medio", icon: <Star className="w-5 h-5" />, color: "amber", sub: "valoración media",
              value: "—",
            },
          ].map((card) => (
            <Card key={card.label} variant="glass" padding="md" className="space-y-1.5">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center bg-${card.color}-50 text-${card.color}-500`}>{card.icon}</div>
              <p className="text-2xl font-extrabold text-gray-900">{card.value}</p>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
              <p className="text-[10px] text-gray-400">{card.sub}</p>
            </Card>
          ))}
        </div>

        {/* RLS / Load Error Banner */}
        {loadError && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Error al cargar los perfiles</p>
              <p className="text-xs text-red-600 font-mono mt-1 break-all">{loadError}</p>
            </div>
          </div>
        )}

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o especialidad…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-rose-300 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <button onClick={() => setFilterMode("professionals")} className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${filterMode === "professionals" ? "bg-rose-500 text-white" : "text-gray-500 hover:text-rose-500"}`}>
              Equipo ({professionals.length})
            </button>
            <button onClick={() => setFilterMode("all")} className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${filterMode === "all" ? "bg-rose-500 text-white" : "text-gray-500 hover:text-rose-500"}`}>
              Todos ({allProfiles.length})
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm font-medium">
            <span className="animate-pulse">Cargando perfiles…</span>
          </div>
        ) : displayed.length === 0 ? (
          <Card variant="glass" padding="lg" className="text-center py-16">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold text-sm">No se encontraron perfiles.</p>
            <p className="text-gray-400 text-xs mt-1">Cambia a <strong>Todos</strong> o usa el botón <strong>Nueva Profesional</strong>.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayed.map((pro) => {
              const isExpanded = expandedId === pro.id;
              const proSchedules = getScheduleForPro(pro.id);
              const todaySched = proSchedules.find((s) => s.day_of_week === todayDow);
              const isWorkingToday = todaySched?.is_working ?? false;
              const proBookings = bookingCounts[pro.id] ?? 0;
              const isSaving = savingId === pro.id;

              return (
                <Card key={pro.id} variant="glass" padding="md" className="transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {pro.avatar_url ? (
                        <img src={pro.avatar_url} alt={pro.name ?? pro.email} className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-100" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-extrabold text-lg">
                          {getInitials(pro)}
                        </div>
                      )}
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isWorkingToday ? "bg-emerald-400" : "bg-gray-300"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-playfair text-base font-extrabold text-gray-900 truncate">{pro.name ?? "Sin nombre"}</h2>
                        {pro.role === "admin" && <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">Admin</span>}
                        {(pro.is_professional || pro.role === "professional") && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Profesional</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">{pro.email}</p>
                    </div>

                    <div className="hidden md:flex items-center gap-5 text-center shrink-0">
                      <div>
                        <p className="text-lg font-extrabold text-gray-900">{proBookings}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Citas</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => toggleProfessional(pro)}
                          disabled={isSaving}
                          className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                            pro.is_professional || pro.role === "professional"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                              : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500"
                          } ${isSaving ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                        >
                          {isSaving ? <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" /> : (pro.is_professional || pro.role === "professional") ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          {(pro.is_professional || pro.role === "professional") ? "Activa" : "Inactiva"}
                        </button>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Profesional</p>
                      </div>
                    </div>

                    <button onClick={() => setExpandedId(isExpanded ? null : pro.id)} className="ml-2 w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-rose-100/60 space-y-5">
                      {pro.bio && <p className="text-sm text-gray-600 leading-relaxed font-medium">{pro.bio}</p>}
                      <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600">
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-rose-400" />{pro.email}</span>
                        {pro.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-rose-400" />{pro.phone}</span>}
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">Horario Semanal</p>
                        {proSchedules.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Sin horario registrado.</p>
                        ) : (
                          <>
                            <div className="grid grid-cols-7 gap-1.5">
                              {[0,1,2,3,4,5,6].map((dow) => {
                                const sched = proSchedules.find((s) => s.day_of_week === dow);
                                const working = sched?.is_working;
                                return (
                                  <div key={dow} className={`rounded-xl p-2 text-center text-[10px] font-bold ${working ? "bg-rose-50 border border-rose-200 text-rose-600" : "bg-gray-50 border border-gray-100 text-gray-300"}`}>
                                    <p className="uppercase">{DAYS[dow]}</p>
                                    {working ? <p className="mt-0.5 text-emerald-600 font-extrabold">{sched!.start_time.slice(0, 5)}</p> : <XCircle className="w-3 h-3 text-gray-200 mx-auto mt-0.5" />}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2 font-medium">Días: {workingDays(pro.id)}</p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 pt-1 flex-wrap">
                        <button onClick={() => alert("Editor próximamente")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors">
                          <Pencil className="w-3.5 h-3.5" /> Editar Perfil
                        </button>
                        <a href={`/admin/agenda?profesional=${pro.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors">
                          <Clock className="w-3.5 h-3.5" /> Ver Agenda
                        </a>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* ── New Professional Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-rose-100">
              <div>
                <h2 className="font-playfair text-lg font-extrabold text-gray-900">Nueva Profesional</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Se creará el perfil en la base de datos</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {saveSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-emerald-600">
                  <CheckCircle2 className="w-12 h-12" />
                  <p className="font-bold text-base">¡Profesional creada con éxito!</p>
                </div>
              ) : (
                <>
                  {[
                    { field: "name", label: "Nombre *", placeholder: "Ej: Karol", type: "text" },
                    { field: "email", label: "Email *", placeholder: "Ej: karol@caluatnails.com", type: "email" },
                    { field: "phone", label: "Teléfono", placeholder: "+34 600 000 000", type: "tel" },
                  ].map(({ field, label, placeholder, type }) => (
                    <div key={field}>
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
                      <input
                        type={type}
                        value={form[field as keyof NewProfForm]}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none focus:border-rose-300 bg-gray-50"
                      />
                    </div>
                  ))}

                  {saveError && (
                    <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-semibold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{saveError}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!saveSuccess && (
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProfessional}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {saving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                  {saving ? "Guardando…" : "Crear Profesional"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
