import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Bell, Mail, MessageCircle, Search, AlertCircle, CheckCircle, MinusCircle } from "lucide-react";

const CHANNEL_META: Record<string, { label: string; icon: typeof Bell; color: string; bg: string }> = {
  push:      { label: "Push",     icon: Bell,          color: "text-violet-600", bg: "bg-violet-50" },
  email:     { label: "Email",    icon: Mail,          color: "text-blue-600",   bg: "bg-blue-50" },
  whatsapp:  { label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600",bg: "bg-emerald-50" },
};

const EMAIL_TYPE_LABEL: Record<string, string> = {
  welcome:               "Bienvenida",
  signup_confirmation:   "Confirmación de cuenta",
  verify_email:          "Verificar email",
  password_reset:        "Recuperar contraseña",
  booking_confirmation:  "Confirmación de cita",
  booking_reminder:      "Recordatorio de cita",
  booking_new_admin:     "Nueva reserva (admin)",
  booking_cancelled:     "Cita cancelada",
  purchase_confirmation: "Confirmación de compra",
  newsletter_welcome:    "Bienvenida newsletter",
  new_booking:           "Nueva cita (push)",
  reminder_30min:        "Recordatorio 30 min",
  appointment_reminder:  "Recordatorio de cita",
  review_request:        "Pedir reseña",
  reactivation:          "Reactivación de cliente",
  birthday:              "Cumpleaños",
  campaign:              "Campaña push",
};

type ChannelFilter = "all" | "push" | "email" | "whatsapp";
type StatusFilter  = "all" | "sent" | "failed" | "skipped";

export default function NotificationLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [status, setStatus]   = useState<StatusFilter>("all");
  const [search, setSearch]   = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notification_logs")
      .select(`*, client_accounts(name), profiles(name)`)
      .order("sent_at", { ascending: false })
      .limit(500);
    setLogs(data || []);
    setLoading(false);
  };

  // Backwards compat: old push records have channel=null
  const getChannel = (log: any) => log.channel || 'push';

  const filtered = logs.filter(l => {
    const ch = getChannel(l);
    if (channel !== "all" && ch !== channel) return false;
    if (status  !== "all" && l.status  !== status)  return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (l.client_accounts?.name || l.recipient_name || l.recipient_email || "").toLowerCase();
      const title = (l.title || "").toLowerCase();
      const type  = (l.notification_type || l.template_type || "").toLowerCase();
      if (!name.includes(q) && !title.includes(q) && !type.includes(q)) return false;
    }
    return true;
  });

  const pushCount     = logs.filter(l => getChannel(l) === "push").length;
  const emailCount    = logs.filter(l => getChannel(l) === "email").length;
  const whatsappCount = logs.filter(l => getChannel(l) === "whatsapp").length;
  const failedCount   = logs.filter(l => l.status === "failed").length;
  const skippedCount  = logs.filter(l => l.status === "skipped").length;

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Push",     value: pushCount,     icon: Bell,          color: "text-violet-500 bg-violet-50" },
          { label: "Email",    value: emailCount,    icon: Mail,          color: "text-blue-500 bg-blue-50" },
          { label: "WhatsApp", value: whatsappCount, icon: MessageCircle, color: "text-emerald-500 bg-emerald-50" },
          { label: "Omitidas", value: skippedCount,  icon: MinusCircle,   color: "text-amber-500 bg-amber-50" },
          { label: "Fallidas", value: failedCount,   icon: AlertCircle,   color: "text-red-400 bg-red-50" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Channel filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(["all", "push", "email", "whatsapp"] as ChannelFilter[]).map(c => (
            <button key={c} onClick={() => setChannel(c)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                channel === c ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {c === "all" ? "Todos los canales"
                : c === "push" ? <><Bell className="w-3 h-3" />Push</>
                : c === "email" ? <><Mail className="w-3 h-3" />Email</>
                : <><MessageCircle className="w-3 h-3" />WhatsApp</>
              }
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(["all", "sent", "skipped", "failed"] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                status === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {s === "all" ? "Todos"
                : s === "sent" ? "✅ Enviados"
                : s === "skipped" ? "⊘ Omitidos"
                : "❌ Fallidos"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, asunto o tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
          />
        </div>

        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors disabled:opacity-50 ml-auto">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay notificaciones que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">
                <tr>
                  <th className="px-5 py-3">Canal</th>
                  <th className="px-5 py-3">Destinatario</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Asunto / Mensaje</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(log => {
                  const ch = CHANNEL_META[getChannel(log)] || CHANNEL_META.push;
                  const ChIcon = ch.icon;
                  const recipientName = log.client_accounts?.name || log.profiles?.name || log.recipient_name || log.recipient_email || "—";
                  const typeLabel = EMAIL_TYPE_LABEL[log.notification_type || log.template_type || ""] || (log.notification_type || log.template_type || "Notificación");
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ch.bg}`}>
                          <ChIcon className={`w-3.5 h-3.5 ${ch.color}`} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-bold text-gray-900">{recipientName}</p>
                        {log.recipient_email && log.recipient_email !== recipientName && (
                          <p className="text-[10px] text-gray-400">{log.recipient_email}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-xs font-medium text-gray-700 truncate">{log.title}</p>
                        <p className="text-[10px] text-gray-400 truncate">{log.body}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {log.status === "sent" ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                            <CheckCircle className="w-3 h-3" />Enviado
                          </span>
                        ) : log.status === "skipped" ? (
                          <div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-fit">
                              <MinusCircle className="w-3 h-3" />Omitido
                            </span>
                            {log.error_message && (
                              <p className="text-[9px] text-amber-500 mt-0.5 max-w-[140px] truncate" title={log.error_message}>
                                {log.error_message}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full w-fit">
                              <AlertCircle className="w-3 h-3" />Fallido
                            </span>
                            {log.error_message && (
                              <p className="text-[9px] text-red-400 mt-0.5 max-w-[140px] truncate" title={log.error_message}>
                                {log.error_message}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[10px] text-gray-400 whitespace-nowrap">
                        {log.sent_at
                          ? new Date(log.sent_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
              <p className="text-[10px] text-gray-400">
                Mostrando <strong>{filtered.length}</strong> de <strong>{logs.length}</strong> registros
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
