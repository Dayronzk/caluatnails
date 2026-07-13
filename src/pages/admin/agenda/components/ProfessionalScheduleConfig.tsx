import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const DAYS = [
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

interface DaySchedule {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

interface ProfessionalInfo {
  display_name: string;
  bio: string;
  slot_duration_minutes: number;
  buffer_minutes: number;
  is_active: boolean;
  google_calendar_connected: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;

interface Props {
  adminProId?: string; // If provided, admin is editing this specific pro
  onClose?: () => void;
}

export default function ProfessionalScheduleConfig({ adminProId, onClose }: Props) {
  const { user, isAdmin } = useAuth();
  const [selectedProId, setSelectedProId] = useState<string>(adminProId || user?.id || "");
  const targetId = adminProId || selectedProId;

  const [profsList, setProfsList] = useState<{ id: string; name: string }[]>([]);

  const [info, setInfo] = useState<ProfessionalInfo>({
    display_name: "",
    bio: "",
    slot_duration_minutes: 30,
    buffer_minutes: 10,
    is_active: true,
    google_calendar_connected: false,
  });
  const [schedules, setSchedules] = useState<DaySchedule[]>(
    DAYS.map(d => ({ day_of_week: d.value, is_working: d.value >= 1 && d.value <= 5, start_time: "09:00", end_time: "19:00" }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [services, setServices] = useState<{ id: string; name: string; service_type: string }[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin && !adminProId) {
      loadProfsList();
    }
  }, [isAdmin, adminProId]);

  useEffect(() => {
    if (!targetId) return;
    loadData();
  }, [targetId]);

  const loadProfsList = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, role, is_professional')
      .or('role.eq.admin,is_professional.eq.true');
    
    if (profiles) {
      setProfsList(profiles.map(p => ({ id: p.id, name: p.name || 'Profesional' })));
    }
  };

  const loadData = async () => {
    if (!targetId) return;
    setLoading(true);
    const [settingsRes, schedulesRes, tokenRes, servicesRes, profServicesRes] = await Promise.all([
      supabase.from("professional_settings").select("*").eq("profile_id", targetId).maybeSingle(),
      supabase.from("professional_schedules").select("*").eq("profile_id", targetId),
      supabase.from("google_calendar_tokens").select("id").eq("profile_id", targetId).maybeSingle(),
      supabase.from("services").select("id, name, service_type").eq("active", true).order("name"),
      supabase.from("professional_services").select("service_id").eq("profile_id", targetId)
    ]);

    if (settingsRes.data) {
      setInfo({
        display_name: settingsRes.data.display_name ?? "",
        bio: settingsRes.data.bio ?? "",
        slot_duration_minutes: settingsRes.data.slot_duration_minutes ?? 30,
        buffer_minutes: settingsRes.data.buffer_minutes ?? 10,
        is_active: settingsRes.data.is_active ?? true,
        google_calendar_connected: settingsRes.data.google_calendar_connected ?? false,
      });
    }

    if (schedulesRes.data && schedulesRes.data.length > 0) {
      const loaded = schedulesRes.data;
      setSchedules(
        DAYS.map(d => {
          const found = loaded.find((s: any) => s.day_of_week === d.value);
          return found
            ? { day_of_week: d.value, is_working: found.is_working, start_time: found.start_time?.slice(0, 5) ?? "09:00", end_time: found.end_time?.slice(0, 5) ?? "19:00" }
            : { day_of_week: d.value, is_working: d.value >= 1 && d.value <= 5, start_time: "09:00", end_time: "19:00" };
        })
      );
    }

    setGcalConnected(!!tokenRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
    if (profServicesRes.data) setSelectedServiceIds(profServicesRes.data.map((ps: any) => ps.service_id));

    setLoading(false);
  };

  const handleSave = async () => {
    if (!targetId) return;
    setSaving(true);
    try {
      const { error: settingsError } = await supabase.from("professional_settings").upsert({
        profile_id: targetId,
        display_name: info.display_name,
        bio: info.bio,
        slot_duration_minutes: info.slot_duration_minutes,
        buffer_minutes: info.buffer_minutes,
        is_active: info.is_active,
        updated_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });

      if (settingsError) throw settingsError;

      for (const sched of schedules) {
        const { error: schedError } = await supabase.from("professional_schedules").upsert({
          profile_id: targetId,
          day_of_week: sched.day_of_week,
          is_working: sched.is_working,
          start_time: sched.start_time,
          end_time: sched.end_time,
          updated_at: new Date().toISOString(),
        }, { onConflict: "profile_id,day_of_week" });
        if (schedError) throw schedError;
      }

      // Update professional_services
      await supabase.from("professional_services").delete().eq("profile_id", targetId);
      if (selectedServiceIds.length > 0) {
        const { error: profSvcError } = await supabase.from("professional_services").insert(
          selectedServiceIds.map(sid => ({ profile_id: targetId, service_id: sid }))
        );
        if (profSvcError) throw profSvcError;
      }

      setSaved(true);
      if (adminProId && onClose) {
        setTimeout(() => onClose(), 1000);
      } else {
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert("Error al guardar: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleCalendar = async () => {
    if (!targetId) return;
    setGcalLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth?action=authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: targetId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        const popup = window.open(data.url, "google-oauth", "width=600,height=700,left=200,top=100");
        const timer = setInterval(() => {
          if (popup?.closed) {
            clearInterval(timer);
            setGcalLoading(false);
            loadData();
          }
        }, 500);
      } else {
        console.error("Google Calendar auth error:", data.error);
        setGcalLoading(false);
      }
    } catch (e) {
      console.error(e);
      setGcalLoading(false);
    }
  };

  const handleDisconnectGcal = async () => {
    if (!targetId) return;
    await supabase.from("google_calendar_tokens").delete().eq("profile_id", targetId);
    await supabase.from("professional_settings").update({ google_calendar_connected: false }).eq("profile_id", targetId);
    setGcalConnected(false);
    setInfo(prev => ({ ...prev, google_calendar_connected: false }));
  };

  const updateSchedule = (dayValue: number, field: keyof DaySchedule, value: boolean | string) => {
    setSchedules(prev => prev.map(s => s.day_of_week === dayValue ? { ...s, [field]: value } : s));
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId) 
        : [...prev, serviceId]
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500">
            <i className="ri-user-settings-line text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Perfil profesional</h3>
            <p className="text-xs text-gray-400">Así te verán los clientes al reservar</p>
          </div>
        </div>
        <div className="space-y-4">
          {isAdmin && !adminProId && profsList.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Seleccionar Profesional a configurar
              </label>
              <select
                value={selectedProId}
                onChange={e => setSelectedProId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm bg-white cursor-pointer"
              >
                {profsList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre visible</label>
            <input
              type="text"
              value={info.display_name}
              onChange={e => setInfo(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="Ej: María García"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción breve</label>
            <textarea
              value={info.bio}
              onChange={e => setInfo(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Especialista en manicura y nail art..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all resize-none"
            />
          </div>
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-800">¿Disponible para reservas?</p>
              <p className="text-[11px] text-gray-400">Los clientes pueden reservar con este profesional</p>
            </div>
            <button
              type="button"
              onClick={() => setInfo(prev => ({ ...prev, is_active: !prev.is_active }))}
              className={`relative w-12 h-6.5 rounded-full transition-all duration-300 ease-in-out cursor-pointer shadow-inner ${info.is_active ? "bg-rose-500 shadow-rose-200" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 left-1 w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${info.is_active ? "translate-x-5.5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Timing config */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <i className="ri-timer-line text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Tiempos de cita</h3>
            <p className="text-xs text-gray-400">Duración de slots y margen entre citas</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Duración del slot (min)</label>
            <select
              value={info.slot_duration_minutes}
              onChange={e => setInfo(prev => ({ ...prev, slot_duration_minutes: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm bg-white cursor-pointer"
            >
              {[15, 20, 30, 45, 60].map(v => (
                <option key={v} value={v}>{v} min</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Margen entre citas (min)</label>
            <select
              value={info.buffer_minutes}
              onChange={e => setInfo(prev => ({ ...prev, buffer_minutes: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm bg-white cursor-pointer"
            >
              {[0, 5, 10, 15, 20, 30].map(v => (
                <option key={v} value={v}>{v === 0 ? "Sin margen" : `${v} min`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services allowed */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-50 text-purple-500">
            <i className="ri-scissors-line text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Servicios que realiza</h3>
            <p className="text-xs text-gray-400">Selecciona qué servicios puede ofrecer este profesional</p>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from(new Set(services.map(s => s.service_type))).sort().map(type => {
            const categoryServices = services.filter(s => s.service_type === type);
            const allSelected = categoryServices.every(s => selectedServiceIds.includes(s.id));

            const toggleCategory = () => {
              if (allSelected) {
                setSelectedServiceIds(prev => prev.filter(id => !categoryServices.some(s => s.id === id)));
              } else {
                setSelectedServiceIds(prev => {
                  const toAdd = categoryServices.filter(s => !prev.includes(s.id)).map(s => s.id);
                  return [...prev, ...toAdd];
                });
              }
            };

            return (
              <div key={type} className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{type}</h4>
                  <button 
                    type="button"
                    onClick={toggleCategory}
                    className="text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                  >
                    {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoryServices.map(service => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <label 
                        key={service.id} 
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected ? "border-rose-300 bg-rose-50" : "border-gray-200 hover:border-rose-200"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400 cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleService(service.id)}
                        />
                        <span className={`text-sm ${isSelected ? "font-semibold text-rose-800" : "text-gray-700"}`}>
                          {service.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {services.length > 0 && selectedServiceIds.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
              <i className="ri-error-warning-line align-middle mr-1"></i>
              No has seleccionado ningún servicio. El profesional no aparecerá en el calendario de reservas para clientes.
            </p>
          )}
        </div>
      </div>

      {/* Weekly schedule */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-500">
            <i className="ri-calendar-schedule-line text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Horario laboral semanal</h3>
            <p className="text-xs text-gray-400">Define qué días y horas trabaja</p>
          </div>
        </div>
        <div className="space-y-3">
          {DAYS.map(day => {
            const sched = schedules.find(s => s.day_of_week === day.value)!;
            return (
              <div
                key={day.value}
                className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${sched.is_working ? "border-rose-100 bg-rose-50/30" : "border-gray-100 bg-gray-50/50"}`}
              >
                <button
                  type="button"
                  onClick={() => updateSchedule(day.value, "is_working", !sched.is_working)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${sched.is_working ? "bg-rose-500" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${sched.is_working ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className={`text-sm font-medium w-20 flex-shrink-0 ${sched.is_working ? "text-gray-800" : "text-gray-400"}`}>
                  {day.label}
                </span>
                {sched.is_working ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={sched.start_time}
                      onChange={e => updateSchedule(day.value, "start_time", e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-rose-400 outline-none bg-white"
                    />
                    <span className="text-gray-400 text-xs">hasta</span>
                    <input
                      type="time"
                      value={sched.end_time}
                      onChange={e => updateSchedule(day.value, "end_time", e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-rose-400 outline-none bg-white"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">No disponible</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!adminProId && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <i className="ri-google-line text-lg"></i>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Google Calendar</h3>
              <p className="text-xs text-gray-400">Sincroniza tus citas automáticamente</p>
            </div>
          </div>
          {gcalConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <i className="ri-check-line text-sm"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-800">Google Calendar conectado</p>
                  <p className="text-xs text-emerald-600">Las nuevas citas se añadirán automáticamente a tu calendario</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnectGcal}
                className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
              >
                Desconectar Google Calendar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleCalendar}
              disabled={gcalLoading}
              className="w-full py-3 rounded-xl border-2 border-gray-200 hover:border-rose-200 text-sm font-semibold text-gray-700 hover:text-rose-600 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <i className="ri-google-line text-base"></i>Conectar con Google Calendar
            </button>
          )}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar configuración"}
        </button>
      </div>
    </div>
  );

  if (adminProId) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
            <h2 className="font-bold text-gray-900">Configurar Profesional</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
}
