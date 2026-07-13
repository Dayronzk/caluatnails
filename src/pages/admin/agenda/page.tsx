import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DBBooking } from "@/lib/types";
import { AdminSidebar } from "@/pages/admin/components/AdminSidebar";
import ProfessionalScheduleConfig from "./components/ProfessionalScheduleConfig";
import ProfessionalAvailability from "./components/ProfessionalAvailability";
import { useAuth } from "@/hooks/useAuth";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const NOTIFY_FN = `${SUPABASE_URL}/functions/v1/send-notification`;
const GCAL_SYNC_FN = `${SUPABASE_URL}/functions/v1/google-calendar-sync`;

type BookingWithServices = DBBooking & {
  booking_services: Array<{ service_name: string; price_at_booking: number }>;
  professional?: { display_name: string | null; name: string | null } | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-50 text-amber-600" },
  confirmed: { label: "Confirmada", color: "bg-teal-50 text-teal-600" },
  cancelled: { label: "Cancelada", color: "bg-red-50 text-red-500" },
  completed: { label: "Completada", color: "bg-gray-100 text-gray-500" },
};

// Origen de la reserva — mostrado como pill en cada tarjeta de la agenda
const SOURCE_BADGES: Record<string, { label: string; icon: string; className: string; title: string }> = {
  web:   { label: "Web",     icon: "ri-global-line",       className: "bg-emerald-50 text-emerald-700 border-emerald-200", title: "Reserva creada desde la web (caluatnails.com/reservar)" },
  bot:   { label: "Bot",     icon: "ri-robot-line",         className: "bg-indigo-50 text-indigo-700 border-indigo-200",     title: "Reserva creada por el bot de WhatsApp" },
  admin: { label: "Admin",   icon: "ri-user-settings-line", className: "bg-amber-50 text-amber-700 border-amber-200",        title: "Reserva creada manualmente desde el panel admin" },
};

type Tab = "bookings" | "config" | "blocked" | "pros";

export default function AdminAgendaPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<BookingWithServices[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [notifModal, setNotifModal] = useState<BookingWithServices | null>(null);
  const [notifChannels, setNotifChannels] = useState<string[]>([]);
  const [cancelConfirm, setCancelConfirm] = useState<BookingWithServices | null>(null);
  const [notifSending, setNotifSending] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        booking_services(service_name, price_at_booking),
        professional:professional_id(display_name:professional_settings!inner(display_name), name:profiles!inner(name))
      `)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });
    setBookings((data ?? []) as BookingWithServices[]);
    setLoading(false);
  };

  // Simpler load without complex join
  const loadBookings = async () => {
    setLoading(true);

    // Auto-complete confirmed bookings whose time has already passed
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    // Current time as HH:MM so we can compare with booking_time
    const currentTime = now.toTimeString().slice(0, 5);

    // 1. All confirmed bookings from previous days
    await supabase
      .from("bookings")
      .update({ status: "completed", updated_at: now.toISOString() })
      .eq("status", "confirmed")
      .lt("booking_date", todayStr);

    // 2. Today's confirmed bookings whose start time has already passed
    await supabase
      .from("bookings")
      .update({ status: "completed", updated_at: now.toISOString() })
      .eq("status", "confirmed")
      .eq("booking_date", todayStr)
      .lte("booking_time", currentTime);

    const { data: bookingsData } = await supabase
      .from("bookings")
      .select(`
        id, 
        user_id, 
        professional_id, 
        professional_name_snapshot,
        client_name, 
        client_email, 
        client_phone, 
        booking_date, 
        booking_time, 
        total_duration_minutes, 
        total_price, 
        deposit_amount, 
        deposit_paid,
        stripe_session_id,
        status,
        notes,
        google_event_id,
        booking_source,
        payment_method,
        created_at,
        updated_at,
        booking_services(service_name, price_at_booking, service_id, services:services(reward_points))
      `)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    if (!bookingsData) { setLoading(false); return; }

    // Get professional names
    const profIds = [...new Set(bookingsData.map(b => b.professional_id).filter(Boolean))];
    let profMap: Record<string, string> = {};
    if (profIds.length > 0) {
      const { data: profs } = await supabase
        .from("professional_settings")
        .select("profile_id, display_name")
        .in("profile_id", profIds);
      const { data: profProfiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", profIds);
      profIds.forEach(id => {
        const ps = profs?.find(p => p.profile_id === id);
        const pp = profProfiles?.find(p => p.id === id);
        profMap[id] = ps?.display_name || pp?.name || "Profesional";
      });
    }

    const enriched = bookingsData.map(b => ({
      ...b,
      // If the professional still exists use the live name; if not (e.g. deleted)
      // fall back to the name we captured at booking time.
      professional_name: b.professional_id
        ? (profMap[b.professional_id] || b.professional_name_snapshot || null)
        : (b.professional_name_snapshot ? `${b.professional_name_snapshot} (eliminada)` : null),
    }));
    setBookings(enriched as unknown as BookingWithServices[]);
    setLoading(false);
  };

  useEffect(() => { loadBookings(); }, []);

  const filtered = bookings.filter(b => filterStatus === "all" || b.status === filterStatus);

  const upcoming = filtered.filter(b => {
    const d = new Date(b.booking_date + "T12:00:00");
    return d >= new Date(new Date().setHours(0, 0, 0, 0)) && b.status !== "cancelled";
  });

  const past = filtered.filter(b => {
    const d = new Date(b.booking_date + "T12:00:00");
    return d < new Date(new Date().setHours(0, 0, 0, 0)) || b.status === "cancelled";
  });

  const handleCancel = async (booking: BookingWithServices) => {
    try {
      let groupBookings = [booking];
      if (booking.stripe_session_id) {
        const { data: siblings } = await supabase
          .from("bookings")
          .select(`
            id, 
            user_id, 
            professional_id, 
            client_name, 
            client_email, 
            client_phone, 
            booking_date, 
            booking_time, 
            total_duration_minutes, 
            total_price, 
            deposit_amount, 
            deposit_paid,
            google_event_id,
            stripe_session_id,
            booking_services(service_name)
          `)
          .eq("stripe_session_id", booking.stripe_session_id);
        if (siblings && siblings.length > 0) {
          groupBookings = siblings.map(s => ({
            ...s,
            booking_services: s.booking_services || [],
          })) as any;
        }
      }

      let query = supabase
        .from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() });

      if (booking.stripe_session_id) {
        query = query.eq("stripe_session_id", booking.stripe_session_id);
      } else {
        query = query.eq("id", booking.id);
      }

      await query;

      for (const b of groupBookings) {
        // 1. Delete from Google Calendar if synced
        if (b.google_event_id && b.professional_id) {
          fetch(GCAL_SYNC_FN, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              action: "delete",
              bookingId: b.id,
              googleEventId: b.google_event_id,
              professionalId: b.professional_id,
              clientName: b.client_name,
              clientEmail: b.client_email,
              bookingDate: b.booking_date,
              bookingTime: b.booking_time,
              durationMinutes: b.total_duration_minutes,
              services: b.booking_services.map(bs => bs.service_name),
            }),
          }).catch(err => console.error("Error deleting from Google Calendar:", err));
        }

        // 2. Send cancellation email (only if email exists)
        if (b.client_email && b.client_email.includes("@")) {
          const services = b.booking_services.map(bs => bs.service_name);
          await fetch(NOTIFY_FN, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              type: "booking_cancelled",
              channels: ["email"],
              clientName: b.client_name,
              clientEmail: b.client_email,
              clientPhone: b.client_phone,
              bookingDate: b.booking_date,
              bookingTime: b.booking_time,
              services,
              totalPrice: Number(b.total_price),
              depositAmount: Number(b.deposit_amount),
              depositPaid: b.deposit_paid,
            }),
          }).catch(err => console.error("Error sending cancellation email:", err));
        }

        // 3. WhatsApp Redirect
        const dateFormatted = new Date(b.booking_date + "T12:00:00")
          .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
        const msg = `Hola ${b.client_name} 👋\n\nTe informamos que tu cita para el día *${dateFormatted}* a las *${b.booking_time}* ha sido cancelada.\n\nSentimos las molestias. Si tienes alguna duda, por favor contáctanos.`;
        const phone = b.client_phone.replace(/\D/g, "");
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, "_blank");
      }

      setCancelConfirm(null);
      loadBookings();
    } catch (err) {
      console.error("Error cancelling booking:", err);
    }
  };

  const handleConfirm = async (booking: BookingWithServices) => {
    setConfirmingId(booking.id);
    try {
      await supabase
        .from("bookings")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", booking.id);

      // Sync to Google Calendar if professional has it connected
      if (booking.professional_id) {
        const { data: token } = await supabase
          .from("google_calendar_tokens")
          .select("id")
          .eq("profile_id", booking.professional_id)
          .maybeSingle();

        if (token) {
          const services = (booking.booking_services ?? []).map(bs => bs.service_name);
          await fetch(GCAL_SYNC_FN, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              bookingId: booking.id,
              professionalId: booking.professional_id,
              clientName: booking.client_name,
              clientEmail: booking.client_email,
              bookingDate: booking.booking_date,
              bookingTime: booking.booking_time,
              durationMinutes: booking.total_duration_minutes,
              services,
            }),
          }).catch(console.error);
        }
      }

      } finally {
      setConfirmingId(null);
    }
  };

  const handleComplete = async (booking: BookingWithServices) => {
    setConfirmingId(booking.id);
    try {
      // 1. Update Booking Status (the database trigger will automatically award points)
      await supabase
        .from("bookings")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", booking.id);

      loadBookings();
    } catch (err) {
      console.error("Error completing booking:", err);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleSendNotification = async () => {
    if (!notifModal || notifChannels.length === 0) return;
    setNotifSending(true);
    setNotifError("");

    try {
      const services = notifModal.booking_services.map(bs => bs.service_name);

      if (notifChannels.includes("whatsapp")) {
        const dateFormatted = new Date(notifModal.booking_date + "T12:00:00")
          .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
        const servicesList = services.join(", ");
        const remaining = (Number(notifModal.total_price) - Number(notifModal.deposit_amount)).toFixed(2);
        const msg = `Hola ${notifModal.client_name} 👋\n\nTe recordamos que tienes una cita programada:\n\n📅 *${dateFormatted}* a las *${notifModal.booking_time}*\n✂️ Servicios: ${servicesList}\n💰 Total: €${Number(notifModal.total_price).toFixed(2)}\n🧾 Resto a pagar en cita: €${remaining}\n\nTe esperamos. Si necesitas cancelar o cambiar la cita, contáctanos con antelación. ¡Hasta pronto!`;
        const phone = notifModal.client_phone.replace(/\D/g, "");
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, "_blank");
      }

      if (notifChannels.includes("email")) {
        const res = await fetch(NOTIFY_FN, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            channels: ["email"],
            clientName: notifModal.client_name,
            clientEmail: notifModal.client_email,
            clientPhone: notifModal.client_phone,
            bookingDate: notifModal.booking_date,
            bookingTime: notifModal.booking_time,
            services,
            totalPrice: Number(notifModal.total_price),
            depositAmount: Number(notifModal.deposit_amount),
            depositPaid: notifModal.deposit_paid,
          }),
        });
        const data = await res.json() as { success: boolean; error?: string };
        if (!data.success) throw new Error(data.error ?? "Error al enviar el email");
      }

      setNotifSuccess(true);
      setTimeout(() => {
        setNotifSuccess(false);
        setNotifModal(null);
        setNotifChannels([]);
        setNotifError("");
      }, 2500);
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : "Error al enviar la notificación");
    } finally {
      setNotifSending(false);
    }
  };

  const toggleChannel = (ch: string) => {
    setNotifChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  };

  const BookingCard = ({ booking }: { booking: BookingWithServices & { professional_name?: string | null } }) => {
    const status = STATUS_LABELS[booking.status] ?? STATUS_LABELS.pending;
    const isConfirming = confirmingId === booking.id;
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <span className="text-rose-600 font-semibold text-sm">
                  {booking.client_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{booking.client_name}</p>
                <p className="text-xs text-gray-400">{booking.client_email} · {booking.client_phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <i className="ri-calendar-line text-rose-400"></i>
                <span className="capitalize">{formatDate(booking.booking_date)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <i className="ri-time-line text-rose-400"></i>
                <span>{booking.booking_time}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <i className="ri-timer-line text-rose-400"></i>
                <span>{formatDuration(booking.total_duration_minutes)}</span>
              </div>
              {booking.professional_name && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <i className="ri-user-star-line text-rose-400"></i>
                  <span>{booking.professional_name}</span>
                </div>
              )}
              {booking.google_event_id && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <i className="ri-google-line text-sm"></i>
                  <span>En Google Calendar</span>
                </div>
              )}
              {booking.booking_source && SOURCE_BADGES[booking.booking_source] && (
                <div
                  title={SOURCE_BADGES[booking.booking_source].title}
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full border ${SOURCE_BADGES[booking.booking_source].className}`}
                >
                  <i className={`${SOURCE_BADGES[booking.booking_source].icon} text-sm`}></i>
                  <span>{SOURCE_BADGES[booking.booking_source].label}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {booking.booking_services.map((bs, i) => {
                const slug = bs.service_name.toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '');
                return (
                  <a 
                    key={i} 
                    href={`/servicios/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-rose-100 transition-all border border-rose-100/50"
                    title="Ver página SEO del servicio"
                  >
                    {bs.service_name}
                    <i className="ri-external-link-line text-[8px]"></i>
                  </a>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span>Total: <strong className="text-gray-800">€{Number(booking.total_price).toFixed(2)}</strong></span>
              {Number(booking.deposit_amount) >= Number(booking.total_price) * 0.9 ? (
                <span>Pago completo: <strong className={booking.deposit_paid ? "text-teal-600" : "text-amber-600"}>
                  €{Number(booking.deposit_amount).toFixed(2)} {booking.deposit_paid ? "✓" : "(pendiente)"}
                </strong></span>
              ) : Number(booking.deposit_amount) > 0 ? (
                <span>Anticipo: <strong className={booking.deposit_paid ? "text-teal-600" : "text-amber-600"}>
                  €{Number(booking.deposit_amount).toFixed(2)} {booking.deposit_paid ? "✓" : "(pendiente)"}
                </strong></span>
              ) : (
                <span className="text-gray-400">Pago presencial</span>
              )}
              {booking.booking_source === "admin" ? (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium border border-gray-200/40">
                  <i className="ri-user-settings-line"></i>
                  Presencial
                </span>
              ) : (
                booking.payment_method && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium border border-gray-200/40">
                    <i className={(booking.payment_method === "stripe" && booking.stripe_session_id) ? "ri-credit-card-line" : "ri-money-euro-circle-line"}></i>
                    {booking.payment_method === "stripe" && booking.stripe_session_id
                      ? "Tarjeta (Stripe)"
                      : booking.payment_method === "efectivo" || booking.payment_method === "efectivo_full"
                      ? "Efectivo"
                      : "Presencial"}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
            {booking.status !== "cancelled" && (
              <div className="flex gap-2">
                {booking.status === "pending" && (
                  <button
                    onClick={() => handleConfirm(booking)}
                    disabled={isConfirming}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-teal-50 hover:text-teal-500 hover:border-teal-200 transition-colors cursor-pointer disabled:opacity-50"
                    title="Confirmar reserva"
                  >
                    {isConfirming ? <i className="ri-loader-4-line animate-spin text-sm"></i> : <i className="ri-check-line text-sm"></i>}
                  </button>
                )}
                {booking.status === "confirmed" && (
                  <button
                    onClick={() => handleComplete(booking)}
                    disabled={isConfirming}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                    title="Marcar como Completada (Suma puntos)"
                  >
                    {isConfirming ? <i className="ri-loader-4-line animate-spin text-sm"></i> : <i className="ri-checkbox-circle-line text-sm"></i>}
                  </button>
                )}
                {booking.status !== "completed" && (
                  <button
                    onClick={() => { setNotifModal(booking); setNotifChannels([]); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors cursor-pointer"
                    title="Enviar notificación"
                  >
                    <i className="ri-notification-3-line text-sm"></i>
                  </button>
                )}
                <button
                  onClick={() => setCancelConfirm(booking)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                    booking.status === "completed"
                      ? "border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                      : "border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                  }`}
                  title={booking.status === "completed" ? "Cancelar cita completada (Resta puntos e ingresos)" : "Cancelar reserva"}
                >
                  <i className="ri-close-circle-line text-sm"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
              <p className="text-gray-500 text-sm mt-1">Gestiona reservas y tu horario profesional</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
            {[
              { key: "bookings" as Tab, label: "Reservas", icon: "ri-calendar-line" },
              { key: "pros" as Tab, label: "Profesionales!!!", icon: "ri-team-line" },
              { key: "blocked" as Tab, label: "Bloqueos", icon: "ri-forbid-line" },
              { key: "config" as Tab, label: "Mi horario", icon: "ri-settings-3-line" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  tab === t.key ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className={t.icon}></i>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "config" ? (
            <ProfessionalScheduleConfig />
          ) : tab === "blocked" ? (
            <AdminBlockedTimes />
          ) : tab === "pros" ? (
            <ProfessionalAvailability />
          ) : (
            <>
              {/* Filter + Stats */}
              <div className="flex gap-2 flex-wrap mb-6">
                {[
                  { value: "all", label: "Todas" },
                  { value: "pending", label: "Pendientes" },
                  { value: "confirmed", label: "Confirmadas" },
                  { value: "cancelled", label: "Canceladas" },
                  { value: "completed", label: "Completadas" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                      filterStatus === opt.value
                        ? "bg-rose-500 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-rose-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Próximas", value: bookings.filter(b => { const d = new Date(b.booking_date + "T12:00:00"); return d >= new Date(new Date().setHours(0,0,0,0)) && b.status !== "cancelled"; }).length, icon: "ri-calendar-line", color: "text-rose-500" },
                  { label: "Confirmadas", value: bookings.filter(b => b.status === "confirmed").length, icon: "ri-check-double-line", color: "text-teal-500" },
                  { label: "Pendientes pago", value: bookings.filter(b => !b.deposit_paid && (b.status === "pending" || b.status === "confirmed")).length, icon: "ri-money-euro-circle-line", color: "text-amber-500" },
                  { label: "Canceladas", value: bookings.filter(b => b.status === "cancelled").length, icon: "ri-close-circle-line", color: "text-red-400" },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <i className={`${s.icon} ${s.color}`}></i>
                      <span className="text-xs text-gray-400">{s.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {upcoming.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        Próximas citas ({upcoming.length})
                      </h2>
                      <div className="space-y-4">
                        {upcoming.map(b => <BookingCard key={b.id} booking={b as BookingWithServices & { professional_name?: string | null }} />)}
                      </div>
                    </div>
                  )}

                  {past.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                        Historial ({past.length})
                      </h2>
                      <div className="space-y-4 opacity-70">
                        {past.map(b => <BookingCard key={b.id} booking={b as BookingWithServices & { professional_name?: string | null }} />)}
                      </div>
                    </div>
                  )}

                  {filtered.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <i className="ri-calendar-line text-2xl text-gray-300"></i>
                      </div>
                      <p className="text-gray-400 text-sm">No hay reservas en esta categoría</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Notification Modal */}
      {notifModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Enviar notificación</h2>
              <button onClick={() => { setNotifModal(null); setNotifError(""); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>
            <div className="p-6">
              {notifSuccess ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
                    <i className="ri-check-line text-2xl text-teal-500"></i>
                  </div>
                  <p className="font-semibold text-gray-900">¡Notificación enviada!</p>
                  <p className="text-sm text-gray-500 mt-1">El cliente ha sido notificado correctamente</p>
                </div>
              ) : (
                <>
                  <div className="bg-rose-50 rounded-xl p-3 mb-5">
                    <p className="text-sm font-semibold text-rose-800">{notifModal.client_name}</p>
                    <p className="text-xs text-rose-600">{notifModal.client_email} · {notifModal.client_phone}</p>
                    <p className="text-xs text-rose-600 mt-1">
                      {new Date(notifModal.booking_date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })} a las {notifModal.booking_time}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Canales de envío:</p>
                  <div className="space-y-3 mb-6">
                    {[
                      { key: "whatsapp", icon: "ri-whatsapp-line", label: "WhatsApp", desc: `Abre WhatsApp Web → ${notifModal.client_phone}`, color: "text-teal-500" },
                      { key: "email", icon: "ri-mail-line", label: "Correo electrónico", desc: `Envío automático → ${notifModal.client_email}`, color: "text-rose-500" },
                    ].map(ch => (
                      <button
                        key={ch.key}
                        onClick={() => toggleChannel(ch.key)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                          notifChannels.includes(ch.key) ? "border-rose-400 bg-rose-50" : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 ${ch.color}`}>
                          <i className={`${ch.icon} text-base`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{ch.label}</p>
                          <p className="text-xs text-gray-400">{ch.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${notifChannels.includes(ch.key) ? "border-rose-500 bg-rose-500" : "border-gray-300"}`}>
                          {notifChannels.includes(ch.key) && <i className="ri-check-line text-white text-xs"></i>}
                        </div>
                      </button>
                    ))}
                  </div>
                  {notifError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-start gap-2">
                      <i className="ri-error-warning-line mt-0.5 flex-shrink-0"></i>
                      <span>{notifError}</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => { setNotifModal(null); setNotifError(""); }} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer">Cancelar</button>
                    <button
                      onClick={handleSendNotification}
                      disabled={notifChannels.length === 0 || notifSending}
                      className="flex-1 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {notifSending ? <><i className="ri-loader-4-line animate-spin"></i>Enviando...</> : "Enviar"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-calendar-close-line text-red-500 text-xl"></i>
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-2">¿Cancelar esta reserva?</h3>
            <p className="text-center text-sm text-gray-500 mb-2">
              <strong>{cancelConfirm.client_name}</strong> — {new Date(cancelConfirm.booking_date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })} a las {cancelConfirm.booking_time}
            </p>
            {cancelConfirm.status === "completed" ? (
              <p className="text-center text-xs text-red-500 font-semibold mb-6 bg-red-50 p-2.5 rounded-xl border border-red-100">
                ⚠️ ¡Atención! Se restarán los puntos acumulados de esta cita y su importe se eliminará de tus ingresos. Esta acción no se puede deshacer.
              </p>
            ) : (
              <p className="text-center text-xs text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setCancelConfirm(null)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer">No, volver</button>
              <button onClick={() => handleCancel(cancelConfirm)} className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold cursor-pointer transition-colors">Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADMIN BLOCKED TIMES
───────────────────────────────────────────── */
interface BlockedTime {
  id: string;
  profile_id: string;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

function AdminBlockedTimes() {
  const [blocks, setBlocks] = useState<BlockedTime[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ profile_id: "", blocked_date_from: "", blocked_date_to: "", start_time: "09:00", end_time: "13:00", reason: "", all_day: false });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const loadProfessionals = async () => {
      const { data: settings } = await supabase
        .from("professional_settings")
        .select("profile_id, display_name")
        .eq("is_active", true);
      const profIds = (settings ?? []).map(s => s.profile_id);
      if (profIds.length === 0) { setProfessionals([]); return; }
      const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", profIds);
      const list = (settings ?? []).map(s => {
        const p = profiles?.find(pr => pr.id === s.profile_id);
        return { id: s.profile_id, name: s.display_name || p?.name || "Profesional" };
      });
      setProfessionals(list);
      if (list.length > 0) setForm(prev => ({ ...prev, profile_id: list[0].id }));
    };
    loadProfessionals();
  }, []);

  const loadBlocks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("professional_blocked_times")
      .select("*")
      .gte("blocked_date", new Date().toISOString().slice(0, 10))
      .order("blocked_date", { ascending: true })
      .order("start_time", { ascending: true });
    setBlocks((data ?? []) as BlockedTime[]);
    setLoading(false);
  };

  useEffect(() => { loadBlocks(); }, []);

  const handleAdd = async () => {
    if (!form.profile_id || !form.blocked_date_from || !form.start_time || !form.end_time) return;
    if (!form.all_day && form.start_time >= form.end_time) return;

    const startTime = form.all_day ? "00:00" : form.start_time;
    const endTime = form.all_day ? "23:59" : form.end_time;
    const dateTo = form.blocked_date_to || form.blocked_date_from;

    // Generate one row per day in the range
    const rows: { profile_id: string; blocked_date: string; start_time: string; end_time: string; reason: string | null }[] = [];
    const d = new Date(form.blocked_date_from + "T12:00:00");
    const end = new Date(dateTo + "T12:00:00");
    while (d <= end) {
      rows.push({
        profile_id: form.profile_id,
        blocked_date: d.toISOString().slice(0, 10),
        start_time: startTime,
        end_time: endTime,
        reason: form.reason || null,
      });
      d.setDate(d.getDate() + 1);
    }

    if (rows.length === 0) return;
    setSaving(true);
    await supabase.from("professional_blocked_times").insert(rows);
    setForm(prev => ({ ...prev, blocked_date_from: "", blocked_date_to: "", start_time: "09:00", end_time: "13:00", reason: "", all_day: false }));
    setSaving(false);
    loadBlocks();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("professional_blocked_times").delete().eq("id", id);
    setDeleteConfirm(null);
    loadBlocks();
  };

  const profName = (id: string) => professionals.find(p => p.id === id)?.name ?? "Profesional";
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Add block form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500">
            <i className="ri-forbid-line text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Bloquear horario</h3>
            <p className="text-xs text-gray-400">Bloquea horas de un profesional para que los clientes no puedan reservar</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Profesional</label>
            <select
              value={form.profile_id}
              onChange={e => setForm(prev => ({ ...prev, profile_id: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm bg-white cursor-pointer"
            >
              {professionals.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha inicio</label>
              <input
                type="date"
                min={todayStr}
                value={form.blocked_date_from}
                onChange={e => setForm(prev => ({ ...prev, blocked_date_from: e.target.value, blocked_date_to: prev.blocked_date_to && prev.blocked_date_to < e.target.value ? e.target.value : prev.blocked_date_to }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha fin <span className="text-gray-400 font-normal">(opcional, para varios dias)</span></label>
              <input
                type="date"
                min={form.blocked_date_from || todayStr}
                value={form.blocked_date_to}
                onChange={e => setForm(prev => ({ ...prev, blocked_date_to: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
              />
            </div>
          </div>
          {form.blocked_date_from && form.blocked_date_to && form.blocked_date_to > form.blocked_date_from && (
            <p className="text-xs text-rose-500 font-medium">
              <i className="ri-calendar-line mr-1"></i>
              Se bloquearan {Math.round((new Date(form.blocked_date_to + "T12:00:00").getTime() - new Date(form.blocked_date_from + "T12:00:00").getTime()) / 86400000) + 1} dias
            </p>
          )}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.all_day}
                onChange={e => setForm(prev => ({ ...prev, all_day: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400 cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-600">Todo el dia</span>
            </label>
          </div>
          {!form.all_day && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Desde</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Hasta</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
              />
            </div>
          </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Motivo (opcional)</label>
            <input
              type="text"
              value={form.reason}
              onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Ej: Descanso, cita médica, formación..."
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
            />
          </div>
          {!form.all_day && form.start_time >= form.end_time && form.end_time !== "" && (
            <p className="text-xs text-red-500">La hora de inicio debe ser anterior a la hora de fin</p>
          )}
          <button
            onClick={handleAdd}
            disabled={saving || !form.profile_id || !form.blocked_date_from || (!form.all_day && (!form.start_time || !form.end_time || form.start_time >= form.end_time))}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <><i className="ri-loader-4-line animate-spin"></i>Guardando...</>
            ) : (
              <><i className="ri-add-line"></i>Bloquear horario</>
            )}
          </button>
        </div>
      </div>

      {/* Existing blocks */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <i className="ri-calendar-close-line text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Horarios bloqueados</h3>
            <p className="text-xs text-gray-400">Todos los bloqueos activos de los profesionales</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-gray-100 text-gray-300 mb-3">
              <i className="ri-calendar-check-line text-xl"></i>
            </div>
            <p className="text-sm text-gray-400">No hay horarios bloqueados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map(block => {
              const dateFormatted = new Date(block.blocked_date + "T12:00:00")
                .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
              return (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 text-red-500">
                      <i className="ri-forbid-line text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        <span className="text-rose-600 font-semibold">{profName(block.profile_id)}</span>
                        <span className="mx-1.5 text-gray-300">·</span>
                        <span className="capitalize">{dateFormatted}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {block.start_time} - {block.end_time}
                        {block.reason && <span className="ml-2 text-gray-400">· {block.reason}</span>}
                      </p>
                    </div>
                  </div>
                  {deleteConfirm === block.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(block.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium cursor-pointer hover:bg-red-600 transition-colors"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(block.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-sm"></i>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
