import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { GOOGLE_REVIEW_URL } from "@/lib/constants";

interface ProfessionalProfile {
  id: string;
  user_id: string;
  bio: string | null;
  specialties: string[] | null;
  profiles: { name: string | null; email: string | null } | null;
}

interface Review {
  id: string;
  professional_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  professional_profiles?: ProfessionalProfile;
}

interface ReviewFormState {
  professionalId: string;
  rating: number;
  comment: string;
}

export default function ClientReviewsTab({ clientPhone }: { clientPhone?: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ReviewFormState>({ professionalId: "", rating: 5, comment: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = async () => {
    if (!user && !clientPhone) return;
    setLoading(true);

    let reviewsQuery = supabase
      .from("professional_reviews")
      .select("*, professional_profiles(id, user_id, bio, specialties, profiles(name, email))")
      .order("created_at", { ascending: false });

    if (clientPhone) {
      reviewsQuery = reviewsQuery.eq("reviewer_phone", clientPhone);
    } else {
      reviewsQuery = reviewsQuery.eq("reviewer_email", user!.email);
    }

    const [reviewsRes, prosRes] = await Promise.all([
      reviewsQuery,
      supabase
        .from("professional_profiles")
        .select("id, user_id, bio, specialties, profiles(name, email)")
        .eq("active", true),
    ]);
    setReviews((reviewsRes.data ?? []) as Review[]);
    setProfessionals((prosRes.data ?? []) as ProfessionalProfile[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user, clientPhone]);

  const handleSubmit = async () => {
    if ((!user && !clientPhone) || !form.professionalId || !form.comment.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await supabase
          .from("professional_reviews")
          .update({ rating: form.rating, comment: form.comment, updated_at: new Date().toISOString() })
          .eq("id", editingId);
        setToast("Reseña actualizada correctamente");
      } else {
        const reviewerName = user
          ? (user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Cliente")
          : "Cliente";
        await supabase.from("professional_reviews").insert({
          professional_id: form.professionalId,
          reviewer_name: reviewerName,
          reviewer_email: user?.email ?? null,
          reviewer_phone: clientPhone ?? null,
          rating: form.rating,
          comment: form.comment,
        });
        setToast("¡Reseña publicada! Gracias por tu opinión");
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ professionalId: "", rating: 5, comment: "" });
      await loadData();
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const handleEdit = (review: Review) => {
    setForm({
      professionalId: review.professional_id,
      rating: review.rating,
      comment: review.comment ?? "",
    });
    setEditingId(review.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("professional_reviews").delete().eq("id", id);
    setDeleteConfirm(null);
    setToast("Reseña eliminada");
    await loadData();
    setTimeout(() => setToast(""), 3000);
  };

  const getProfName = (pro: ProfessionalProfile | undefined) => {
    if (!pro) return "Profesional";
    return pro.profiles?.name ?? pro.profiles?.email?.split("@")[0] ?? "Profesional";
  };

  const alreadyReviewed = (proId: string) => reviews.some(r => r.professional_id === proId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-6 text-white flex items-center gap-4">
        <div className="w-14 h-14 flex items-center justify-center bg-white/20 rounded-xl shrink-0">
          <i className="ri-star-line text-2xl"></i>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Mis reseñas</h2>
          <p className="text-sm opacity-90">Comparte tu experiencia con NAILOX en Google</p>
        </div>
      </div>

      {/* CTA Google Business — todas las reseñas nuevas van a Google */}
      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-rose-200 transition-all group"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-rose-50 flex items-center justify-center shrink-0">
            <i className="ri-google-fill text-3xl bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 bg-clip-text text-transparent"></i>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900">Deja tu reseña en Google</h3>
              <div className="flex">
                {[1,2,3,4,5].map(i => <i key={i} className="ri-star-fill text-amber-400 text-sm"></i>)}
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Tu opinión nos ayuda muchísimo y permite que otras clientas descubran NAILOX. Tarda menos de 1 minuto.
            </p>
            <span className="inline-flex items-center gap-2 bg-rose-500 group-hover:bg-rose-600 transition-colors text-white px-5 py-2.5 rounded-full text-sm font-bold">
              <i className="ri-star-line"></i> Escribir reseña en Google
              <i className="ri-external-link-line text-xs"></i>
            </span>
          </div>
        </div>
      </a>

      {/* Toast */}
      {toast && (
        <div className="bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <i className="ri-check-line"></i>{toast}
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">
              {editingId ? "Editar reseña" : "Nueva reseña"}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <i className="ri-close-line text-gray-500"></i>
            </button>
          </div>
          <div className="space-y-4">
            {!editingId && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Profesional</label>
                <select
                  value={form.professionalId}
                  onChange={e => setForm(p => ({ ...p, professionalId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 outline-none text-sm bg-white cursor-pointer"
                >
                  <option value="">Selecciona una profesional...</option>
                  {professionals.map(pro => (
                    <option key={pro.id} value={pro.id} disabled={alreadyReviewed(pro.id)}>
                      {getProfName(pro)}{alreadyReviewed(pro.id) ? " (ya reseñada)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Valoración</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setForm(p => ({ ...p, rating: star }))}
                    className="cursor-pointer transition-transform hover:scale-110"
                  >
                    <i className={`text-2xl ${star <= form.rating ? "ri-star-fill text-amber-400" : "ri-star-line text-gray-200"}`}></i>
                  </button>
                ))}
                <span className="text-sm text-gray-500 ml-2">
                  {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][form.rating]}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Comentario</label>
              <textarea
                value={form.comment}
                onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                placeholder="Cuéntanos tu experiencia con esta profesional..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm resize-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.comment.length}/500</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.comment.trim() || (!editingId && !form.professionalId)}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <><i className="ri-loader-4-line animate-spin"></i>Guardando...</> : <><i className="ri-send-plane-line"></i>{editingId ? "Actualizar" : "Publicar reseña"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-star-line text-2xl text-amber-300"></i>
          </div>
          <p className="text-gray-500 font-medium">Aún no has dejado ninguna reseña</p>
          <p className="text-sm text-gray-400 mt-1">Comparte tu experiencia directamente en Google ☝️</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{reviews.length} reseña{reviews.length !== 1 ? "s" : ""} publicada{reviews.length !== 1 ? "s" : ""}</p>
          {reviews.map(review => {
            const pro = review.professional_profiles;
            return (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {getProfName(pro).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{getProfName(pro)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(review)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Editar reseña"
                    >
                      <i className="ri-edit-line text-sm"></i>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(review.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar reseña"
                    >
                      <i className="ri-delete-bin-line text-sm"></i>
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <i key={s} className={`text-sm ${s <= review.rating ? "ri-star-fill text-amber-400" : "ri-star-line text-gray-200"}`}></i>
                    ))}
                    <span className="text-xs text-gray-400 ml-2">{review.rating}/5</span>
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-delete-bin-line text-red-500 text-xl"></i>
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-2">¿Eliminar esta reseña?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold cursor-pointer transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
