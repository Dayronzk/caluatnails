import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { supabase } from "@/lib/supabase";
import { Loader, Search, MessageCircle, CheckCircle, Clock, Send, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface ForumQuestion {
  id: string;
  student_id: string | null;
  student_name: string | null;
  student_email: string;
  category: string;
  title: string;
  message: string;
  admin_reply: string | null;
  replied_at: string | null;
  resolved: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return email[0].toUpperCase();
}

const gradients = [
  "from-rose-400 to-rose-600",
  "from-orange-400 to-amber-500",
  "from-pink-400 to-rose-500",
  "from-red-400 to-rose-500",
  "from-amber-400 to-orange-500",
];

export default function AdminForum() {
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "resolved">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("forum_questions")
      .select("*")
      .order("created_at", { ascending: false });
    setQuestions((data ?? []) as ForumQuestion[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleReply = async (question: ForumQuestion) => {
    const reply = replyTexts[question.id]?.trim();
    if (!reply) return;
    setSaving(question.id);
    const { error } = await supabase
      .from("forum_questions")
      .update({
        admin_reply: reply,
        replied_at: new Date().toISOString(),
        resolved: true,
      })
      .eq("id", question.id);
    setSaving(null);
    if (!error) {
      setQuestions(prev =>
        prev.map(q =>
          q.id === question.id
            ? { ...q, admin_reply: reply, replied_at: new Date().toISOString(), resolved: true }
            : q
        )
      );
      setReplyTexts(prev => ({ ...prev, [question.id]: "" }));
      showToast("Respuesta enviada");
    }
  };

  const handleToggleResolved = async (question: ForumQuestion) => {
    const newResolved = !question.resolved;
    await supabase
      .from("forum_questions")
      .update({ resolved: newResolved })
      .eq("id", question.id);
    setQuestions(prev =>
      prev.map(q => q.id === question.id ? { ...q, resolved: newResolved } : q)
    );
    showToast(newResolved ? "Marcado como resuelto" : "Marcado como pendiente");
  };

  const handleDelete = async (question: ForumQuestion) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta pregunta? Esta acción no se puede deshacer.")) return;
    
    setSaving(question.id);
    const { error } = await supabase
      .from("forum_questions")
      .delete()
      .eq("id", question.id);
    
    setSaving(null);
    if (!error) {
      setQuestions(prev => prev.filter(q => q.id !== question.id));
      setExpandedId(null);
      showToast("Pregunta eliminada");
    } else {
      showToast("Error al eliminar la pregunta");
    }
  };

  const filtered = questions.filter(q => {
    const matchSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.student_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "resolved" && q.resolved) ||
      (filterStatus === "pending" && !q.resolved);
    return matchSearch && matchStatus;
  });

  const pendingCount = questions.filter(q => !q.resolved).length;
  const resolvedCount = questions.filter(q => q.resolved).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">
        {toast && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-medium shadow-lg">
            <i className="ri-check-line mr-2"></i>{toast}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Foro de Preguntas</h1>
            <p className="text-gray-500 mt-1">Responde las dudas de tus estudiantes</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-700">{pendingCount}</span>
              <span className="text-amber-600 text-sm">pendientes</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-emerald-700">{resolvedCount}</span>
              <span className="text-emerald-600 text-sm">resueltos</span>
            </div>
            <button onClick={loadQuestions}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium whitespace-nowrap">
              <i className="ri-refresh-line"></i>Actualizar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, estudiante o categoría..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
            {(["all", "pending", "resolved"] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterStatus === status
                    ? "bg-rose-600 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {status === "all" ? "Todos" : status === "pending" ? "Pendientes" : "Resueltos"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-rose-400 animate-spin" />
            <span className="ml-3 text-gray-500">Cargando preguntas...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {searchQuery || filterStatus !== "all" ? "No se encontraron preguntas" : "Aún no hay preguntas"}
            </h3>
            <p className="text-gray-400 text-sm">
              {searchQuery || filterStatus !== "all"
                ? "Prueba ajustando los filtros"
                : "Las preguntas del foro aparecerán aquí cuando los estudiantes las publiquen"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((question, idx) => (
              <div
                key={question.id}
                className={`bg-white rounded-2xl border transition-all ${
                  question.resolved ? "border-emerald-100" : "border-amber-100"
                }`}
              >
                {/* Question header */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === question.id ? null : question.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                      {getInitials(question.student_name, question.student_email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1 min-w-0">
                          {question.title}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                            question.resolved
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}>
                            {question.resolved ? "Resuelto" : "Pendiente"}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-medium whitespace-nowrap">
                            {question.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="font-medium text-gray-600">
                          {question.student_name ?? question.student_email}
                        </span>
                        <span>{question.student_email}</span>
                        <span>{timeAgo(question.created_at)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-gray-400">
                      {expandedId === question.id
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />
                      }
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {expandedId === question.id && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                    {/* Student message */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pregunta del estudiante</p>
                      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                        {question.message}
                      </div>
                    </div>

                    {/* Existing reply */}
                    {question.admin_reply && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
                          Tu respuesta · {question.replied_at ? timeAgo(question.replied_at) : ""}
                        </p>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                          {question.admin_reply}
                        </div>
                      </div>
                    )}

                    {/* Reply box */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {question.admin_reply ? "Actualizar respuesta" : "Escribir respuesta"}
                      </p>
                      <textarea
                        value={replyTexts[question.id] ?? (question.admin_reply ?? "")}
                        onChange={e => setReplyTexts(prev => ({ ...prev, [question.id]: e.target.value }))}
                        rows={3}
                        placeholder="Escribe tu respuesta aquí..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none"
                      />
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => handleToggleResolved(question)}
                            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                              question.resolved
                                ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {question.resolved ? "Marcar como pendiente" : "Marcar como resuelto"}
                          </button>
                          <button
                            onClick={() => handleDelete(question)}
                            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                        <button
                          onClick={() => handleReply(question)}
                          disabled={saving === question.id || !replyTexts[question.id]?.trim()}
                          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {saving === question.id ? (
                            <><i className="ri-loader-4-line animate-spin"></i>Enviando...</>
                          ) : (
                            <><Send className="w-4 h-4" />Enviar respuesta</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
