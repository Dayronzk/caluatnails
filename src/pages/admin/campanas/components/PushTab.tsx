import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Send, Users, Calendar, X, Plus, Loader, Zap } from "lucide-react";
import ManualSendModal from "./ManualSendModal";

export default function PushTab() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [manualModal, setManualModal] = useState<{ title: string; body: string; url: string } | null>(null);
  const [form, setForm] = useState({
    name: "", title: "", body: "",
    url: "https://www.nailox.com/mi-cuenta",
    target_segment: "all",
    template_id: "",
    scheduled_at: "",
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ data: camps }, { data: tmpl }, { count }] = await Promise.all([
      supabase.from("notification_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("notification_templates").select("*").order("name"),
      supabase.from("push_subscriptions").select("id", { count: "exact", head: true }),
    ]);
    setCampaigns(camps || []);
    setTemplates(tmpl || []);
    setSubscriberCount(count || 0);
  };

  const handleTemplateSelect = (tid: string) => {
    const t = templates.find(t => t.id === tid);
    if (t) setForm(f => ({ ...f, template_id: tid, title: t.title, body: t.body, url: t.url || f.url }));
  };

  const handleCreate = async () => {
    setCreateError(null);
    const { data, error } = await supabase.from("notification_campaigns").insert({
      name: form.name, title: form.title, body: form.body,
      url: form.url, target_segment: form.target_segment,
      template_id: form.template_id || null,
      scheduled_at: form.scheduled_at || null,
      status: form.scheduled_at ? "scheduled" : "draft",
      total_targets: subscriberCount,
    }).select().single();
    if (error) {
      console.error('[PushTab] Create error:', error);
      setCreateError(error.message);
      return;
    }
    load();
    setShowWizard(false);
    setCreateError(null);
    setForm({ name: "", title: "", body: "", url: "https://www.nailox.com/mi-cuenta", target_segment: "all", template_id: "", scheduled_at: "" });
  };

  const handleSend = async (campaign: any) => {
    if (!confirm(`¿Enviar "${campaign.name}" a ${subscriberCount} suscriptores?`)) return;
    setSending(campaign.id);
    setSendError(null);
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        campaign_id: campaign.id,
        template_type: "campaign",
        title: campaign.title,
        body: campaign.body,
        url: campaign.url,
        _send_all: true,
      }
    });
    if (error) {
      setSendError(`Error al enviar: ${error.message}`);
    }
    await load();
    setSending(null);
  };

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-500",
    scheduled: "bg-blue-50 text-blue-600",
    sending: "bg-amber-50 text-amber-600",
    completed: "bg-emerald-50 text-emerald-600",
    cancelled: "bg-red-50 text-red-500",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Suscriptores", value: subscriberCount, icon: "ri-notification-line", color: "text-rose-500 bg-rose-50" },
          { label: "Campañas Enviadas", value: campaigns.filter(c => c.status === "completed").length, icon: "ri-send-plane-line", color: "text-emerald-500 bg-emerald-50" },
          { label: "Programadas", value: campaigns.filter(c => c.status === "scheduled").length, icon: "ri-calendar-schedule-line", color: "text-blue-500 bg-blue-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
              <i className={`${s.icon} text-xl`} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {sendError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-red-600 font-medium">{sendError}</p>
          <button onClick={() => setSendError(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-gray-900">Campañas Push</h2>
        <button onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-rose-500/20">
          <Plus className="w-4 h-4" /> Nueva Campaña Push
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay campañas push todavía</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
              <tr>
                <th className="px-5 py-3">Campaña</th>
                <th className="px-5 py-3">Mensaje</th>
                <th className="px-5 py-3">Programación</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                    <p className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString("es-ES")}</p>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-xs font-semibold text-gray-700 truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{c.body}</p>
                  </td>
                  <td className="px-5 py-4">
                    {c.scheduled_at ? (
                      <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.scheduled_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : <span className="text-xs text-gray-400">Manual</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColor[c.status] || "bg-gray-100 text-gray-500"}`}>
                      {c.status}
                    </span>
                    {c.sent_count > 0 && <p className="text-[10px] text-gray-400 mt-0.5">{c.sent_count}/{c.total_targets} enviados</p>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {(c.status === "draft" || c.status === "scheduled") && (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setManualModal({ title: c.title, body: c.body, url: c.url })}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors">
                          <Zap className="w-3 h-3" /> Manual
                        </button>
                        <button onClick={() => handleSend(c)} disabled={!!sending}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                          {sending === c.id ? <Loader className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Todos
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Nueva Campaña Push</h3>
                <p className="text-rose-100 text-xs">Llegará a {subscriberCount} suscriptores</p>
              </div>
              <button onClick={() => setShowWizard(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Usar plantilla (opcional)</label>
                <select value={form.template_id} onChange={e => handleTemplateSelect(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-rose-500/20">
                  <option value="">— Crear desde cero —</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {[
                { label: "Nombre interno", key: "name", placeholder: "Ej: Promo Mayo 2025" },
                { label: "Título de la notificación", key: "title", placeholder: "Ej: ¡Oferta especial! 💅" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                  <input type="text" value={(form as any)[f.key]} placeholder={f.placeholder}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Cuerpo del mensaje</label>
                <textarea value={form.body} rows={3} placeholder="Escribe el mensaje de la notificación..."
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">URL al pulsar</label>
                <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Programar envío (opcional)</label>
                <input type="datetime-local" value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                <p className="text-[10px] text-gray-400 mt-1">Déjalo vacío para enviar manualmente cuando quieras.</p>
              </div>
            </div>
              {createError && (
                <div className="px-6 pb-2">
                  <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{createError}</p>
                </div>
              )}
              <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={() => setShowWizard(false)} className="px-5 py-2.5 text-gray-500 font-medium text-sm">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.name || !form.title || !form.body}
                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 disabled:opacity-50">
                Crear Campaña
              </button>
            </div>
          </div>
        </div>
      )}
      {manualModal && (
        <ManualSendModal
          defaultTitle={manualModal.title}
          defaultBody={manualModal.body}
          defaultUrl={manualModal.url}
          templateType="campaign"
          onClose={() => setManualModal(null)}
        />
      )}
    </div>
  );
}
