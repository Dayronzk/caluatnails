
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Zap, Bell, Clock, Save, CheckCircle, 
  Settings2, UserCheck, CalendarDays, Loader2,
  Plus, X, Trash2, Power, Users
} from "lucide-react";

interface Automation {
  id: string;
  name: string;
  target_audience: string;
  schedule: string[];
  is_active: boolean;
  template_id?: string;
  template?: {
    id: string;
    title: string;
  };
}

interface Template {
  id: string;
  title: string;
  type: string;
}

export default function AutomationsTab() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingAuto, setEditingAuto] = useState<Automation | null>(null);
  const [newAuto, setNewAuto] = useState({
    name: "",
    target_audience: "all_staff",
    schedule: ["09:00"],
    template_id: ""
  });

  useEffect(() => {
    loadAutomations();
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("notification_templates")
      .select("id, title, type")
      .order("type", { ascending: true });
    if (data) setTemplates(data);
  };

  const loadAutomations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("automations")
      .select("*, template:notification_templates(id, title)")
      .order("created_at", { ascending: true });
    
    if (data) setAutomations(data);
    setLoading(false);
  };

  const handleToggle = async (auto: Automation) => {
    setSaving(auto.id);
    const { error } = await supabase
      .from("automations")
      .update({ is_active: !auto.is_active })
      .eq("id", auto.id);
    
    if (!error) {
      setAutomations(prev => prev.map(a => a.id === auto.id ? { ...a, is_active: !a.is_active } : a));
    }
    setSaving(null);
  };

  const handleUpdateSchedule = async (auto: Automation, newSchedule: string[]) => {
    setSaving(auto.id);
    const { error } = await supabase
      .from("automations")
      .update({ schedule: newSchedule })
      .eq("id", auto.id);
    
    if (!error) {
      setAutomations(prev => prev.map(a => a.id === auto.id ? { ...a, schedule: newSchedule } : a));
    }
    setSaving(null);
  };

  const handleCreateOrUpdate = async () => {
    setLoading(true);
    if (editingAuto) {
      const { error } = await supabase
        .from("automations")
        .update({
          name: newAuto.name,
          target_audience: newAuto.target_audience,
          template_id: newAuto.template_id || null
        })
        .eq("id", editingAuto.id);
      
      if (!error) {
        loadAutomations();
        setShowNewModal(false);
        setEditingAuto(null);
      }
    } else {
      const { data, error } = await supabase
        .from("automations")
        .insert([newAuto])
        .select()
        .single();
      
      if (!error && data) {
        loadAutomations(); // Reload to get template details
        setShowNewModal(false);
        setNewAuto({ name: "", target_audience: "all_staff", schedule: ["09:00"], template_id: "" });
      }
    }
    setLoading(false);
  };

  const startEdit = (auto: Automation) => {
    setEditingAuto(auto);
    setNewAuto({
      name: auto.name,
      target_audience: auto.target_audience,
      schedule: auto.schedule,
      template_id: auto.template_id || ""
    });
    setShowNewModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás segura de eliminar esta automatización?")) return;
    setSaving(id);
    const { error } = await supabase.from("automations").delete().eq("id", id);
    if (!error) {
      setAutomations(prev => prev.filter(a => a.id !== id));
    }
    setSaving(null);
  };

  if (loading && automations.length === 0) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Centro de Automatizaciones</h2>
          <p className="text-sm text-gray-500">Crea y gestiona avisos recurrentes para el equipo y clientas</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-2xl text-sm font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nueva Automatización
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.map(auto => (
          <div key={auto.id} className={`bg-white rounded-[2.5rem] border p-6 transition-all shadow-sm ${auto.is_active ? 'border-gray-100 shadow-gray-200/50' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  auto.name.includes('Disponibilidad') ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {auto.name.includes('Disponibilidad') ? <Zap className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{auto.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{auto.target_audience.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => startEdit(auto)}
                  className="p-2 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleToggle(auto)}
                  className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${auto.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${auto.is_active ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {auto.template && (
                <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Contenido de notificación</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-rose-600 truncate">{auto.template.title}</p>
                  </div>
                </div>
              )}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Horario de ejecución</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {auto.schedule.map(h => (
                    <div key={h} className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-gray-200 shadow-sm group">
                      <span className="text-xs font-bold text-gray-700">{h}</span>
                      <button 
                        onClick={() => handleUpdateSchedule(auto, auto.schedule.filter(i => i !== h))}
                        className="text-gray-300 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    id={`new-time-${auto.id}`}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById(`new-time-${auto.id}`) as HTMLInputElement;
                      if (input?.value && !auto.schedule.includes(input.value)) {
                        handleUpdateSchedule(auto, [...auto.schedule, input.value].sort());
                        input.value = "";
                      }
                    }}
                    className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[9px] text-gray-400 italic">ID: {auto.id.substring(0, 8)}...</p>
                <button 
                  onClick={() => handleDelete(auto.id)}
                  className="p-2 text-gray-300 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {saving === auto.id && (
              <div className="absolute inset-0 bg-white/40 rounded-[2.5rem] flex items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Automation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 pb-4 flex justify-between items-center">
              <h3 className="text-2xl font-black text-gray-900">{editingAuto ? "Editar" : "Nueva"} Automatización</h3>
              <button onClick={() => { setShowNewModal(false); setEditingAuto(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 pt-4 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre del Aviso</label>
                <input 
                  type="text" 
                  value={newAuto.name}
                  onChange={e => setNewAuto({...newAuto, name: e.target.value})}
                  placeholder="Ej: Aviso de Limpieza Semanal"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-50/50 outline-none transition-all font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Plantilla a enviar</label>
                <select 
                  value={newAuto.template_id}
                  onChange={e => setNewAuto({...newAuto, template_id: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-50/50 outline-none transition-all font-bold text-gray-900"
                >
                  <option value="">(Solo lógica de disponibilidad)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dirigido a</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'all_staff', label: 'Todo el Equipo', icon: <Users className="w-4 h-4" /> },
                    { id: 'admins', label: 'Solo Admins', icon: <UserCheck className="w-4 h-4" /> },
                    { id: 'professionals', label: 'Solo Profesionales', icon: <Zap className="w-4 h-4" /> },
                    { id: 'clients', label: 'Todas las Clientas', icon: <CalendarDays className="w-4 h-4" /> },
                  ].map(aud => (
                    <button
                      key={aud.id}
                      onClick={() => setNewAuto({...newAuto, target_audience: aud.id})}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                        newAuto.target_audience === aud.id ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-50 text-gray-400'
                      }`}
                    >
                      {aud.icon}
                      <span className="text-xs font-bold">{aud.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => { setShowNewModal(false); setEditingAuto(null); }}
                  className="flex-1 py-4 text-gray-500 font-bold hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateOrUpdate}
                  disabled={!newAuto.name}
                  className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-200 hover:bg-black transition-all disabled:opacity-50"
                >
                  {editingAuto ? "Guardar Cambios" : "Crear Automatización"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
