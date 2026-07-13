import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, Phone, Clock, CheckCheck, AlertCircle } from "lucide-react";

export default function WhatsAppReadonlyTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sent" | "failed">("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("notification_logs")
      .select("*")
      .eq("channel", "whatsapp")
      .order("sent_at", { ascending: false })
      .limit(100);

    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const sent   = logs.filter(l => l.status === "sent").length;
  const failed = logs.filter(l => l.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start">
        <MessageCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Canal WhatsApp — Modo Lectura</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Los mensajes WhatsApp se gestionan automáticamente via webhook. Aquí puedes ver el historial de envíos.
            Para configurar plantillas de WhatsApp Business, ve a{" "}
            <a href="/admin/whatsapp" className="underline font-semibold">WhatsApp Bot</a>.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total enviados", value: logs.length, icon: MessageCircle, color: "text-emerald-500 bg-emerald-50" },
          { label: "Exitosos",       value: sent,        icon: CheckCheck,    color: "text-blue-500 bg-blue-50" },
          { label: "Fallidos",       value: failed,      icon: AlertCircle,   color: "text-red-400 bg-red-50" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "sent", "failed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "Todos" : f === "sent" ? "Exitosos" : "Fallidos"}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400 text-sm">Cargando mensajes...</div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay mensajes WhatsApp registrados</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
              <tr>
                <th className="px-5 py-3">Destinatario</th>
                <th className="px-5 py-3">Mensaje</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-sm text-gray-700 font-medium">{log.recipient_name || log.recipient_email || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-xs font-semibold text-gray-700 truncate">{log.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{log.body}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {log.sent_at ? new Date(log.sent_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      log.status === "sent" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    }`}>
                      {log.status === "sent" ? "Enviado" : "Fallido"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
