import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { type TemplateMeta, inferVariableKinds, formatBookingDate, renderPreview } from "@/lib/whatsappTemplates";
import { AdminSidebar } from "../components/AdminSidebar";
import { Bot, User, Wrench, MessageSquare, AlertCircle, Send, RefreshCw, Check, CheckCheck, Power, Settings as SettingsIcon, Save, X, Star, History, RotateCcw, Plus, Search, FileText, Calendar } from "lucide-react";
import AdminNewBookingModal from "../agenda/components/AdminNewBookingModal";

interface Conversation {
  id: string;
  phone: string;
  client_name: string | null;
  client_email: string | null;
  needs_human: boolean;
  human_note: string | null;
  last_message_at: string;
  created_at: string;
  admin_last_read_at: string | null;
  archived_at: string | null;
  unread_count?: number;
  last_msg_preview?: string;
  last_inbound_at?: string | null;
}

type SortMode = "recent" | "oldest" | "unread";
type FolderTab = "active" | "archived";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string | null;
  total_price: number;
  status: string;
}

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  points: number;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  created_at: string;
  status: string;
  tool_calls?: any;
  input_tokens?: number;
  output_tokens?: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminWhatsAppPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draftToolCalls, setDraftToolCalls] = useState<any[]>([]);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [showClientInfoMobile, setShowClientInfoMobile] = useState(false);
  const [updatingBot, setUpdatingBot] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [botEnabled, setBotEnabled] = useState(true);
  const [config, setConfig] = useState({
    greeting: "",
    system_prompt: "",
    respect_business_hours: false,
    services_list_template: "",
    follow_up_no_decision: "",
    service_confirmed_template: "",
    date_follow_up_template: "",
    no_availability_template: "",
    booking_error_template: "",
    human_escalation_template: "",
    session_timeout_hours: 24,
    bot_name: "Asistente de NAILOX",
    summary_upsell_template: "",
    closing_template: ""
  });
  const [totalCost, setTotalCost] = useState(0);
  const [clientData, setClientData] = useState<ClientInfo | null>(null);
  const [lastBookings, setLastBookings] = useState<Booking[]>([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [folderTab, setFolderTab] = useState<FolderTab>("active");
  const [showSilencedModal, setShowSilencedModal] = useState(false);
  const [silenced, setSilenced] = useState<Array<{ client_phone: string; client_name: string; last_booking_date: string; total_bookings: number }>>([]);
  const [silencedLoading, setSilencedLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const loadSilenced = async () => {
    setSilencedLoading(true);
    const { data, error } = await supabase.rpc("get_potentially_silenced_clients");
    if (!error && data) setSilenced(data);
    setSilencedLoading(false);
  };

  const copySmsMessage = (phone: string, name: string) => {
    const firstName = (name || "").split(" ")[0].replace(/\(.*\)/, "").trim();
    const greeting = firstName && firstName !== "(sin" ? `Hola ${firstName}` : "Hola";
    const msg = `${greeting}, te escribimos desde NAILOX 💅. Hemos actualizado nuestro WhatsApp. Si nos quieres escribir y te aparece que ya no estamos disponibles, borra el contacto +34 636 68 91 01 de tu agenda y vuélvelo a guardar. Después podrás escribirnos normalmente. ¡Te esperamos!`;
    navigator.clipboard?.writeText(msg);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2500);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    setLoadingConvs(true);
    const { data: convs } = await supabase
      .from("whatsapp_conversations")
      .select("id, phone, client_name, client_email, needs_human, human_note, last_message_at, created_at, last_reset_at, admin_last_read_at, archived_at")
      .order("last_message_at", { ascending: false });

    if (convs) {
      // Enrich conversations with: client info, unread count, last msg preview
      const enriched = await Promise.all(convs.map(async (c) => {
        const last9 = c.phone.replace(/\D/g, "").slice(-9);
        const [{ data: client }, unreadRes, lastMsgRes, lastInboundRes] = await Promise.all([
          supabase
            .from("client_accounts")
            .select("name, points")
            .ilike("phone", `%${last9}`)
            .maybeSingle(),
          // Count messages newer than admin_last_read_at. If never read, count all.
          supabase
            .from("whatsapp_messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .gt("created_at", c.admin_last_read_at ?? "1970-01-01"),
          supabase
            .from("whatsapp_messages")
            .select("content, role, direction, created_at")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          // Last INBOUND message for 24h window calculation
          supabase
            .from("whatsapp_messages")
            .select("created_at")
            .eq("conversation_id", c.id)
            .eq("direction", "inbound")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        // Resolve name with this precedence:
        //   1) client_accounts.name
        //   2) whatsapp_conversations.client_name
        //   3) most recent bookings.client_name (catches customers who booked
        //      online before ever using WhatsApp, so we never show their bare
        //      phone if we already know their name from a past booking)
        let resolvedName = client?.name || c.client_name || null;
        if (!resolvedName || resolvedName.trim() === "") {
          const { data: lastBooking } = await supabase
            .from("bookings")
            .select("client_name")
            .ilike("client_phone", `%${last9}`)
            .not("client_name", "is", null)
            .neq("client_name", "")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (lastBooking?.client_name) resolvedName = lastBooking.client_name.trim();
        }

        // Use the latest message's created_at as the real "last activity" time.
        // whatsapp_conversations.last_message_at may be stale (only set on
        // INSERT, never updated by the webhook until the backend fix deploys).
        const realLastMessageAt =
          lastMsgRes.data?.created_at || c.last_message_at;

        return {
          ...c,
          last_message_at: realLastMessageAt,
          client_name: resolvedName,
          points: client?.points || 0,
          unread_count: unreadRes.count ?? 0,
          last_msg_preview: lastMsgRes.data?.content?.slice(0, 60) ?? "",
          last_inbound_at: lastInboundRes.data?.created_at ?? null,
        };
      }));
      setConversations(enriched as Conversation[]);
    }
    setLoadingConvs(false);
  };

  // Mark conversation as read whenever admin opens one
  const markConversationRead = async (convId: string) => {
    await supabase
      .from("whatsapp_conversations")
      .update({ admin_last_read_at: new Date().toISOString() })
      .eq("id", convId);
    // Optimistically zero the badge in local state
    setConversations(prev =>
      prev.map(c => (c.id === convId ? { ...c, unread_count: 0, admin_last_read_at: new Date().toISOString() } : c))
    );
  };

  // Sorted + folder-filtered view
  const sortedConversations = (() => {
    const list = conversations.filter(c => {
      if (folderTab === "archived") return !!c.archived_at;
      return !c.archived_at;
    });
    if (sortMode === "recent") {
      list.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    } else if (sortMode === "oldest") {
      list.sort((a, b) => new Date(a.last_message_at).getTime() - new Date(b.last_message_at).getTime());
    } else if (sortMode === "unread") {
      list.sort((a, b) => {
        const ua = a.unread_count ?? 0;
        const ub = b.unread_count ?? 0;
        if (ua !== ub) return ub - ua;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });
    }
    return list;
  })();

  const activeCount = conversations.filter(c => !c.archived_at).length;
  const archivedCount = conversations.filter(c => !!c.archived_at).length;
  const totalUnread = conversations.filter(c => !c.archived_at).reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  // Toggle archive state for a conversation
  const toggleArchive = async (convId: string, currentlyArchived: boolean) => {
    const now = currentlyArchived ? null : new Date().toISOString();
    await supabase
      .from("whatsapp_conversations")
      .update({ archived_at: now })
      .eq("id", convId);
    setConversations(prev =>
      prev.map(c => (c.id === convId ? { ...c, archived_at: now } : c))
    );
    // If we just archived the open conversation, close it
    if (!currentlyArchived && activeId === convId) {
      setActiveId(null);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!conversationId) return;
    setLoadingMsgs(true);
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("id, conversation_id, direction, role, content, created_at, status, tool_calls, input_tokens, output_tokens")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    } else {
      setMessages((data || []) as Message[]);
      // Scroll to bottom after messages render
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }
    setLoadingMsgs(false);
  };

  const loadBotConfig = async () => {
    const { data } = await supabase
      .from("whatsapp_bot_config")
      .select(`
        enabled, greeting, system_prompt, respect_business_hours, 
        services_list_template, follow_up_no_decision, service_confirmed_template, 
        date_follow_up_template, no_availability_template, booking_error_template, 
        human_escalation_template, session_timeout_hours, bot_name, 
        summary_upsell_template, closing_template
      `)
      .eq("id", "main")
      .maybeSingle();

    if (data) {
      setBotEnabled(data.enabled);
      setConfig({
        greeting: data.greeting || "",
        system_prompt: data.system_prompt || "",
        respect_business_hours: !!data.respect_business_hours,
        services_list_template: data.services_list_template || "",
        follow_up_no_decision: data.follow_up_no_decision || "",
        service_confirmed_template: data.service_confirmed_template || "",
        date_follow_up_template: data.date_follow_up_template || "",
        no_availability_template: data.no_availability_template || "",
        booking_error_template: data.booking_error_template || "",
        human_escalation_template: data.human_escalation_template || "",
        session_timeout_hours: data.session_timeout_hours || 24,
        bot_name: data.bot_name || "Asistente de NAILOX",
        summary_upsell_template: data.summary_upsell_template || "",
        closing_template: data.closing_template || ""
      });
    }
  };

  const calculateCost = async () => {
    const { data } = await supabase.from("whatsapp_messages").select("input_tokens, output_tokens").filter("role", "eq", "assistant");
    if (data) {
      const cost = data.reduce((acc, curr) => {
        return acc + (curr.input_tokens || 0) * 0.00000025 + (curr.output_tokens || 0) * 0.00000125;
      }, 0);
      setTotalCost(cost);
    }
  };

  useEffect(() => { loadConversations(); loadBotConfig(); calculateCost(); }, []);
  useEffect(() => { 
    if (activeId) {
      loadMessages(activeId);
      loadClientData();
      setDraftToolCalls([]);
    } 
  }, [activeId]);

  const loadClientData = async () => {
    if (!activeId) return;
    const conv = conversations.find(c => c.id === activeId);
    if (!conv) return;

    setClientData(null);
    setLastBookings([]);

    const { data: client } = await supabase
      .from("client_accounts")
      .select("id, name, email, points")
      .ilike("phone", `%${conv.phone.slice(-9)}`)
      .single();

    if (client) setClientData(client as ClientInfo);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, booking_date, booking_time, total_price, status")
      .ilike("client_phone", `%${conv.phone.slice(-9)}`)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false })
      .limit(3);

    if (bookings) setLastBookings(bookings as Booking[]);
  };

  useEffect(() => {
    const channel = supabase
      .channel("wa-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_messages" },
        (payload) => {
          if (activeId && ((payload.new as any).conversation_id === activeId || (payload.old as any)?.conversation_id === activeId)) {
            loadMessages(activeId);
          }
          loadConversations();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  const activeConv = conversations.find((c) => c.id === activeId);

  const handleToggleBot = async () => {
    setUpdatingBot(true);
    const newVal = !botEnabled;
    const { error } = await supabase
      .from("whatsapp_bot_config")
      .update({ enabled: newVal })
      .eq("id", "main");
    if (!error) setBotEnabled(newVal);
    setUpdatingBot(false);
  };

  const [resumingBot, setResumingBot] = useState(false);
  const [bulkResuming, setBulkResuming] = useState(false);

  // Cambia TODAS las conversaciones de modo manual → bot.
  // No reinvocamos el agente conv por conv (caro + reactivo): solo limpiamos
  // needs_human. La próxima vez que el cliente escriba, el webhook contesta
  // automáticamente como siempre.
  const handleResumeAllToBot = async () => {
    const manualConvs = conversations.filter(c => c.needs_human);
    if (manualConvs.length === 0) return;
    const ok = confirm(
      `Vas a pasar ${manualConvs.length} ${manualConvs.length === 1 ? "conversación" : "conversaciones"} de MANUAL a BOT.\n\n` +
      `El bot retomará el control cuando esos clientes vuelvan a escribir.\n\n` +
      `¿Continuar?`
    );
    if (!ok) return;
    setBulkResuming(true);
    try {
      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({ needs_human: false, human_note: null })
        .in("id", manualConvs.map(c => c.id));
      if (error) {
        alert(`Error: ${error.message}`);
      }
      loadConversations();
    } finally {
      setBulkResuming(false);
    }
  };

  const handleResumeBot = async () => {
    if (!activeConv) return;
    setResumingBot(true);
    try {
      // Call the resume-bot edge function which:
      // 1) clears needs_human
      // 2) reads the last client message + full context
      // 3) runs the Claude agent
      // 4) sends the reply via WhatsApp
      const { data, error } = await supabase.functions.invoke("whatsapp-resume-bot", {
        body: { conversationId: activeConv.id },
      });
      if (error) console.error("Resume-bot error:", error);
      // Refresh UI
      loadConversations();
      loadMessages(activeConv.id);
    } catch (err) {
      console.error("Resume-bot failed:", err);
      // Fallback: at least clear the flag manually
      await supabase
        .from("whatsapp_conversations")
        .update({ needs_human: false, human_note: null })
        .eq("id", activeConv.id);
      loadConversations();
    } finally {
      setResumingBot(false);
    }
  };

  const handleResetChat = async () => {
    if (!activeConv) return;
    
    await supabase
      .from("whatsapp_conversations")
      .update({ 
        state: {}, 
        needs_human: false, 
        human_note: null,
        last_reset_at: new Date().toISOString() 
      })
      .eq("id", activeConv.id);
    
    loadConversations();
    loadMessages(activeId!);
  };

  useEffect(() => {
    const searchClients = async () => {
      if (newChatSearch.length < 3) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const { data } = await supabase
        .from("client_accounts")
        .select("id, name, phone")
        .or(`name.ilike.%${newChatSearch}%,phone.ilike.%${newChatSearch}%`)
        .limit(5);
      setSearchResults(data ?? []);
      setIsSearching(false);
    };
    const timer = setTimeout(searchClients, 300);
    return () => clearTimeout(timer);
  }, [newChatSearch]);

  const handleStartNewChat = async (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) return;
    
    // Auto-fix Spanish numbers (9 digits starting with 6 or 7)
    if (cleanPhone.length === 9 && (cleanPhone.startsWith("6") || cleanPhone.startsWith("7"))) {
      cleanPhone = "34" + cleanPhone;
    }

    // Check if conversation exists
    const { data: existing } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("phone", cleanPhone)
      .single();

    if (existing) {
      setActiveId(existing.id);
      setIsNewChatModalOpen(false);
      setNewChatSearch("");
      return;
    }

    // Create new
    const { data: created, error } = await supabase
      .from("whatsapp_conversations")
      .insert({ phone: cleanPhone, last_message_at: new Date().toISOString() })
      .select()
      .single();

    if (created) {
      setActiveId(created.id);
      setIsNewChatModalOpen(false);
      setNewChatSearch("");
      loadConversations();
    } else {
      alert("Error al iniciar chat: " + (error?.message || "Desconocido"));
    }
  };

  const handleEscalateManual = async () => {
    if (!activeConv) return;
    await supabase
      .from("whatsapp_conversations")
      .update({ needs_human: true, human_note: "Intervención manual desde el panel" })
      .eq("id", activeConv.id);
    loadConversations();
  };

  const handleSendManualReply = async () => {
    if (!activeConv || !replyText.trim()) return;
    setSendingReply(true);
    setReplyError(null);

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-outbound", {
        body: { 
          conversationId: activeConv.id, 
          text: replyText,
          toolCalls: draftToolCalls,
        },
      });
 
      if (error) throw error;
 
      if (data?.success) {
        setReplyText("");
        setDraftToolCalls([]);
        loadMessages(activeConv.id);
      } else {
        // Edge function reached but WhatsApp API rejected the send
        const reason = data?.error || "No se pudo enviar el mensaje (WhatsApp no aceptó el envío).";
        console.warn("WhatsApp send rejected:", reason);
        setReplyError(reason);
        // Reload anyway: the message was saved with status='failed'
        loadMessages(activeConv.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de red al enviar el mensaje.";
      console.error("Error sending manual reply:", err);
      setReplyError(message);
    } finally {
      setSendingReply(false);
    }
  };

  // Ask the bot for a suggested reply (draft only — nothing is sent or saved).
  // The text lands in the reply box so the admin can review/edit before sending.
  const handleDraftReply = async () => {
    if (!activeConv) return;
    setDrafting(true);
    setReplyError(null);
    setDraftToolCalls([]);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-draft-reply", {
        body: { conversationId: activeConv.id },
      });
      if (error) throw error;
      if (data?.success && data.text) {
        setReplyText(data.text);
        if (data.toolCalls) {
          setDraftToolCalls(data.toolCalls);
        }
      } else {
        setReplyError(data?.error || "El bot no pudo generar una sugerencia ahora mismo.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de red al generar la sugerencia.";
      console.error("Error drafting reply:", err);
      setReplyError(message);
    } finally {
      setDrafting(false);
    }
  };

  const handleSaveConfig = async () => {
    setUpdatingBot(true);
    const { error } = await supabase
      .from("whatsapp_bot_config")
      .update(config)
      .eq("id", "main");
    if (!error) {
      alert("Configuración guardada correctamente");
    } else {
      alert("Error al guardar la configuración");
    }
    setUpdatingBot(false);
  };

  return (
    <div className="bg-gray-50 flex" style={{ minHeight: "100dvh" }}>
      <AdminSidebar />

      {/* Use 100dvh on the main pane so iOS Safari computes height correctly.
          h-screen (= 100vh) overflows behind the URL bar on mobile, breaking
          the inner scroll. lg:h-screen keeps the original behaviour on desktop.
          min-h-0 is critical: without it, flex children refuse to shrink below
          their content height and overflow-y-auto never kicks in on Safari. */}
      <main
        className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full min-h-0"
        style={{ height: "100dvh" }}
      >
        {/* Conversations list - Hidden on mobile if a conversation is active */}
        <div className={`w-full lg:w-80 border-r border-gray-200 bg-white flex flex-col min-h-0 ${activeId ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-bold text-gray-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-rose-500" />
                  WhatsApp
                </h1>
                <p className="text-xs text-gray-500">{conversations.length} hilos</p>
              </div>
              <div className="flex items-center gap-1">
                {conversations.some(c => c.needs_human) && (
                  <button
                    onClick={handleResumeAllToBot}
                    disabled={bulkResuming}
                    className="relative h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    title="Pasar todas las conversaciones de manual a bot"
                  >
                    <Bot className={`w-4 h-4 ${bulkResuming ? "animate-pulse" : ""}`} />
                    <span className="text-[11px] font-bold leading-none">
                      {bulkResuming ? "..." : `${conversations.filter(c => c.needs_human).length}→bot`}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => { setShowSilencedModal(true); loadSilenced(); }}
                  className="w-8 h-8 rounded-lg hover:bg-amber-50 flex items-center justify-center cursor-pointer text-amber-600 transition-colors"
                  title="Clientes silenciados (no han escrito desde la migración del 18 may)"
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center cursor-pointer text-rose-600 transition-colors"
                  title="Nuevo chat"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={loadConversations}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${loadingConvs ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === "chat" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === "settings" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <SettingsIcon className="w-3.5 h-3.5" /> Ajustes
              </button>
            </div>
          </div>
          {/* Folder tabs: Activas | Gestionadas */}
          <div className="px-3 pt-2 pb-1 flex gap-1 bg-gray-50/50">
            <button
              onClick={() => setFolderTab("active")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                folderTab === "active" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageSquare className="w-3 h-3" /> Activas
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${folderTab === "active" ? "bg-rose-100 text-rose-700" : "bg-gray-200 text-gray-500"}`}>
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setFolderTab("archived")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                folderTab === "archived" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              title="Conversaciones que ya gestionaste. Cuando el cliente o el bot vuelva a escribir, salen automáticamente a Activas."
            >
              <i className="ri-archive-line text-sm"></i> Gestionadas
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${folderTab === "archived" ? "bg-gray-200 text-gray-700" : "bg-gray-200 text-gray-500"}`}>
                {archivedCount}
              </span>
            </button>
          </div>

          {/* Sort selector + unread total */}
          <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-rose-300 cursor-pointer"
            >
              <option value="recent">Más recientes primero</option>
              <option value="oldest">Más antiguos primero</option>
              <option value="unread">No leídos primero</option>
            </select>
            {folderTab === "active" && totalUnread > 0 && (
              <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-1 rounded-full shrink-0">
                {totalUnread} sin leer
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {sortedConversations.map((c) => {
              const unread = c.unread_count ?? 0;
              const isActive = activeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveId(c.id);
                    markConversationRead(c.id);
                  }}
                  className={`w-full text-left p-3 border-b border-gray-100 hover:bg-rose-50/50 transition-colors cursor-pointer ${
                    isActive ? "bg-rose-50" : unread > 0 ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-sm truncate ${unread > 0 && !isActive ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                      {(c as any).client_name || c.phone}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {unread > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center shadow-sm">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">{timeAgo(c.last_message_at)}</span>
                    </div>
                  </div>
                  {c.last_msg_preview && (
                    <p className={`text-[11px] truncate mb-0.5 ${unread > 0 && !isActive ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                      {c.last_msg_preview}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-gray-400 truncate">{c.phone}</p>
                    {(c as any).points > 0 && (
                      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-rose-500" /> {(c as any).points}
                      </span>
                    )}
                  </div>
                  {/* Indicator row: stuck/needs_human + 24h window */}
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {c.needs_human && (
                      (() => {
                        const note = (c.human_note || "").toLowerCase();
                        if (note.includes("atascad") || note.includes("stuck")) {
                          return (
                            <span title={c.human_note ?? ""} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3" /> Bot atascado
                            </span>
                          );
                        }
                        if (note.includes("token") || note.includes("rechaz") || note.includes("api")) {
                          return (
                            <span title={c.human_note ?? ""} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3" /> Error envío
                            </span>
                          );
                        }
                        return (
                          <span title={c.human_note ?? ""} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" /> Necesita ayuda
                          </span>
                        );
                      })()
                    )}
                    {(() => {
                      // 24h Meta messaging window. Starts at last INBOUND message.
                      // < 1h remaining → red, < 4h → amber, > 4h → no badge,
                      // expired (>24h) → grey "ventana cerrada".
                      if (!c.last_inbound_at) return null;
                      const elapsedMs = Date.now() - new Date(c.last_inbound_at).getTime();
                      const remainingMs = 24 * 3600 * 1000 - elapsedMs;
                      if (remainingMs <= 0) {
                        return (
                          <span title="Han pasado más de 24h desde el último mensaje del cliente. WhatsApp solo permite plantillas aprobadas hasta que la cliente vuelva a escribir." className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                            <i className="ri-time-line text-[10px]"></i> Ventana cerrada
                          </span>
                        );
                      }
                      const hoursLeft = remainingMs / (3600 * 1000);
                      if (hoursLeft < 1) {
                        const minutesLeft = Math.max(0, Math.floor(remainingMs / 60000));
                        return (
                          <span title="Quedan minutos antes de que se cierre la ventana de 24h de WhatsApp. Responde pronto." className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded animate-pulse">
                            <i className="ri-alarm-warning-line text-[10px]"></i> {minutesLeft}m restantes
                          </span>
                        );
                      }
                      if (hoursLeft < 4) {
                        return (
                          <span title="Quedan menos de 4 horas antes de que se cierre la ventana de 24h." className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            <i className="ri-time-line text-[10px]"></i> {Math.floor(hoursLeft)}h {Math.floor((hoursLeft % 1) * 60)}m
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </button>
              );
            })}
            {!loadingConvs && conversations.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-400">
                No hay conversaciones aun
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 flex flex-col bg-white min-h-0 ${!activeId && activeTab === "chat" ? "hidden lg:flex" : "flex"}`}>
          {activeTab === "settings" ? (
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-4xl mx-auto w-full">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración del Bot</h2>
                <p className="text-gray-500">Ajusta el comportamiento y los mensajes automáticos.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${botEnabled ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                        <Power className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Estado del Asistente</h3>
                        <p className="text-sm text-gray-500">{botEnabled ? "El bot está respondiendo automáticamente" : "El bot está en pausa manual"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={handleToggleBot}
                        disabled={updatingBot}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          botEnabled 
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100" 
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {botEnabled ? "Desactivar" : "Activar Ahora"}
                      </button>
                      <div className="text-[10px] text-gray-400 font-mono">
                        Consumo API: <span className="text-rose-500 font-bold">${totalCost.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensaje de Bienvenida</label>
                      <textarea
                        value={config.greeting}
                        onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 min-h-[100px]"
                        placeholder="Ej: ¡Hola! Soy el asistente de NAILOX..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Instrucciones del Sistema (Calibración)</label>
                      <textarea
                        value={config.system_prompt}
                        onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 min-h-[200px]"
                        placeholder="Define la personalidad y reglas del bot..."
                      />
                      <p className="mt-1.5 text-xs text-gray-400 italic">Este prompt se añade a las instrucciones base del bot.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del Asistente</label>
                        <input
                          type="text"
                          value={config.bot_name}
                          onChange={(e) => setConfig({ ...config, bot_name: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                          placeholder="Ej: Asistente de NAILOX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Reinicio de Sesión (Horas)</label>
                        <input
                          type="number"
                          value={config.session_timeout_hours}
                          onChange={(e) => setConfig({ ...config, session_timeout_hours: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <p className="mt-1 text-[10px] text-gray-400 italic">Tiempo de inactividad para olvidar el contexto previo.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        id="hours"
                        checked={config.respect_business_hours}
                        onChange={(e) => setConfig({ ...config, respect_business_hours: e.target.checked })}
                        className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                      />
                      <label htmlFor="hours" className="text-sm text-gray-700 cursor-pointer">Respetar horario laboral (No responder de noche)</label>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-4">Plantillas de Conversación</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">1. Saludo Inicial</label>
                          <textarea
                            value={config.greeting}
                            onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">2. Listado de Servicios</label>
                          <textarea
                            value={config.services_list_template}
                            onChange={(e) => setConfig({ ...config, services_list_template: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">3. Recordatorio (Sin decisión)</label>
                          <textarea
                            value={config.follow_up_no_decision}
                            onChange={(e) => setConfig({ ...config, follow_up_no_decision: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">4. Confirmación de Servicio</label>
                          <textarea
                            value={config.service_confirmed_template}
                            onChange={(e) => setConfig({ ...config, service_confirmed_template: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">5. Seguimiento de Fecha</label>
                          <textarea
                            value={config.date_follow_up_template}
                            onChange={(e) => setConfig({ ...config, date_follow_up_template: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">6. Sin Disponibilidad</label>
                          <textarea
                            value={config.no_availability_template}
                            onChange={(e) => setConfig({ ...config, no_availability_template: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">7. Error en Reserva</label>
                          <textarea
                            value={config.booking_error_template}
                            onChange={(e) => setConfig({ ...config, booking_error_template: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">8. Pase a Humano</label>
                          <textarea
                            value={config.human_escalation_template}
                            onChange={(e) => setConfig({ ...config, human_escalation_template: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                          />
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">9. Resumen y Upselling (¡Venta extra!)</label>
                          <textarea
                            value={config.summary_upsell_template}
                            onChange={(e) => setConfig({ ...config, summary_upsell_template: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                          />
                          <p className="mt-1 text-[10px] text-gray-400 italic">Se usa tras elegir el primer servicio para ofrecer más.</p>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">10. Despedida y Agradecimiento</label>
                          <textarea
                            value={config.closing_template}
                            onChange={(e) => setConfig({ ...config, closing_template: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleSaveConfig}
                      disabled={updatingBot}
                      className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : !activeConv ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Selecciona una conversación</p>
              </div>
            </div>
          ) : (
            <>
              {/* pl-14 on mobile leaves room for the AdminSidebar hamburger
                  button (fixed top-4 left-4 z-50, ~56px wide area). */}
              <div className="pl-14 pr-3 py-3 lg:pl-4 lg:pr-4 lg:py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  {/* Back button — always visible on mobile, stays at left edge */}
                  <button
                    onClick={() => setActiveId(null)}
                    className="lg:hidden shrink-0 w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                    aria-label="Volver a la lista"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 truncate text-sm lg:text-base">
                      {activeConv.client_name ?? "Sin nombre"}
                    </h2>
                    <p className="text-[10px] lg:text-xs text-gray-500 truncate">
                      {activeConv.phone} {activeConv.client_email && `· ${activeConv.client_email}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleArchive(activeConv.id, !!activeConv.archived_at)}
                      className={`p-2 rounded-lg transition-all ${
                        activeConv.archived_at
                          ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                          : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                      title={activeConv.archived_at ? "Mover de Gestionadas a Activas" : "Marcar como gestionada (oculta de la lista; vuelve si el cliente escribe)"}
                    >
                      <i className={`text-base ${activeConv.archived_at ? "ri-inbox-unarchive-line" : "ri-archive-line"}`}></i>
                    </button>
                    <button
                      onClick={handleResetChat}
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Reiniciar sesión del bot"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    {activeConv.needs_human ? (
                      <button
                        onClick={handleResumeBot}
                        disabled={resumingBot}
                        className="px-2 lg:px-2.5 py-1.5 text-[11px] lg:text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 cursor-pointer whitespace-nowrap disabled:opacity-60 flex items-center gap-1"
                      >
                        {resumingBot && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {resumingBot ? "Respondiendo..." : <><span className="hidden sm:inline">Devolver al </span>bot</>}
                      </button>
                    ) : (
                      <button
                        onClick={handleEscalateManual}
                        className="px-2 lg:px-2.5 py-1.5 text-[11px] lg:text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 cursor-pointer whitespace-nowrap"
                      >
                        <span className="hidden sm:inline">Atención </span>Manual
                      </button>
                    )}
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="ml-1 px-2 lg:px-2.5 py-1.5 text-[11px] lg:text-xs font-medium bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors"
                      title="Abrir modal para agendar cita manualmente"
                    >
                      <Calendar className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Agendar</span>
                    </button>
                    <button
                      onClick={() => setShowClientInfoMobile(true)}
                      className="xl:hidden ml-1 p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Ver información del cliente"
                    >
                      <User className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {activeConv.needs_human && activeConv.human_note && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Motivo:</strong> {activeConv.human_note}</span>
                </div>
              )}

              {/* min-h-0 on every flex-1 ancestor is mandatory: without it
                  flex children won't shrink below their intrinsic height and
                  overflow-y-auto never engages on mobile Safari / Chrome. */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0 -webkit-overflow-scrolling-touch"
                       style={{ WebkitOverflowScrolling: "touch" }}>
                    {loadingMsgs ? (
                      <div className="text-center text-gray-400 text-sm">Cargando...</div>
                    ) : (
                      <div className="space-y-2 max-w-3xl mx-auto">
                        {messages.map((m) => <MessageBubble key={m.id} m={m} />)}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {activeConv.needs_human && (
                    <div className="border-t border-gray-200 bg-white">
                      {draftToolCalls.length > 0 && (
                        <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                          <Check className="w-4 h-4 shrink-0 text-emerald-600 animate-pulse" />
                          <span className="flex-1">
                            El bot propone ejecutar estas acciones al enviar:{" "}
                            <strong>
                              {draftToolCalls.map((tc) => {
                                if (tc.name === "create_booking") return "Crear reserva";
                                if (tc.name === "reschedule_booking") return "Reagendar reserva";
                                if (tc.name === "cancel_booking") return "Cancelar reserva";
                                if (tc.name === "save_client_name") return `Guardar nombre "${tc.input.name || ""}"`;
                                if (tc.name === "escalate_to_human") return "Escalar a humano";
                                return tc.name;
                              }).join(", ")}
                            </strong>
                          </span>
                          <button
                            onClick={() => setDraftToolCalls([])}
                            className="text-rose-500 hover:text-rose-700 font-medium text-[11px] shrink-0"
                            title="Quitar acciones automáticas y enviar solo texto"
                          >
                            Cancelar acciones
                          </button>
                        </div>
                      )}
                      {replyError && (
                        <div className="px-3 py-2 bg-rose-50 border-b border-rose-100 text-xs text-rose-700 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold mb-0.5">No se pudo enviar:</p>
                            <p className="leading-relaxed">{replyError}</p>
                          </div>
                          <button
                            onClick={() => setReplyError(null)}
                            className="text-rose-400 hover:text-rose-600 shrink-0"
                            aria-label="Cerrar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="p-3 flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => setShowTemplateModal(true)}
                          title="Enviar una plantilla aprobada (útil si la ventana de 24 h está cerrada)"
                          className="shrink-0 w-10 h-10 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-rose-500 transition-colors flex items-center justify-center"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleDraftReply}
                          disabled={drafting}
                          title="Que el bot redacte una sugerencia de respuesta (no se envía: la revisas y editas antes)"
                          className="shrink-0 w-10 h-10 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-wait"
                        >
                          <Bot className={`w-4 h-4 ${drafting ? "animate-pulse" : ""}`} />
                        </button>
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => { setReplyText(e.target.value); if (replyError) setReplyError(null); }}
                          onKeyDown={(e) => e.key === "Enter" && handleSendManualReply()}
                          placeholder="Escribe tu respuesta..."
                          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300"
                        />
                        <button
                          onClick={handleSendManualReply}
                          disabled={sendingReply || !replyText.trim()}
                          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                        >
                          {sendingReply ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {sendingReply ? "Enviando..." : "Enviar"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Backdrop for mobile client info */}
                {showClientInfoMobile && (
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                    onClick={() => setShowClientInfoMobile(false)}
                  />
                )}

                {/* Client Sidebar */}
                <div className={`
                  ${showClientInfoMobile ? "fixed inset-y-0 right-0 z-50 w-[85%] max-w-sm shadow-2xl animate-in slide-in-from-right" : "hidden"}
                  xl:flex xl:relative xl:w-72 xl:shadow-none xl:z-0 xl:translate-x-0
                  border-l border-gray-200 bg-white flex-col overflow-y-auto
                `}>
                  {showClientInfoMobile && (
                    <div className="xl:hidden p-4 flex items-center justify-between border-b border-gray-200 sticky top-0 bg-white z-10">
                      <h3 className="font-bold text-gray-900">Perfil del Cliente</h3>
                      <button onClick={() => setShowClientInfoMobile(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className={`text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 ${showClientInfoMobile ? 'hidden xl:block' : ''}`}>
                      Información del Cliente
                    </h3>
                    
                    {clientData ? (
                      <div className="space-y-6">
                        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold">
                              {clientData.name ? clientData.name.charAt(0) : <User className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 leading-tight">{clientData.name || "Sin nombre"}</p>
                              <p className="text-[10px] text-gray-500 truncate">{clientData.email}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Puntos:</span>
                            <span className="text-sm font-bold text-rose-600 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-rose-500" /> {clientData.points}
                            </span>
                          </div>
                          <a 
                            href={`/admin/clientes`}
                            className="mt-4 block text-center py-2 bg-white border border-rose-200 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                          >
                            Ir a Gestión de Clientes
                          </a>
                          <button 
                            onClick={() => setShowBookingModal(true)}
                            className="w-full mt-2 block text-center py-2 bg-rose-600 border border-rose-600 rounded-lg text-[11px] font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer"
                          >
                            Agendar Nueva Cita
                          </button>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                            <History className="w-3 h-3" /> Historial Reciente
                          </h4>
                          <div className="space-y-2">
                            {lastBookings.length > 0 ? lastBookings.map(b => (
                              <div key={b.id} className="p-2 border border-gray-100 rounded-xl text-xs">
                                <div className="flex justify-between font-medium text-gray-800">
                                  <span>
                                    {new Date(b.booking_date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                    {b.booking_time ? ` · ${b.booking_time.slice(0, 5)}` : ""}
                                  </span>
                                  <span className="text-gray-900">{b.total_price}€</span>
                                </div>
                                <div className="flex justify-between text-[10px] mt-0.5">
                                  <span className="text-gray-400 capitalize">{b.status}</span>
                                </div>
                              </div>
                            )) : (
                              <p className="text-xs text-gray-400 italic">Sin servicios registrados</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <User className="w-12 h-12 text-gray-100 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Cliente no registrado en la base de datos.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nueva Conversación</h3>
            <div className="relative mb-6">
              <input
                type="text"
                autoFocus
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                placeholder="Busca por nombre o escribe el número..."
                className="w-full px-4 py-2 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
              <div className="absolute right-3 top-2.5">
                {isSearching ? <RefreshCw className="w-4 h-4 text-gray-300 animate-spin" /> : <Search className="w-4 h-4 text-gray-300" />}
              </div>

              {/* Results */}
              {newChatSearch.length >= 3 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-10 overflow-hidden">
                  {searchResults.length > 0 ? searchResults.map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleStartNewChat(r.phone)}
                      className="w-full text-left p-3 hover:bg-rose-50 border-b border-gray-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">{r.name}</p>
                        <p className="text-[10px] text-gray-500">{r.phone}</p>
                      </div>
                      <Plus className="w-4 h-4 text-rose-500" />
                    </button>
                  )) : !isSearching && (
                    <button
                      onClick={() => handleStartNewChat(newChatSearch)}
                      className="w-full text-left p-3 hover:bg-rose-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-rose-600">Iniciar con número directo</p>
                        <p className="text-[10px] text-gray-500">{newChatSearch}</p>
                      </div>
                      <Send className="w-4 h-4 text-rose-500" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setIsNewChatModalOpen(false)}
              className="w-full py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && activeConv && (
        <TemplateModal
          conversationId={activeConv.id}
          conversationPhone={activeConv.phone}
          recipientName={activeConv.client_name ?? activeConv.phone}
          onClose={() => setShowTemplateModal(false)}
          onSent={() => {
            setShowTemplateModal(false);
            setReplyError(null);
            loadMessages(activeConv.id);
          }}
        />
      )}

      {/* Silenced Clients Modal */}
      {showSilencedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowSilencedModal(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">Clientes silenciados</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tienen reserva reciente pero NO te han escrito por WhatsApp desde la migración del 18 de mayo.
                    Probablemente tienen tu contacto cacheado y necesitan borrarlo + guardarlo de nuevo.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSilencedModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {silencedLoading ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                </div>
              ) : silenced.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">
                  No hay clientes silenciados 🎉
                </div>
              ) : (
                <div className="space-y-1.5">
                  {silenced.map((s) => (
                    <div key={s.client_phone} className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50/40 border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{s.client_name}</p>
                        <p className="text-xs text-gray-500 truncate">{s.client_phone} · última reserva {new Date(s.last_booking_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} · {s.total_bookings} reservas</p>
                      </div>
                      <a
                        href={`tel:${s.client_phone}`}
                        className="text-[11px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                        title="Llamar"
                      >
                        📞 Llamar
                      </a>
                      <button
                        onClick={() => copySmsMessage(s.client_phone, s.client_name)}
                        className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                          copiedPhone === s.client_phone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        }`}
                        title="Copia un mensaje listo para enviar por SMS o Instagram"
                      >
                        {copiedPhone === s.client_phone ? "✓ Copiado" : "📋 Copiar mensaje"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-amber-50/30 shrink-0">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                💡 <strong>Acción recomendada:</strong> Envía el mensaje copiado por SMS, Instagram DM o cualquier canal alternativo.
                Cuando la clienta refresque el contacto, podrá escribirte por WhatsApp normalmente. Total: <strong>{silenced.length} clientes</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && activeConv && (
        <AdminNewBookingModal
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
          }}
          clientPrefill={{
            name: activeConv.client_name || "",
            phone: activeConv.phone || "",
            email: activeConv.client_email || ""
          }}
        />
      )}
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
  if (m.role === "tool") {
    let toolName = "Tool";
    try {
      const tc = m.tool_calls as { tool_name?: string } | null;
      if (tc?.tool_name) toolName = tc.tool_name;
    } catch { /* ignore */ }
    return (
      <div className="flex justify-center">
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 max-w-md">
          <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium mb-1">
            <Wrench className="w-3 h-3" /> {toolName}
          </div>
          <pre className="text-xs text-blue-900 whitespace-pre-wrap font-mono break-all">
            {(m.content ?? "").length > 300 ? (m.content ?? "").slice(0, 300) + "..." : m.content}
          </pre>
        </div>
      </div>
    );
  }

  const isUser = m.direction === "inbound" && m.role === "user";
  const isAssistant = m.role === "assistant";
  const isSystem = m.role === "system";

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-md px-4 py-2 rounded-2xl ${
        isUser
          ? "bg-white border border-gray-200 text-gray-900"
          : isSystem
            ? "bg-purple-100 text-purple-900"
            : "bg-rose-500 text-white"
      }`}>
        <div className="text-sm whitespace-pre-wrap mb-1">{m.content}</div>
        <div className="flex items-center justify-between gap-2 text-xs opacity-75">
          <div className="flex items-center gap-1.5">
            {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
            <span>{isUser ? "Cliente" : isSystem ? "Admin" : "Bot"}</span>
            <span>·</span>
            <span>{formatTime(m.created_at)}</span>
          </div>
          {!isUser && (
            <span className="flex items-center gap-0.5" title={m.status}>
              {m.status === "read" ? (
                <CheckCheck className="w-3 h-3 text-sky-400" />
              ) : m.status === "delivered" ? (
                <CheckCheck className="w-3 h-3 text-gray-300" />
              ) : m.status === "sent" ? (
                <Check className="w-3 h-3 text-gray-300" />
              ) : m.status === "failed" ? (
                <AlertCircle className="w-3 h-3 text-rose-300" />
              ) : null}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TemplateModal — list approved Meta templates, fill variables, send
// ============================================================================

interface TemplateModalProps {
  conversationId: string;
  conversationPhone: string;
  recipientName: string;
  onClose: () => void;
  onSent: () => void;
}

function TemplateModal({ conversationId, conversationPhone, recipientName, onClose, onSent }: TemplateModalProps) {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TemplateMeta | null>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [autoFilled, setAutoFilled] = useState<boolean[]>([]);
  const [autoFillNote, setAutoFillNote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase.functions.invoke("whatsapp-templates", { body: {} });
        if (error) throw error;
        if (data?.error) {
          setLoadError(data.error);
        } else {
          setTemplates(data?.templates ?? []);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Error al cargar plantillas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = async (t: TemplateMeta) => {
    setSelected(t);
    setSendError(null);
    setAutoFillNote(null);
    const initial = Array(t.variable_count).fill("");
    setVariables(initial);
    setAutoFilled(Array(t.variable_count).fill(false));

    if (t.variable_count === 0) return;

    // Infer what each {{n}} means from the body context
    const kinds = inferVariableKinds(t.body_text, t.variable_count);

    // Resolve auto-fill values for kinds we care about
    const firstName = (recipientName || "").split(" ").filter(Boolean)[0] || "";
    let nextBookingDate = "";
    let nextBookingTime = "";
    let proName = "";
    let points = "";

    try {
      const last9 = (conversationPhone || "").replace(/\D/g, "").slice(-9);
      if (last9) {
        // Query points
        const { data: client } = await supabase
          .from("client_accounts")
          .select("points")
          .ilike("phone", `%${last9}`)
          .maybeSingle();
        if (client) {
          points = String(client.points || 0);
        }

        const todayISO = new Date().toISOString().slice(0, 10);
        const { data: bk } = await supabase
          .from("bookings")
          .select("booking_date, booking_time, profiles:professional_id(name)")
          .ilike("client_phone", `%${last9}`)
          .gte("booking_date", todayISO)
          .neq("status", "cancelled")
          .order("booking_date", { ascending: true })
          .order("booking_time", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (bk) {
          nextBookingDate = formatBookingDate(bk.booking_date);
          nextBookingTime = (bk.booking_time || "").slice(0, 5);
          const prof = bk.profiles as { name?: string } | null;
          proName = prof?.name || "";
        }
      }
    } catch {
      /* best effort — leave empty so user fills manually */
    }

    const next = [...initial];
    const filledFlags = Array(t.variable_count).fill(false);
    kinds.forEach((kind, i) => {
      let val = "";
      switch (kind) {
        case "name": val = firstName; break;
        case "date": val = nextBookingDate; break;
        case "time": val = nextBookingTime; break;
        case "professional": val = proName; break;
        case "points": val = points; break;
        default: val = "";
      }
      if (val) {
        next[i] = val;
        filledFlags[i] = true;
      }
    });
    setVariables(next);
    setAutoFilled(filledFlags);

    const filledCount = filledFlags.filter(Boolean).length;
    if (filledCount > 0) {
      setAutoFillNote(
        nextBookingDate
          ? `✨ ${filledCount}/${t.variable_count} variables rellenadas con la próxima cita de ${recipientName.split(" ")[0]}`
          : `✨ ${filledCount}/${t.variable_count} variables rellenadas`
      );
    } else if (!nextBookingDate) {
      setAutoFillNote("ℹ️ No encontré una próxima cita de esta clienta — rellena a mano.");
    }
  };

  const handleSend = async () => {
    if (!selected) return;
    // Check all variables are filled
    if (variables.some(v => !v.trim())) {
      setSendError("Rellena todas las variables antes de enviar.");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const components: Array<{ type: string; parameters: Array<{ type: string; text: string }> }> = [];
      if (selected.variable_count > 0) {
        components.push({
          type: "body",
          parameters: variables.map(v => ({ type: "text", text: v })),
        });
      }
      const template: { name: string; language: { code: string }; components?: unknown[] } = {
        name: selected.name,
        language: { code: selected.language },
      };
      if (components.length) template.components = components;

      // Render the body with variables substituted so the chat panel shows
      // the real message instead of just "Plantilla enviada".
      const displayText = renderPreview(selected.body_text, variables);
      const { data, error } = await supabase.functions.invoke("whatsapp-outbound", {
        body: { conversationId, template, displayText },
      });
      if (error) throw error;
      if (data?.success) {
        onSent();
      } else {
        setSendError(data?.error || "WhatsApp no aceptó el envío.");
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Error de red al enviar.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="font-bold text-gray-900">Enviar plantilla</h3>
              <p className="text-[11px] text-gray-400">A {recipientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-10 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Cargando plantillas aprobadas...</p>
            </div>
          ) : loadError ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{loadError}</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">No hay plantillas aprobadas</p>
              <p className="text-xs mt-1">Créalas y apruebalas en Meta Business Manager → WhatsApp Manager → Plantillas.</p>
            </div>
          ) : !selected ? (
            // Template list
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {templates.length} plantilla{templates.length !== 1 ? "s" : ""} aprobada{templates.length !== 1 ? "s" : ""}
              </p>
              {templates.map(t => (
                <button
                  key={`${t.name}_${t.language}`}
                  onClick={() => handleSelect(t)}
                  className="w-full text-left p-3 border border-gray-100 rounded-xl hover:border-rose-200 hover:bg-rose-50/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{t.language}</span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        {t.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed whitespace-pre-wrap">{t.body_text}</p>
                  {t.variable_count > 0 && (
                    <p className="text-[10px] text-rose-500 font-semibold mt-1.5">
                      {t.variable_count} variable{t.variable_count !== 1 ? "s" : ""} a rellenar
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            // Selected template — fill variables
            <div className="space-y-4">
              <button
                onClick={() => { setSelected(null); setSendError(null); }}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1"
              >
                ← Volver a la lista
              </button>

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900 text-sm">{selected.name}</p>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{selected.language}</span>
                </div>
                {selected.header_text && (
                  <p className="text-xs font-bold text-gray-700 mb-1">{selected.header_text}</p>
                )}
                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{selected.body_text}</p>
                {selected.footer_text && (
                  <p className="text-[10px] text-gray-400 mt-2 italic">{selected.footer_text}</p>
                )}
              </div>

              {autoFillNote && (
                <div className="px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
                  {autoFillNote}
                </div>
              )}

              {selected.variable_count > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Variables</p>
                  {variables.map((v, i) => (
                    <div key={i}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center justify-between">
                        <span>Variable {`{{${i + 1}}}`}</span>
                        {autoFilled[i] && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            ✨ auto
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={v}
                        onChange={e => {
                          const next = [...variables];
                          next[i] = e.target.value;
                          setVariables(next);
                          if (autoFilled[i]) {
                            const flags = [...autoFilled];
                            flags[i] = false;
                            setAutoFilled(flags);
                          }
                          if (sendError) setSendError(null);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none ${
                          autoFilled[i]
                            ? "border-emerald-300 bg-emerald-50/30 focus:border-emerald-400"
                            : "border-gray-200 focus:border-rose-300"
                        }`}
                        placeholder={`Valor para {{${i + 1}}}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Live preview */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Vista previa</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {renderPreview(selected.body_text, variables)}
                </p>
              </div>

              {sendError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{sendError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions (only when template selected) */}
        {selected && (
          <div className="p-4 border-t border-gray-100 flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Enviando..." : "Enviar plantilla"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
