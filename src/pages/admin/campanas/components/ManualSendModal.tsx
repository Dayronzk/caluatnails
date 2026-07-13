import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Search, X, Loader2, Users, AlertCircle, Smartphone, Mail, MessageCircle } from "lucide-react";

interface Subscriber {
  endpoint: string;
  client_account_id: string | null;
  profile_id: string | null;
  user_agent: string | null;
  client_name: string;
  client_phone: string;
}

interface ManualSendModalProps {
  defaultTitle: string;
  defaultBody: string;
  defaultEmailBody?: string;
  defaultUrl?: string;
  templateType?: string;
  onClose: () => void;
}

type Channel = 'push' | 'email' | 'whatsapp';

export default function ManualSendModal({
  defaultTitle,
  defaultBody,
  defaultEmailBody,
  defaultUrl = "https://www.caluatnails.com/mi-cuenta",
  templateType = "custom",
  onClose,
}: ManualSendModalProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendAll, setSendAll] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState(defaultBody);
  const [emailBody, setEmailBody] = useState(defaultEmailBody || "");
  const [url, setUrl] = useState(defaultUrl);
  const [channel, setChannel] = useState<Channel>('push');
  const [testMode, setTestMode] = useState(true);
  const [testRecipient, setTestRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscribers();
    // Pre-fill test recipient if possible
    const lastEmail = localStorage.getItem('last_test_email');
    const lastPhone = localStorage.getItem('last_test_phone');
    if (channel === 'email' && lastEmail) setTestRecipient(lastEmail);
    if (channel === 'whatsapp' && lastPhone) setTestRecipient(lastPhone);
  }, [channel]);

  const loadSubscribers = async () => {
    if (testMode && channel !== 'push') { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const { data: subs, error: subsErr } = await supabase
        .from("push_subscriptions")
        .select("endpoint, client_account_id, profile_id, user_agent");

      if (subsErr) throw subsErr;
      if (!subs || subs.length === 0) { setSubscribers([]); setLoading(false); return; }

      const caIds = subs.map(s => s.client_account_id).filter(Boolean) as string[];
      const profileIds = subs.map(s => s.profile_id).filter(Boolean) as string[];

      const [caResult, profileResult] = await Promise.all([
        caIds.length > 0
          ? supabase.from("client_accounts").select("id, name, phone").in("id", caIds)
          : Promise.resolve({ data: [] }),
        profileIds.length > 0
          ? supabase.from("profiles").select("id, full_name, phone").in("id", profileIds)
          : Promise.resolve({ data: [] }),
      ]);

      const caMap = new Map((caResult.data || []).map((c: any) => [c.id, c]));
      const profileMap = new Map((profileResult.data || []).map((p: any) => [p.id, p]));

      const enriched: Subscriber[] = subs.map(sub => {
        if (sub.client_account_id) {
          const ca = caMap.get(sub.client_account_id);
          return {
            ...sub,
            client_name: ca?.name || "Cliente sin nombre",
            client_phone: ca?.phone || "",
          };
        }
        if (sub.profile_id) {
          const p = profileMap.get(sub.profile_id);
          return {
            ...sub,
            client_name: p?.full_name || p?.name || "Usuario",
            client_phone: p?.phone || "",
          };
        }
        return { ...sub, client_name: "Dispositivo anónimo", client_phone: "" };
      });

      setSubscribers(enriched);
    } catch (err: any) {
      console.error("[ManualSendModal] loadSubscribers:", err);
      setLoadError(err?.message || "Error cargando suscriptores");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (endpoint: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(endpoint) ? next.delete(endpoint) : next.add(endpoint);
      return next;
    });
  };

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      if (testMode && channel !== 'push') {
        if (!testRecipient) throw new Error("Ingresa un destinatario de prueba");
        
        if (channel === 'email') {
          localStorage.setItem('last_test_email', testRecipient);
          const { error } = await supabase.functions.invoke("resend-email", {
            body: { 
              type: templateType, 
              to: { email: testRecipient, name: "Prueba Caluatnails" },
              data: { 
                title,
                customHtml: emailBody,
                clientName: "Prueba", 
                bookingTime: "10:00", 
                bookingDate: "2024-05-10", 
                professionalName: "Caluatnails Team", 
                services: ["Servicio de Prueba"], 
                totalPrice: "0.00", 
                points: "100", 
                link: url 
              }
            },
          });
          if (error) throw error;
        } else if (channel === 'whatsapp') {
          localStorage.setItem('last_test_phone', testRecipient);
          const { error } = await supabase.functions.invoke("whatsapp-outbound", {
            body: { 
              phone: testRecipient,
              message: body,
              template_name: 'generic_notification',
              data: { title, body, url }
            },
          });
          if (error) throw error;
        }
        setResult({ sent: 1, total: 1 });
      } else {
        if (channel !== 'push') throw new Error("El envío masivo manual actualmente solo soporta Push.");
        
        if (sendAll) {
          const { data, error: fnErr } = await supabase.functions.invoke("send-push-notification", {
            body: { _send_all: true, title, body, url, template_type: templateType },
          });
          if (fnErr) throw fnErr;
          setResult({ sent: data?.sent ?? 0, total: data?.total ?? subscribers.length });
        } else {
          const targets = subscribers.filter(s => selected.has(s.endpoint));
          let totalSent = 0;
          await Promise.all(targets.map(async (sub) => {
            const { data } = await supabase.functions.invoke("send-push-notification", {
              body: {
                endpoint: sub.endpoint,
                title, body, url,
                template_type: templateType,
                client_account_id: sub.client_account_id,
                profile_id: sub.profile_id,
              },
            });
            if (data?.sent) totalSent++;
          }));
          setResult({ sent: totalSent, total: targets.length });
        }
      }
    } catch (err: any) {
      setSendError(err?.message || "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  const getInitial = (name: string) => {
    const char = name?.trim()?.[0];
    return char ? char.toUpperCase() : "?";
  };

  const getDevice = (ua: string | null) => {
    if (!ua) return "💻 Web";
    if (/iphone|ipad/i.test(ua)) return "📱 iPhone";
    if (/android/i.test(ua)) return "📱 Android";
    return "💻 Web";
  };

  const filtered = subscribers.filter(s =>
    s.client_name.toLowerCase().includes(search.toLowerCase()) ||
    s.client_phone.includes(search)
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 to-black p-8 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Probar Envío</h3>
              <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest">Configura y envía una prueba real</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="p-12 text-center space-y-6 flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
              <Send className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-2xl font-black text-gray-900">¡Mensaje Enviado!</h4>
              <p className="text-gray-500 text-sm font-medium mt-2">
                Se ha procesado el envío correctamente a <strong>{result.sent}</strong> destinatario(s).
              </p>
            </div>
            <button onClick={onClose}
              className="px-12 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-gray-200 uppercase tracking-widest">
              Volver al Panel
            </button>
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden flex-1 min-h-0">
            
            {/* Channel Selection */}
            <div className="px-8 pt-8 flex-shrink-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Elige el Canal de Prueba</p>
              <div className="grid grid-cols-3 gap-3 p-1.5 bg-gray-100 rounded-2xl border border-gray-100">
                {[
                  { id: 'push', label: 'Push', icon: Smartphone, color: 'rose' },
                  { id: 'email', label: 'Email', icon: Mail, color: 'blue' },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'emerald' },
                ].map(c => {
                  const Icon = c.icon;
                  const isActive = channel === c.id;
                  return (
                    <button key={c.id} onClick={() => { setChannel(c.id as Channel); if (c.id !== 'push') setTestMode(true); }}
                      className={`flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${isActive ? `bg-white shadow-lg shadow-gray-200 text-${c.color}-600` : 'text-gray-400 hover:text-gray-600'}`}>
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-tight">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Recipient Selection */}
              {channel === 'push' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enviar a Dispositivos</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={sendAll} onChange={e => setSendAll(e.target.checked)} className="rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
                      <span className="text-[10px] font-black text-rose-500 uppercase">Enviar a todos</span>
                    </label>
                  </div>
                  
                  {!sendAll && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input placeholder="Buscar suscriptor..." value={search} onChange={e => setSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {filtered.map(s => (
                          <div key={s.endpoint} onClick={() => toggle(s.endpoint)}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selected.has(s.endpoint) ? 'border-rose-200 bg-rose-50/50' : 'border-gray-50 bg-gray-50/30 hover:border-gray-200'}`}>
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[10px] font-black">
                              {getInitial(s.client_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{s.client_name}</p>
                              <p className="text-[9px] text-gray-400 uppercase font-bold">{getDevice(s.user_agent)}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 transition-all ${selected.has(s.endpoint) ? 'border-rose-500 bg-rose-500' : 'border-gray-200'}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Destinatario de Prueba</label>
                    <input type={channel === 'email' ? 'email' : 'tel'} 
                      placeholder={channel === 'email' ? 'tu@email.com' : '+34 600 000 000'}
                      value={testRecipient} onChange={e => setTestRecipient(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 transition-all outline-none" />
                    <p className="text-[10px] text-gray-400 mt-2 font-medium italic">Se enviará un mensaje real a este {channel === 'email' ? 'correo' : 'teléfono'}.</p>
                  </div>
                </div>
              )}

              {/* Message Preview */}
              <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Vista Previa del Mensaje</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Título / Asunto</label>
                    <input value={title} onChange={e => setTitle(e.target.value)}
                      className="w-full bg-white px-4 py-2 rounded-xl border border-gray-100 text-xs font-bold" />
                  </div>
                  
                  {channel === 'email' ? (
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Vista Previa del Diseño HTML</label>
                      <div className="w-full h-48 bg-white rounded-xl border border-gray-100 overflow-hidden relative group">
                        <iframe 
                          srcDoc={`
                            <html>
                              <body style="margin:0;padding:10px;font-family:sans-serif;zoom:0.6;">
                                ${emailBody || '<p style="color:#999;text-align:center;padding:20px;">Sin contenido HTML</p>'}
                              </body>
                            </html>
                          `}
                          className="w-full h-full border-0 pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/5 transition-all flex items-center justify-center">
                          <p className="text-[8px] font-black text-gray-900/0 group-hover:text-gray-900/40 uppercase tracking-widest">Previsualización Interactiva</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Editar Código HTML</label>
                        <textarea rows={4} value={emailBody} onChange={e => setEmailBody(e.target.value)}
                          className="w-full bg-white px-4 py-3 rounded-xl border border-gray-100 text-[10px] font-mono text-gray-600 resize-none" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Contenido (Push/WhatsApp)</label>
                      <textarea rows={3} value={body} onChange={e => setBody(e.target.value)}
                        className="w-full bg-white px-4 py-3 rounded-xl border border-gray-100 text-xs font-medium resize-none" />
                    </div>
                  )}
                </div>
              </div>

              {sendError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs font-bold">{sendError}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center gap-4">
              <button onClick={onClose} className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSend} disabled={sending || (channel === 'push' && !sendAll && selected.size === 0)}
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] text-sm font-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 uppercase tracking-widest">
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar {channel === 'push' ? 'Push' : channel === 'email' ? 'Email de Prueba' : 'WhatsApp de Prueba'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
