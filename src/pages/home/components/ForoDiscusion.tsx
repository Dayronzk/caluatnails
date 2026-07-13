import { useState, useEffect } from "react";
import { forumCategories } from "@/mocks/courseData";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface ForumQuestion {
  id: string;
  student_name: string | null;
  student_email: string;
  category: string;
  title: string;
  message: string;
  admin_reply: string | null;
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
  return days < 30 ? `hace ${days}d` : new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return email[0].toUpperCase();
}

const avatarColors = [
  "bg-rose-100 text-rose-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
  "bg-red-100 text-red-600",
  "bg-amber-100 text-amber-600",
];

export default function ForoDiscusion() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: "", title: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingPosts(true);
      const { data } = await supabase
        .from("forum_questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setQuestions((data ?? []) as ForumQuestion[]);
      setLoadingPosts(false);
    };
    loadQuestions();
  }, []);

  const filteredPosts = activeCategory
    ? questions.filter(q => {
        const cat = forumCategories.find(c => c.id === activeCategory);
        return cat ? q.category === cat.name : true;
      })
    : questions;

  const handleNewQuestion = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("forum_questions").insert({
      student_id: user.id,
      student_name: user.user_metadata?.name ?? null,
      student_email: user.email ?? "",
      category: formData.category,
      title: formData.title,
      message: formData.message,
    });
    if (!error) {
      setSubmitted(true);
      // Reload questions
      const { data } = await supabase
        .from("forum_questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setQuestions((data ?? []) as ForumQuestion[]);
    }
    setSubmitting(false);
  };

  return (
    <section id="foro" className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <span className="inline-block text-rose-600 text-sm font-semibold tracking-widest uppercase mb-3">
              Módulo 10 — Comunidad
            </span>
            <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Aprende con la
              <br />
              <span className="text-rose-600">Comunidad</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-600 text-xs font-medium">{questions.length} pregunta{questions.length !== 1 ? "s" : ""} en el foro</span>
            </div>
            <button
              onClick={handleNewQuestion}
              className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-1.5"></i>
              {user ? "Nueva Pregunta" : "Inicia sesión para preguntar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50">
                <h3 className="text-gray-900 font-semibold text-sm">Categorías</h3>
              </div>
              <div className="p-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    activeCategory === null ? "bg-rose-50 text-rose-700 font-semibold" : "text-gray-700 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 flex items-center justify-center bg-rose-100 rounded-lg">
                      <i className="ri-apps-line text-rose-500 text-xs"></i>
                    </div>
                    <span>Todas</span>
                  </div>
                  <span className="text-gray-400 text-xs">{questions.length}</span>
                </button>

                {forumCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-between gap-2 mt-0.5 ${
                      activeCategory === cat.id ? "bg-rose-50 text-rose-700 font-semibold" : "text-gray-700 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 ${cat.color === "rose" ? "bg-rose-100" : "bg-orange-100"}`}>
                        <i className={`${cat.icon} text-xs ${cat.color === "rose" ? "text-rose-500" : "text-orange-500"}`}></i>
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className="text-gray-400 text-xs flex-shrink-0">
                      {questions.filter(q => q.category === cat.name).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <h3 className="text-gray-700 font-semibold text-sm">
              {activeCategory
                ? `Categoría: ${forumCategories.find(c => c.id === activeCategory)?.name}`
                : "Preguntas Recientes"}
              <span className="text-gray-400 font-normal ml-2">({filteredPosts.length})</span>
            </h3>

            {loadingPosts ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
                <i className="ri-loader-4-line animate-spin text-xl block mb-2"></i>
                Cargando preguntas...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <i className="ri-chat-3-line text-3xl text-gray-200 block mb-2"></i>
                <p className="text-gray-400 text-sm">
                  {activeCategory ? "No hay preguntas en esta categoría." : "Sé la primera en hacer una pregunta."}
                </p>
              </div>
            ) : (
              filteredPosts.map((post, idx) => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-rose-100 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-xs flex-shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                      {getInitials(post.student_name, post.student_email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-gray-900 text-sm leading-snug">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {post.resolved && (
                            <span className="bg-emerald-50 text-emerald-600 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                              Resuelto
                            </span>
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                            forumCategories.find(c => c.name === post.category)?.color === "rose"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-orange-50 text-orange-600"
                          }`}>
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed mb-3">{post.message}</p>
                      {post.admin_reply && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-3">
                          <p className="text-xs font-semibold text-emerald-600 mb-1">
                            <i className="ri-customer-service-line mr-1"></i>Respuesta del instructor
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">{post.admin_reply}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-gray-500 text-xs font-medium">{post.student_name ?? post.student_email}</span>
                        <span className="text-gray-300 text-xs">{timeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* New Question Modal */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="font-playfair text-xl font-bold text-gray-900">Nueva Pregunta</h3>
                <button
                  onClick={() => { setShowForm(false); setSubmitted(false); }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer transition-colors"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>

              {submitted ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4">
                    <i className="ri-check-line text-3xl text-green-600"></i>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">¡Pregunta publicada!</h4>
                  <p className="text-gray-500 text-sm mb-5">Tu pregunta fue publicada. La instructora te responderá pronto.</p>
                  <button
                    onClick={() => { setShowForm(false); setSubmitted(false); }}
                    className="bg-rose-600 text-white text-sm font-medium px-6 py-2.5 rounded-full cursor-pointer whitespace-nowrap hover:bg-rose-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                  <div className="bg-rose-50 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-rose-700">
                    <i className="ri-user-line"></i>
                    <span>Publicando como <strong>{user?.user_metadata?.name ?? user?.email}</strong></span>
                  </div>
                  <div>
                    <label className="text-gray-700 text-xs font-semibold block mb-1.5">Categoría *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-rose-300 transition-colors"
                    >
                      <option value="">Selecciona una categoría</option>
                      {forumCategories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-700 text-xs font-semibold block mb-1.5">Título de tu pregunta *</label>
                    <input
                      type="text"
                      required
                      placeholder="¿Qué quieres saber?"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-rose-300 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 text-xs font-semibold block mb-1.5">
                      Descripción * <span className="text-gray-400 font-normal">({formData.message.length}/500)</span>
                    </label>
                    <textarea
                      required
                      maxLength={500}
                      rows={4}
                      placeholder="Describe tu duda con el mayor detalle posible..."
                      value={formData.message}
                      onChange={e => {
                        if (e.target.value.length <= 500) setFormData({ ...formData, message: e.target.value });
                      }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-rose-300 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || formData.message.length > 500}
                    className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-semibold py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap text-sm"
                  >
                    {submitting
                      ? <><i className="ri-loader-4-line animate-spin mr-2"></i>Publicando...</>
                      : "Publicar Pregunta"
                    }
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
