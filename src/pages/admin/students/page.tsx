import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import {
  Users, Search, Mail, Calendar, Clock, Loader, Trash2,
  BookOpen, ShieldCheck, ShoppingBag, Star, RefreshCw,
  CheckCircle, Lock, Unlock, Send,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
  course_completed: boolean;
  course_access: boolean;
  is_professional: boolean;
  created_at: string | null;
  last_sign_in_at: string | null;
  signup_source: "manual" | "booking" | "google" | "purchase" | null;
}

interface Purchase {
  id: string;
  product_id: string;
  amount_total: number | null;
  currency: string;
  status: string;
  created_at: string;
}

interface StudentWithProgress extends Profile {
  completedLessons: number;
  purchases: Purchase[];
  bookingCount: number;
  bookingTotal: number;
}

// ─── Role tab config ──────────────────────────────────────────────────────────

type RoleTab = "all" | "admin" | "professional" | "client" | "student";

const ROLE_TABS: { key: RoleTab; label: string; icon: string; color: string; activeColor: string }[] = [
  { key: "all",          label: "Todos",          icon: "ri-group-line",         color: "text-gray-500",   activeColor: "bg-gray-800 text-white" },
  { key: "admin",        label: "Administradores", icon: "ri-shield-check-line",  color: "text-rose-500",   activeColor: "bg-rose-500 text-white" },
  { key: "professional", label: "Profesionales",   icon: "ri-star-line",          color: "text-amber-500",  activeColor: "bg-amber-500 text-white" },
  { key: "client",       label: "Clientes",        icon: "ri-calendar-check-line",color: "text-violet-500", activeColor: "bg-violet-500 text-white" },
  { key: "student",      label: "Estudiantes",     icon: "ri-book-open-line",     color: "text-emerald-500",activeColor: "bg-emerald-500 text-white" },
];

// ─── Source badge config ──────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string; dot: string }> = {
  booking:  { label: "Reserva",  icon: "ri-calendar-check-line", bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400" },
  manual:   { label: "Registro", icon: "ri-user-add-line",        bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400" },
  google:   { label: "Google",   icon: "ri-google-line",          bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400" },
  purchase: { label: "Compra",   icon: "ri-shopping-bag-line",    bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function getInitials(name: string | null, email: string | null): string {
  if (name) return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (email ?? "?")[0].toUpperCase();
}

function formatAmount(amount: number | null, currency: string): string {
  if (amount === null) return "—";
  const value = amount / 100;
  if (currency.toLowerCase() === "eur") return `${value.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
  if (currency.toLowerCase() === "usd") return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  return `${value} ${currency.toUpperCase()}`;
}

function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length >= 9) {
    cleaned = cleaned.slice(-9);
  }
  return cleaned;
}

function classifyUser(s: StudentWithProgress): RoleTab {
  if (s.role === "admin") return "admin";
  if (s.is_professional) return "professional";
  
  // A student MUST have course access, course completed, purchases or at least one completed lesson
  const isStudent = s.course_access || s.course_completed || (s.purchases && s.purchases.length > 0) || s.completedLessons > 0;
  if (isStudent) return "student";
  
  return "client";
}

const gradients = [
  "from-rose-400 to-rose-600",
  "from-orange-400 to-amber-500",
  "from-pink-400 to-rose-500",
  "from-red-400 to-rose-500",
  "from-amber-400 to-orange-500",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminStudents() {
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [allLessons, setAllLessons] = useState<{ id: string; module_id: string }[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleTab, setRoleTab] = useState<RoleTab>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" }>({ msg: "", type: "success" });
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [progressActionId, setProgressActionId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    studentId: string;
    studentName: string;
    action: "reset" | "complete";
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<StudentWithProgress | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [
      { data: profiles },
      { data: progress },
      { data: lessons },
      { data: allPurchases },
      { data: allBookings },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, phone, name, role, course_completed, course_access, is_professional, created_at, last_sign_in_at, signup_source")
        .order("created_at", { ascending: false }),
      supabase.from("student_progress").select("student_id").eq("completed", true),
      supabase.from("lessons").select("id, module_id"),
      supabase.from("purchases").select("id, product_id, amount_total, currency, status, created_at, email"),
      supabase.from("bookings").select("user_id, client_email, client_phone, total_price, status"),
    ]);

    const total = (lessons ?? []).length;
    setTotalLessons(total);
    setAllLessons((lessons ?? []) as { id: string; module_id: string }[]);

    const completedByStudent: Record<string, number> = {};
    (progress ?? []).forEach((row: { student_id: string }) => {
      completedByStudent[row.student_id] = (completedByStudent[row.student_id] ?? 0) + 1;
    });

    const purchasesByEmail: Record<string, Purchase[]> = {};
    (allPurchases ?? []).forEach((p: Purchase & { email?: string }) => {
      const key = p.email ?? "";
      if (!purchasesByEmail[key]) purchasesByEmail[key] = [];
      purchasesByEmail[key].push(p);
    });

    // Bookings by user_id, email or phone
    const bookingsByUserId: Record<string, { count: number; total: number }> = {};
    const bookingsByEmail: Record<string, { count: number; total: number }> = {};
    const bookingsByPhone: Record<string, { count: number; total: number }> = {};
    (allBookings ?? []).forEach((b: { user_id: string | null; client_email: string | null; client_phone: string | null; total_price: string | null; status: string }) => {
      if (b.status === "cancelled") return;
      const price = Number(b.total_price) || 0;
      if (b.user_id) {
        if (!bookingsByUserId[b.user_id]) bookingsByUserId[b.user_id] = { count: 0, total: 0 };
        bookingsByUserId[b.user_id].count++;
        bookingsByUserId[b.user_id].total += price;
      }
      const emailKey = (b.client_email ?? "").toLowerCase().trim();
      if (emailKey) {
        if (!bookingsByEmail[emailKey]) bookingsByEmail[emailKey] = { count: 0, total: 0 };
        bookingsByEmail[emailKey].count++;
        bookingsByEmail[emailKey].total += price;
      }
      const phoneKey = normalizePhone(b.client_phone);
      if (phoneKey) {
        if (!bookingsByPhone[phoneKey]) bookingsByPhone[phoneKey] = { count: 0, total: 0 };
        bookingsByPhone[phoneKey].count++;
        bookingsByPhone[phoneKey].total += price;
      }
    });

    const enriched: StudentWithProgress[] = (profiles ?? []).map((p: Profile) => {
      const byId = bookingsByUserId[p.id];
      const byEmail = bookingsByEmail[(p.email ?? "").toLowerCase().trim()];
      const byPhone = bookingsByPhone[normalizePhone(p.phone) ?? ""];
      const bookingCount = byId?.count ?? byEmail?.count ?? byPhone?.count ?? 0;
      const bookingTotal = byId?.total ?? byEmail?.total ?? byPhone?.total ?? 0;
      return {
        ...p,
        course_completed: p.course_completed ?? false,
        course_access: p.course_access ?? false,
        is_professional: p.is_professional ?? false,
        completedLessons: completedByStudent[p.id] ?? 0,
        purchases: purchasesByEmail[p.email ?? ""] ?? [],
        bookingCount,
        bookingTotal,
      };
    });

    setStudents(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Resend access email ────────────────────────────────────────────────────
  const handleResendAccess = async (student: StudentWithProgress) => {
    if (!student.email) return;
    setResendingId(student.id);
    try {
      const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

      // Call brevo-email edge function with a special "account_access" type
      // We reuse the welcome type with a custom message
      const res = await fetch(`${SUPABASE_URL}/functions/v1/brevo-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          type: "welcome",
          to: { email: student.email, name: student.name ?? student.email },
          data: { name: student.name ?? student.email },
        }),
      });

      if (res.ok) {
        showToast(`Correo de acceso reenviado a ${student.email}`);
      } else {
        showToast("Error al reenviar el correo", "error");
      }
    } catch {
      showToast("Error al reenviar el correo", "error");
    }
    setResendingId(null);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (student: StudentWithProgress) => {
    setDeleteModal(student);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);

    const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        showToast("Sesión expirada. Recarga la página.", "error");
        setDeleteLoading(false);
        return;
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId: deleteModal.id }),
      });

      let result: { success?: boolean; error?: string } = {};
      try {
        result = await res.json();
      } catch {
        result = { error: `HTTP ${res.status}` };
      }

      if (!res.ok || result.error) {
        showToast(result.error ?? `Error ${res.status} al eliminar`, "error");
        setDeleteLoading(false);
        return;
      }

      setStudents(prev => prev.filter(p => p.id !== deleteModal.id));
      setDeleteModal(null);
      showToast("Usuario eliminado correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      showToast(msg, "error");
    }
    setDeleteLoading(false);
  };

  // ── Toggle field ───────────────────────────────────────────────────────────
  const handleToggleField = async (
    student: StudentWithProgress,
    field: "role" | "course_completed" | "is_professional" | "course_access",
    value: boolean | string
  ) => {
    setTogglingId(student.id + field);
    const { error } = await supabase.from("profiles").update({ [field]: value }).eq("id", student.id);
    if (error) {
      showToast("Error al actualizar. Verifica permisos de administrador.", "error");
      setTogglingId(null);
      return;
    }
    if (field === "is_professional") {
      if (value === true) {
        await supabase.from("professional_profiles").upsert(
          { user_id: student.id, bio: null, specialties: [], active: true },
          { onConflict: "user_id" }
        );
      } else {
        await supabase.from("professional_profiles").update({ active: false }).eq("user_id", student.id);
      }
    }
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, [field]: value } : s));
    const msgs: Record<string, string> = {
      role: value === "admin" ? "Ahora es administrador" : "Ahora es estudiante",
      course_completed: value ? "Curso marcado como completado" : "Curso desmarcado",
      is_professional: value ? "Habilitada como profesional" : "Removida de la agenda",
      course_access: value ? "Acceso al curso habilitado" : "Acceso al curso deshabilitado",
    };
    showToast(msgs[field] ?? "Actualizado");
    setTogglingId(null);
  };

  // ── Reset progress ─────────────────────────────────────────────────────────
  const handleResetProgress = async (studentId: string) => {
    setProgressActionId(studentId + "_reset");
    const { error } = await supabase.from("student_progress").delete().eq("student_id", studentId);
    if (error) {
      showToast("Error al reiniciar el progreso", "error");
    } else {
      await supabase.from("profiles").update({ course_completed: false }).eq("id", studentId);
      setStudents(prev => prev.map(s =>
        s.id === studentId ? { ...s, completedLessons: 0, course_completed: false } : s
      ));
      showToast("Progreso reiniciado correctamente");
    }
    setProgressActionId(null);
    setConfirmModal(null);
  };

  // ── Complete progress ──────────────────────────────────────────────────────
  const handleCompleteProgress = async (studentId: string) => {
    setProgressActionId(studentId + "_complete");
    const now = new Date().toISOString();
    const { data: existing } = await supabase.from("student_progress").select("lesson_id").eq("student_id", studentId);
    const existingIds = new Set((existing ?? []).map((r: { lesson_id: string }) => r.lesson_id));
    const toInsert = allLessons.filter(l => !existingIds.has(l.id)).map(l => ({
      student_id: studentId, lesson_id: l.id, module_id: l.module_id, completed: true, completed_at: now,
    }));
    if (toInsert.length > 0) await supabase.from("student_progress").insert(toInsert);
    await supabase.from("student_progress").update({ completed: true, completed_at: now }).eq("student_id", studentId).eq("completed", false);
    await supabase.from("profiles").update({ course_completed: true }).eq("id", studentId);
    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, completedLessons: totalLessons, course_completed: true } : s
    ));
    showToast("Progreso completado al 100%");
    setProgressActionId(null);
    setConfirmModal(null);
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = students.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (p.name ?? "").toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);
    const matchesSource = sourceFilter === "all" || (p.signup_source ?? "manual") === sourceFilter;
    const userType = classifyUser(p);
    const matchesRole = roleTab === "all" || userType === roleTab;
    return matchesSearch && matchesSource && matchesRole;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const adminCount      = students.filter(s => s.role === "admin").length;
  const proCount        = students.filter(s => s.is_professional).length;
  const clientCount     = students.filter(s => classifyUser(s) === "client").length;
  const studentCount    = students.filter(s => classifyUser(s) === "student").length;
  const completedCount  = students.filter(s => s.course_completed).length;
  const accessCount     = students.filter(s => s.course_access).length;
  const bookingCount    = students.filter(s => s.signup_source === "booking").length;
  const manualCount     = students.filter(s => !s.signup_source || s.signup_source === "manual").length;
  const avgProgress     = students.length > 0 && totalLessons > 0
    ? Math.round(students.reduce((s, st) => s + st.completedLessons, 0) / students.length / totalLessons * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">

        {/* Toast */}
        {toast.msg && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"} text-white`}>
            <i className={`${toast.type === "error" ? "ri-error-warning-line" : "ri-check-line"} mr-2`}></i>
            {toast.msg}
          </div>
        )}

        {/* Confirm modal */}
        {confirmModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.action === "reset" ? "bg-red-50" : "bg-emerald-50"}`}>
                {confirmModal.action === "reset"
                  ? <RefreshCw className="w-6 h-6 text-red-500" />
                  : <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              <h3 className="text-center font-bold text-gray-900 mb-2">
                {confirmModal.action === "reset" ? "¿Reiniciar progreso?" : "¿Completar progreso?"}
              </h3>
              <p className="text-center text-sm text-gray-500 mb-6">
                {confirmModal.action === "reset"
                  ? `Se eliminará todo el progreso de "${confirmModal.studentName}". Esta acción no se puede deshacer.`
                  : `Se marcarán todas las lecciones como completadas para "${confirmModal.studentName}".`}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors">Cancelar</button>
                <button
                  onClick={() => confirmModal.action === "reset" ? handleResetProgress(confirmModal.studentId) : handleCompleteProgress(confirmModal.studentId)}
                  disabled={!!progressActionId}
                  className={`flex-1 py-2.5 rounded-full text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${confirmModal.action === "reset" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
                >
                  {progressActionId ? <Loader className="w-4 h-4 animate-spin" /> : null}
                  {confirmModal.action === "reset" ? "Reiniciar" : "Completar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-center font-bold text-gray-900 mb-2">¿Eliminar usuario?</h3>
              <p className="text-center text-sm text-gray-500 mb-1">
                <strong>{deleteModal.name ?? deleteModal.email}</strong>
              </p>
              <p className="text-center text-xs text-gray-400 mb-6">
                Se eliminará la cuenta y todos sus datos. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleteLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteLoading ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1">Administradores, profesionales, clientes y estudiantes</p>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total",           val: students.length, icon: "ri-group-line",          bg: "bg-gray-50",    text: "text-gray-700" },
            { label: "Admins",          val: adminCount,      icon: "ri-shield-check-line",   bg: "bg-rose-50",    text: "text-rose-600" },
            { label: "Profesionales",   val: proCount,        icon: "ri-star-line",           bg: "bg-amber-50",   text: "text-amber-600" },
            { label: "Clientes",        val: clientCount,     icon: "ri-calendar-check-line", bg: "bg-violet-50",  text: "text-violet-600" },
            { label: "Estudiantes",     val: studentCount,    icon: "ri-book-open-line",      bg: "bg-emerald-50", text: "text-emerald-600" },
            { label: "Progreso medio",  val: `${avgProgress}%`, icon: "ri-bar-chart-line",    bg: "bg-sky-50",     text: "text-sky-600" },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
              <div className={`w-8 h-8 flex items-center justify-center shrink-0`}>
                <i className={`${s.icon} text-lg ${s.text}`}></i>
              </div>
              <div>
                <p className={`text-lg font-bold ${s.text}`}>{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Role tabs ── */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {ROLE_TABS.map(tab => {
            const count = tab.key === "all" ? students.length
              : tab.key === "admin" ? adminCount
              : tab.key === "professional" ? proCount
              : tab.key === "client" ? clientCount
              : studentCount;
            const isActive = roleTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setRoleTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${isActive ? tab.activeColor : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >
                <i className={`${tab.icon} text-sm`}></i>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
          <button onClick={loadData} className="ml-auto flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium whitespace-nowrap">
            <i className="ri-refresh-line"></i>Actualizar
          </button>
        </div>

        {/* ── Search + source filter ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Origen:</span>
            {[
              { key: "all",      label: "Todos",    count: students.length,                                              icon: "ri-group-line" },
              { key: "manual",   label: "Registro", count: manualCount,                                                  icon: "ri-user-add-line" },
              { key: "booking",  label: "Reserva",  count: bookingCount,                                                 icon: "ri-calendar-check-line" },
              { key: "google",   label: "Google",   count: students.filter(s => s.signup_source === "google").length,   icon: "ri-google-line" },
              { key: "purchase", label: "Compra",   count: students.filter(s => s.signup_source === "purchase").length, icon: "ri-shopping-bag-line" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setSourceFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${sourceFilter === f.key ? "bg-rose-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <i className={f.icon}></i>
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${sourceFilter === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Cards grid ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-rose-400 animate-spin" />
            <span className="ml-3 text-gray-500">Cargando usuarios...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {searchQuery ? "No se encontraron usuarios" : "No hay usuarios en esta categoría"}
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((student, idx) => {
              const pct = totalLessons > 0 ? Math.round((student.completedLessons / totalLessons) * 100) : 0;
              const isAdmin = student.role === "admin";
              const isResetting = progressActionId === student.id + "_reset";
              const isCompleting = progressActionId === student.id + "_complete";
              const isResending = resendingId === student.id;
              const source = student.signup_source ?? "manual";
              const srcCfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.manual;
              const userType = classifyUser(student);

              // ── Card border by type ──
              const cardBorder =
                isAdmin ? "border-rose-200 ring-1 ring-rose-100" :
                student.is_professional ? "border-amber-200 ring-1 ring-amber-100" :
                userType === "client" ? "border-violet-200 ring-1 ring-violet-50" :
                student.course_access ? "border-teal-200 ring-1 ring-teal-50" :
                "border-gray-100 hover:border-gray-200";

              // ── Top banner by type ──
              const topBanner = isAdmin ? (
                <div className="flex items-center gap-1.5 bg-rose-50 rounded-t-2xl px-4 py-2 border-b border-rose-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-semibold text-rose-600">Administrador</span>
                </div>
              ) : student.is_professional ? (
                <div className="flex items-center gap-1.5 bg-amber-50 rounded-t-2xl px-4 py-2 border-b border-amber-100">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600">Profesional en agenda</span>
                </div>
              ) : userType === "client" ? (
                <div className="flex items-center gap-1.5 bg-violet-50 rounded-t-2xl px-4 py-2 border-b border-violet-100">
                  <i className="ri-calendar-check-line text-violet-500 text-xs"></i>
                  <span className="text-xs font-semibold text-violet-600">Cliente de reservas</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-emerald-50 rounded-t-2xl px-4 py-2 border-b border-emerald-100">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600">Estudiante</span>
                </div>
              );

              return (
                <div key={student.id} className={`bg-white rounded-2xl border transition-colors ${cardBorder}`}>
                  {topBanner}

                  <div className="p-5">
                    {/* ── User header ── */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                          {getInitials(student.name, student.email)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{student.name ?? "Sin nombre"}</h3>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${srcCfg.bg} ${srcCfg.text} shrink-0`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${srcCfg.dot}`}></span>
                              {srcCfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{student.email ?? "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Resend access email button — only for booking-source users */}
                        {student.signup_source === "booking" && (
                          <button
                            onClick={() => handleResendAccess(student)}
                            disabled={isResending}
                            title="Reenviar correo de acceso"
                            className="w-8 h-8 rounded-lg hover:bg-violet-50 flex items-center justify-center text-gray-300 hover:text-violet-500 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isResending
                              ? <Loader className="w-3.5 h-3.5 animate-spin" />
                              : <Send className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(student)}
                          className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-300 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* ── Booking & spending stats (clients) ── */}
                    {(student.bookingCount > 0) && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-violet-50 rounded-xl px-3 py-2.5 text-center">
                          <p className="text-lg font-bold text-violet-700">{student.bookingCount}</p>
                          <p className="text-xs text-violet-500">reservas</p>
                        </div>
                        <div className="bg-violet-50 rounded-xl px-3 py-2.5 text-center">
                          <p className="text-lg font-bold text-violet-700">€{student.bookingTotal.toFixed(0)}</p>
                          <p className="text-xs text-violet-500">gastado</p>
                        </div>
                      </div>
                    )}

                    {/* ── Toggles ── */}
                    <div className="space-y-2 mb-4">
                      {/* Course access */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${student.course_access ? "bg-teal-50 border border-teal-100" : "bg-gray-50"}`}>
                        <div className="flex items-center gap-2">
                          {student.course_access ? <Unlock className="w-3.5 h-3.5 text-teal-500" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
                          <div>
                            <span className="text-xs font-medium text-gray-700">Acceso al curso</span>
                            <p className="text-xs text-gray-400 leading-none">{student.course_access ? "Habilitado" : "Sin acceso"}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={student.course_access} disabled={togglingId === student.id + "course_access"} onChange={e => handleToggleField(student, "course_access", e.target.checked)} className="sr-only peer" />
                          <div className={`w-9 h-5 rounded-full transition-colors ${student.course_access ? "bg-teal-500" : "bg-gray-300"} relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${student.course_access ? "after:translate-x-4" : ""}`}></div>
                        </label>
                      </div>

                      {/* Admin */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${isAdmin ? "bg-rose-50" : "bg-gray-50"}`}>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-3.5 h-3.5 ${isAdmin ? "text-rose-500" : "text-gray-400"}`} />
                          <span className="text-xs font-medium text-gray-700">Administrador</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={isAdmin} disabled={togglingId === student.id + "role"} onChange={e => handleToggleField(student, "role", e.target.checked ? "admin" : "student")} className="sr-only peer" />
                          <div className={`w-9 h-5 rounded-full transition-colors ${isAdmin ? "bg-rose-500" : "bg-gray-300"} relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${isAdmin ? "after:translate-x-4" : ""}`}></div>
                        </label>
                      </div>

                      {/* Course completed */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${student.course_completed ? "bg-emerald-50" : "bg-gray-50"}`}>
                        <div className="flex items-center gap-2">
                          <BookOpen className={`w-3.5 h-3.5 ${student.course_completed ? "text-emerald-500" : "text-gray-400"}`} />
                          <span className="text-xs font-medium text-gray-700">Curso completado</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={student.course_completed} disabled={togglingId === student.id + "course_completed"} onChange={e => handleToggleField(student, "course_completed", e.target.checked)} className="sr-only peer" />
                          <div className={`w-9 h-5 rounded-full transition-colors ${student.course_completed ? "bg-emerald-500" : "bg-gray-300"} relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${student.course_completed ? "after:translate-x-4" : ""}`}></div>
                        </label>
                      </div>

                      {/* Professional */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${student.is_professional ? "bg-amber-50" : "bg-gray-50"} ${!student.course_completed ? "opacity-40" : ""}`}>
                        <div className="flex items-center gap-2">
                          <Star className={`w-3.5 h-3.5 ${student.is_professional ? "text-amber-500" : "text-gray-400"}`} />
                          <div>
                            <span className="text-xs font-medium text-gray-700">Profesional en agenda</span>
                            {!student.course_completed && <p className="text-xs text-gray-400 leading-none">Requiere curso completado</p>}
                          </div>
                        </div>
                        <label className={`relative inline-flex items-center ${student.course_completed ? "cursor-pointer" : "cursor-not-allowed"}`}>
                          <input type="checkbox" checked={student.is_professional} disabled={!student.course_completed || togglingId === student.id + "is_professional"} onChange={e => handleToggleField(student, "is_professional", e.target.checked)} className="sr-only peer" />
                          <div className={`w-9 h-5 rounded-full transition-colors ${student.is_professional ? "bg-amber-400" : "bg-gray-300"} relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${student.is_professional ? "after:translate-x-4" : ""}`}></div>
                        </label>
                      </div>
                    </div>

                    {/* ── Course progress ── */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Progreso del curso</span>
                        <span className={`text-xs font-bold ${pct >= 100 ? "text-emerald-600" : pct > 0 ? "text-rose-600" : "text-gray-400"}`}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-rose-400 to-rose-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{student.completedLessons} de {totalLessons} lecciones</p>
                    </div>

                    {/* ── Progress action buttons ── */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button
                        onClick={() => setConfirmModal({ studentId: student.id, studentName: student.name ?? student.email ?? "este usuario", action: "reset" })}
                        disabled={student.completedLessons === 0 || !!progressActionId}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isResetting ? <Loader className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Reiniciar
                      </button>
                      <button
                        onClick={() => setConfirmModal({ studentId: student.id, studentName: student.name ?? student.email ?? "este usuario", action: "complete" })}
                        disabled={pct >= 100 || !!progressActionId}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isCompleting ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Completar
                      </button>
                    </div>

                    {/* ── Purchases ── */}
                    {student.purchases.length > 0 ? (
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <ShoppingBag className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Compras ({student.purchases.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {student.purchases.map(purchase => (
                            <div key={purchase.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                              <p className="text-xs font-medium text-gray-700 truncate max-w-[140px]">
                                {purchase.product_id === "prod_UG5ehG9IrGh4hl" ? "Curso Online Completo" : purchase.product_id.replace("prod_", "Prod. ")}
                              </p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${purchase.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                {formatAmount(purchase.amount_total, purchase.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-50 rounded-lg">
                        <ShoppingBag className="w-3 h-3 text-gray-300" />
                        <span className="text-xs text-gray-400">Sin compras registradas</span>
                      </div>
                    )}

                    {/* ── Footer ── */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{student.created_at ? new Date(student.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(student.last_sign_in_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
