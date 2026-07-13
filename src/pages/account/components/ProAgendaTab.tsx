import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import MonthlyCalendarView from "./MonthlyCalendarView";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const NOTIFY_FN = `${SUPABASE_URL}/functions/v1/send-notification`;
const GCAL_SYNC_FN = `${SUPABASE_URL}/functions/v1/google-calendar-sync`;
const RESEND_EMAIL_FN = `${SUPABASE_URL}/functions/v1/resend-email`;

const DAYS = [
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

interface DaySchedule {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

interface ProfessionalInfo {
  display_name: string;
  bio: string;
  slot_duration_minutes: number;
  buffer_minutes: number;
  is_active: boolean;
}

interface BookingService {
  service_name: string;
  price_at_booking: number;
}

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  booking_date: string;
  booking_time: string;
  total_duration_minutes: number;
  total_price: number;
  deposit_amount: number;
  deposit_paid: boolean;
  status: string;
  google_event_id?: string | null;
  booking_services: BookingService[];
  stripe_session_id?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-50 text-amber-600" },
  confirmed: { label: "Confirmada", color: "bg-teal-50 text-teal-600" },
  cancelled: { label: "Cancelada", color: "bg-red-50 text-red-500" },
  completed: { label: "Completada", color: "bg-gray-100 text-gray-500" },
};

type AgendaSubTab = "bookings" | "schedule" | "blocked" | "gcal";

export default function ProAgendaTab() {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<AgendaSubTab>("bookings");

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 text-white flex items-center gap-4">
        <div className="w-14 h-14 flex items-center justify-center bg-white/20 rounded-xl shrink-0">
          <i className="ri-calendar-schedule-line text-2xl"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold">Mi Agenda Profesional</h2>
          <p className="text-sm opacity-90">Gestiona tus reservas, horarios y sincronización con Google Calendar</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {[
          { key: "bookings" as AgendaSubTab, label: "Mis reservas", icon: "ri-calendar-line" },
          { key: "schedule" as AgendaSubTab, label: "Mi horario", icon: "ri-time-line" },
          { key: "blocked" as AgendaSubTab, label: "Bloqueos", icon: "ri-forbid-line" },
          { key: "gcal" as AgendaSubTab, label: "Google Calendar", icon: "ri-google-line" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              subTab === t.key ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className={t.icon}></i>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "bookings" && <ProBookingsView />}
      {subTab === "schedule" && <ProScheduleConfig />}
      {subTab === "blocked" && <ProBlockedTimes />}
      {subTab === "gcal" && <ProGoogleCalendar />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   BOOKINGS VIEW
───────────────────────────────────────────── */
function ProBookingsView() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [notifModal, setNotifModal] = useState<Booking | null>(null);
  const [notifChannels, setNotifChannels] = useState<string[]>([]);
  const [cancelConfirm, setCancelConfirm] = useState<Booking | null>(null);
  const [notifSending, setNotifSending] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [calendarDropdown, setCalendarDropdown] = useState(false);

  const loadBookings = async () => {
    if (!user) return;
    setLoading(true);

    // Auto-complete past confirmed bookings
    const todayStr = new Date().toISOString().slice(0, 10);
    await supabase
      .from("bookings")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("status", "confirmed")
      .eq("professional_id", user.id)
      .lt("booking_date", todayStr);

    const { data } = await supabase
      .from("bookings")
      .select("*, booking_services(service_name, price_at_booking)")
      .eq("professional_id", user.id)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });
    setBookings((data ?? []) as Booking[]);
    setLoading(false);
  };

  useEffect(() => { loadBookings(); }, [user]);

  const filtered = bookings.filter(b => filterStatus === "all" || b.status === filterStatus);

  const upcoming = filtered.filter(b => {
    const d = new Date(b.booking_date + "T12:00:00");
    return d >= new Date(new Date().setHours(0, 0, 0, 0)) && b.status !== "cancelled";
  });

  const past = filtered.filter(b => {
    const d = new Date(b.booking_date + "T12:00:00");
    return d < new Date(new Date().setHours(0, 0, 0, 0)) || b.status === "cancelled";
  });

  const handleConfirm = async (booking: Booking) => {
    setConfirmingId(booking.id);
    try {
      await supabase
        .from("bookings")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", booking.id);

      // Load professional profile data for the confirmation email
      const [{ data: proProfile }, { data: proUser }] = await Promise.all([
        supabase
          .from("professional_profiles")
          .select("address, instagram")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("name")
          .eq("id", user!.id)
          .maybeSingle(),
      ]);

      // Send confirmation email to client with professional info
      const services = (booking.booking_services ?? []).map(bs => bs.service_name);
      await fetch(RESEND_EMAIL_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "booking_confirmation",
          to: { email: booking.client_email, name: booking.client_name },
          data: {
            clientName: booking.client_name,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            services,
            totalPrice: Number(booking.total_price),
            depositAmount: Number(booking.deposit_amount),
            professionalName: proUser?.name ?? "",
            professionalAddress: proProfile?.address ?? "",
            professionalInstagram: proProfile?.instagram ?? "",
          },
        }),
      }).catch(console.error);

      // Sync to Google Calendar if connected
      const { data: token } = await supabase
        .from("google_calendar_tokens")
        .select("id")
        .eq("profile_id", user!.id)
        .maybeSingle();

      if (token) {
        await fetch(GCAL_SYNC_FN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            professionalId: user!.id,
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            durationMinutes: booking.total_duration_minutes,
            services,
          }),
        }).catch(console.error);
      }

      loadBookings();
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCancel = async (booking: Booking) => {
    let query = supabase
      .from("bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() });

    if (booking.stripe_session_id) {
      query = query.eq("stripe_session_id", booking.stripe_session_id);
    } else {
      query = query.eq("id", booking.id);
    }

    await query;
    setCancelConfirm(null);
    loadBookings();
  };

  const toggleChannel = (ch: string) => {
    setNotifChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const buildCalendarLinks = (booking: Booking) => {
    const services = booking.booking_services.map(bs => bs.service_name).join(", ");
    const title = encodeURIComponent(`Cita: ${services}`);
    const description = encodeURIComponent(
      `Cliente: ${booking.client_name}\nServicios: ${services}\nTotal: €${Number(booking.total_price).toFixed(2)}`
    );

    // Parse date + time
    const [year, month, day] = booking.booking_date.split("-").map(Number);
    const [hour, minute] = booking.booking_time.split(":").map(Number);
    const startDate = new Date(year, month - 1, day, hour, minute);
    const endDate = new Date(startDate.getTime() + booking.total_duration_minutes * 60000);

    const pad = (n: number) => String(n).padStart(2, "0");
    const toGCalDate = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const toICalDate = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const gcalStart = toGCalDate(startDate);
    const gcalEnd = toGCalDate(endDate);
    const icalStart = toICalDate(startDate);
    const icalEnd = toICalDate(endDate);

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${gcalStart}/${gcalEnd}&details=${description}`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nailox//Agenda//ES",
      "BEGIN:VEVENT",
      `DTSTART:${icalStart}`,
      `DTEND:${icalEnd}`,
      `SUMMARY:${decodeURIComponent(title)}`,
      `DESCRIPTION:${decodeURIComponent(description).replace(/\n/g, "\\n")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const icsBlob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const icsUrl = URL.createObjectURL(icsBlob);

    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${description}`;

    return { googleUrl, icsUrl, outlookUrl };
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
        const remaining = (Number(notifModal.total_price) - Number(notifModal.deposit_amount)).toFixed(2);
        const msg = `Hola ${notifModal.client_name} 👋\n\nTe recordamos que tienes una cita programada:\n\n📅 *${dateFormatted}* a las *${notifModal.booking_time}*\n✂️ Servicios: ${services.join(", ")}\n💰 Total: €${Number(notifModal.total_price).toFixed(2)}\n🧾 Resto a pagar en cita: €${remaining}\n\nTe esperamos. Si necesitas cancelar o cambiar la cita, contáctanos con antelación. ¡Hasta pronto!`;
        const phone = notifModal.client_phone.replace(/\D/g, "");
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      }

      if (notifChannels.includes("email")) {
        const res = await fetch(RESEND_EMAIL_FN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "booking_confirmation",
            to: { email: notifModal.client_email, name: notifModal.client_name },
            data: {
              clientName: notifModal.client_name,
              bookingDate: notifModal.booking_date,
              bookingTime: notifModal.booking_time,
              services,
              totalPrice: Number(notifModal.total_price),
              depositAmount: Number(notifModal.deposit_amount),
            },
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Próximas", value: bookings.filter(b => { const d = new Date(b.booking_date + "T12:00:00"); return d >= new Date(new Date().setHours(0,0,0,0)) && b.status !== "cancelled"; }).length, icon: "ri-calendar-line", color: "text-teal-500" },
          { label: "Confirmadas", value: bookings.filter(b => b.status === "confirmed").length, icon: "ri-check-double-line", color: "text-emerald-500" },
          { label: "Pendientes", value: bookings.filter(b => b.status === "pending").length, icon: "ri-time-line", color: "text-amber-500" },
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

      {/* Toolbar: filters + view toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
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
                  ? "bg-teal-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-teal-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              viewMode === "list" ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className="ri-list-check text-sm"></i>
            Lista
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              viewMode === "calendar" ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className="ri-calendar-2-line text-sm"></i>
            Calendario
          </button>
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === "calendar" && !loading && (
        <MonthlyCalendarView bookings={filtered} />
      )}

      {/* List view */}
      {viewMode === "list" && (
        loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Próximas citas ({upcoming.length})
                </h2>
                <div className="space-y-4">
                  {upcoming.map(b => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      confirmingId={confirmingId}
                      onConfirm={handleConfirm}
                      onCancel={setCancelConfirm}
                      onNotify={(bk) => { setNotifModal(bk); setNotifChannels([]); }}
                      formatDate={formatDate}
                      formatDuration={formatDuration}
                    />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Historial ({past.length})
                </h2>
                <div className="space-y-4 opacity-70">
                  {past.map(b => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      confirmingId={confirmingId}
                      onConfirm={handleConfirm}
                      onCancel={setCancelConfirm}
                      onNotify={(bk) => { setNotifModal(bk); setNotifChannels([]); }}
                      formatDate={formatDate}
                      formatDuration={formatDuration}
                    />
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-calendar-line text-2xl text-gray-300"></i>
                </div>
                <p className="text-gray-400 text-sm">No tienes reservas en esta categoría</p>
                <p className="text-xs text-gray-300 mt-1">Las reservas de tus clientes aparecerán aquí</p>
              </div>
            )}
          </>
        )
      )}

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
                  <div className="bg-teal-50 rounded-xl p-3 mb-5">
                    <p className="text-sm font-semibold text-teal-800">{notifModal.client_name}</p>
                    <p className="text-xs text-teal-600">{notifModal.client_email}</p>
                    <p className="text-xs text-teal-600 mt-1">
                      {new Date(notifModal.booking_date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })} a las {notifModal.booking_time}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Canales de envío:</p>
                  <div className="space-y-3 mb-6">
                    {[
                      { key: "whatsapp", icon: "ri-whatsapp-line", label: "WhatsApp", desc: "Abre WhatsApp Web", color: "text-teal-500" },
                      { key: "email", icon: "ri-mail-line", label: "Correo electrónico", desc: `Envío automático → ${notifModal.client_email}`, color: "text-rose-500" },
                    ].map(ch => (
                      <button
                        key={ch.key}
                        onClick={() => toggleChannel(ch.key)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                          notifChannels.includes(ch.key) ? "border-teal-400 bg-teal-50" : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 ${ch.color}`}>
                          <i className={`${ch.icon} text-base`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{ch.label}</p>
                          <p className="text-xs text-gray-400">{ch.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${notifChannels.includes(ch.key) ? "border-teal-500 bg-teal-500" : "border-gray-300"}`}>
                          {notifChannels.includes(ch.key) && <i className="ri-check-line text-white text-xs"></i>}
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Add to calendar */}
                  <div className="mb-5">
                    <p className="text-sm font-medium text-gray-700 mb-3">Añadir al calendario del cliente:</p>
                    <div className="relative">
                      <button
                        onClick={() => setCalendarDropdown(prev => !prev)}
                        className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 border-gray-100 hover:border-teal-200 hover:bg-teal-50/40 transition-all cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                            <i className="ri-calendar-check-line text-base"></i>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">Añadir al calendario</p>
                            <p className="text-xs text-gray-400">Google, Apple, Outlook u otro</p>
                          </div>
                        </div>
                        {calendarDropdown
                          ? <i className="ri-arrow-up-s-line text-gray-400"></i>
                          : <i className="ri-arrow-down-s-line text-gray-400"></i>
                        }
                      </button>

                      {calendarDropdown && (() => {
                        const links = buildCalendarLinks(notifModal);
                        return (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl overflow-hidden z-10">
                            <a
                              href={links.googleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setCalendarDropdown(false)}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500">
                                <i className="ri-google-line text-sm"></i>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">Google Calendar</p>
                                <p className="text-xs text-gray-400">Abre en Google Calendar</p>
                              </div>
                              <i className="ri-external-link-line text-gray-300 ml-auto text-sm"></i>
                            </a>
                            <div className="border-t border-gray-50"></div>
                            <a
                              href={links.icsUrl}
                              download={`cita-${notifModal.booking_date}.ics`}
                              onClick={() => setCalendarDropdown(false)}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
                                <i className="ri-apple-line text-sm"></i>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">Apple Calendar</p>
                                <p className="text-xs text-gray-400">Descarga archivo .ics</p>
                              </div>
                              <i className="ri-download-line text-gray-300 ml-auto text-sm"></i>
                            </a>
                            <div className="border-t border-gray-50"></div>
                            <a
                              href={links.outlookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setCalendarDropdown(false)}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                <i className="ri-mail-line text-sm"></i>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">Outlook Calendar</p>
                                <p className="text-xs text-gray-400">Abre en Outlook Web</p>
                              </div>
                              <i className="ri-external-link-line text-gray-300 ml-auto text-sm"></i>
                            </a>
                            <div className="border-t border-gray-50"></div>
                            <a
                              href={links.icsUrl}
                              download={`cita-${notifModal.booking_date}.ics`}
                              onClick={() => setCalendarDropdown(false)}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-teal-50 text-teal-500">
                                <i className="ri-calendar-line text-sm"></i>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">Otro calendario</p>
                                <p className="text-xs text-gray-400">Descarga .ics (compatible con cualquier app)</p>
                              </div>
                              <i className="ri-download-line text-gray-300 ml-auto text-sm"></i>
                            </a>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {notifError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-start gap-2">
                      <i className="ri-error-warning-line mt-0.5 flex-shrink-0"></i>
                      <span>{notifError}</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => { setNotifModal(null); setNotifError(""); setCalendarDropdown(false); }} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer">Cancelar</button>
                    <button
                      onClick={handleSendNotification}
                      disabled={notifChannels.length === 0 || notifSending}
                      className="flex-1 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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
            <p className="text-center text-xs text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
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
   BOOKING CARD
───────────────────────────────────────────── */
interface BookingCardProps {
  booking: Booking;
  confirmingId: string | null;
  onConfirm: (b: Booking) => void;
  onCancel: (b: Booking) => void;
  onNotify: (b: Booking) => void;
  formatDate: (d: string) => string;
  formatDuration: (m: number) => string;
}

function BookingCard({ booking, confirmingId, onConfirm, onCancel, onNotify, formatDate, formatDuration }: BookingCardProps) {
  const status = STATUS_LABELS[booking.status] ?? STATUS_LABELS.pending;
  const isConfirming = confirmingId === booking.id;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <span className="text-teal-600 font-semibold text-sm">
                {booking.client_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{booking.client_name}</p>
              <p className="text-xs text-gray-400">{booking.client_email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <i className="ri-calendar-line text-teal-400"></i>
              <span className="capitalize">{formatDate(booking.booking_date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <i className="ri-time-line text-teal-400"></i>
              <span>{booking.booking_time}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <i className="ri-timer-line text-teal-400"></i>
              <span>{formatDuration(booking.total_duration_minutes)}</span>
            </div>
            {booking.google_event_id && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <i className="ri-google-line text-sm"></i>
                <span>En Google Calendar</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {booking.booking_services.map((bs, i) => (
              <span key={i} className="text-xs bg-teal-50 text-teal-600 px-2.5 py-1 rounded-full">
                {bs.service_name}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
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
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
          {booking.status !== "cancelled" && booking.status !== "completed" && (
            <div className="flex gap-2">
              {booking.status === "pending" && (
                <button
                  onClick={() => onConfirm(booking)}
                  disabled={isConfirming}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-teal-50 hover:text-teal-500 hover:border-teal-200 transition-colors cursor-pointer disabled:opacity-50"
                  title="Confirmar reserva"
                >
                  {isConfirming
                    ? <i className="ri-loader-4-line animate-spin text-sm"></i>
                    : <i className="ri-check-line text-sm"></i>
                  }
                </button>
              )}
              <button
                onClick={() => onCancel(booking)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
                title="Cancelar reserva"
              >
                <i className="ri-close-circle-line text-sm"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCHEDULE CONFIG
───────────────────────────────────────────── */
function ProScheduleConfig() {
  const { user } = useAuth();
  const [info, setInfo] = useState<ProfessionalInfo>({
    display_name: "",
    bio: "",
    slot_duration_minutes: 30,
    buffer_minutes: 10,
    is_active: true,
  });
  const [schedules, setSchedules] = useState<DaySchedule[]>(
    DAYS.map(d => ({ day_of_week: d.value, is_working: d.value >= 1 && d.value <= 6, start_time: "09:00", end_time: "19:00", break_start: null, break_end: null }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [settingsRes, schedulesRes] = await Promise.all([
        supabase.from("professional_settings").select("*").eq("profile_id", user.id).maybeSingle(),
        supabase.from("professional_schedules").select("*").eq("profile_id", user.id),
      ]);

      if (settingsRes.data) {
        setInfo({
          display_name: settingsRes.data.display_name ?? "",
          bio: settingsRes.data.bio ?? "",
          slot_duration_minutes: settingsRes.data.slot_duration_minutes ?? 30,
          buffer_minutes: settingsRes.data.buffer_minutes ?? 10,
          is_active: settingsRes.data.is_active ?? true,
        });
      }

      if (schedulesRes.data && schedulesRes.data.length > 0) {
        setSchedules(
          DAYS.map(d => {
            const found = schedulesRes.data.find((s: DaySchedule) => s.day_of_week === d.value);
            return found
              ? { day_of_week: d.value, is_working: found.is_working, start_time: found.start_time?.slice(0, 5) ?? "09:00", end_time: found.end_time?.slice(0, 5) ?? "19:00", break_start: found.break_start?.slice(0, 5) ?? null, break_end: found.break_end?.slice(0, 5) ?? null }
              : { day_of_week: d.value, is_working: d.value >= 1 && d.value <= 6, start_time: "09:00", end_time: "19:00", break_start: null, break_end: null };
          })
        );
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("professional_settings").upsert({
        profile_id: user.id,
        display_name: info.display_name,
        bio: info.bio,
        slot_duration_minutes: info.slot_duration_minutes,
        buffer_minutes: info.buffer_minutes,
        is_active: info.is_active,
        updated_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });

      for (const sched of schedules) {
        await supabase.from("professional_schedules").upsert({
          profile_id: user.id,
          day_of_week: sched.day_of_week,
          is_working: sched.is_working,
          start_time: sched.start_time,
          end_time: sched.end_time,
          break_start: sched.break_start || null,
          break_end: sched.break_end || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "profile_id,day_of_week" });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const updateSchedule = (dayValue: number, field: keyof DaySchedule, value: boolean | string | null) => {
    setSchedules(prev => prev.map(s => s.day_of_week === dayValue ? { ...s, [field]: value === "" ? null : value } : s));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-500">
            <i className="ri-user-settings-line text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Perfil en la agenda</h3>
            <p className="text-xs text-gray-400">Así te verán los clientes al reservar</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre visible para clientes</label>
            <input
              type="text"
              value={info.display_name}
              onChange={e => setInfo(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="Ej: María García"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción breve</label>
            <textarea
              value={info.bio}
              onChange={e => setInfo(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Especialista en manicura y nail art..."
              rows={2}
              maxLength={300}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all resize-none"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-800">Disponible para reservas</p>
              <p className="text-xs text-gray-400">Los clientes pueden reservar contigo</p>
            </div>
            <button
              onClick={() => setInfo(prev => ({ ...prev, is_active: !prev.is_active }))}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${info.is_active ? "bg-teal-500" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${info.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Timing */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <i className="ri-timer-line text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Tiempos de cita</h3>
            <p className="text-xs text-gray-400">Duración de slots y margen entre citas</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Duración del slot (min)</label>
            <select
              value={info.slot_duration_minutes}
              onChange={e => setInfo(prev => ({ ...prev, slot_duration_minutes: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 outline-none text-sm bg-white cursor-pointer"
            >
              {[15, 20, 30, 45, 60].map(v => (
                <option key={v} value={v}>{v} min</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Margen entre citas (min)</label>
            <select
              value={info.buffer_minutes}
              onChange={e => setInfo(prev => ({ ...prev, buffer_minutes: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 outline-none text-sm bg-white cursor-pointer"
            >
              {[0, 5, 10, 15, 20, 30].map(v => (
                <option key={v} value={v}>{v === 0 ? "Sin margen" : `${v} min`}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          El margen se añade automáticamente después de cada cita para preparación y limpieza.
        </p>
      </div>

      {/* Weekly schedule */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
            <i className="ri-calendar-schedule-line text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Horario laboral semanal</h3>
            <p className="text-xs text-gray-400">Define qué días y horas trabajas</p>
          </div>
        </div>
        <div className="space-y-3">
          {DAYS.map(day => {
            const sched = schedules.find(s => s.day_of_week === day.value)!;
            return (
              <div
                key={day.value}
                className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${sched.is_working ? "border-teal-100 bg-teal-50/30" : "border-gray-100 bg-gray-50/50"}`}
              >
                <button
                  onClick={() => updateSchedule(day.value, "is_working", !sched.is_working)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${sched.is_working ? "bg-teal-500" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${sched.is_working ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className={`text-sm font-medium w-20 flex-shrink-0 ${sched.is_working ? "text-gray-800" : "text-gray-400"}`}>
                  {day.label}
                </span>
                {sched.is_working ? (
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={sched.start_time}
                        onChange={e => updateSchedule(day.value, "start_time", e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-teal-400 outline-none bg-white"
                      />
                      <span className="text-gray-400 text-xs">hasta</span>
                      <input
                        type="time"
                        value={sched.end_time}
                        onChange={e => updateSchedule(day.value, "end_time", e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-teal-400 outline-none bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (sched.break_start) {
                            updateSchedule(day.value, "break_start", "");
                            updateSchedule(day.value, "break_end", "");
                          } else {
                            updateSchedule(day.value, "break_start", "13:00");
                            updateSchedule(day.value, "break_end", "14:00");
                          }
                        }}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${sched.break_start ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                      >
                        {sched.break_start ? "✕ Quitar pausa" : "+ Añadir pausa"}
                      </button>
                      {sched.break_start && (
                        <>
                          <input
                            type="time"
                            value={sched.break_start}
                            onChange={e => updateSchedule(day.value, "break_start", e.target.value)}
                            className="px-2 py-1 rounded-lg border border-amber-200 text-xs focus:border-amber-400 outline-none bg-amber-50 w-[90px]"
                          />
                          <span className="text-gray-400 text-[10px]">a</span>
                          <input
                            type="time"
                            value={sched.break_end ?? ""}
                            onChange={e => updateSchedule(day.value, "break_end", e.target.value)}
                            className="px-2 py-1 rounded-lg border border-amber-200 text-xs focus:border-amber-400 outline-none bg-amber-50 w-[90px]"
                          />
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">No disponible</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          {saving ? (
            <><i className="ri-loader-4-line animate-spin"></i>Guardando...</>
          ) : saved ? (
            <><i className="ri-check-line"></i>¡Guardado!</>
          ) : (
            <><i className="ri-save-line"></i>Guardar configuración</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BLOCKED TIMES
───────────────────────────────────────────── */
interface BlockedTime {
  id: string;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

function ProBlockedTimes() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ blocked_date: "", start_time: "09:00", end_time: "13:00", reason: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadBlocks = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("professional_blocked_times")
      .select("*")
      .eq("profile_id", user.id)
      .gte("blocked_date", new Date().toISOString().slice(0, 10))
      .order("blocked_date", { ascending: true })
      .order("start_time", { ascending: true });
    setBlocks((data ?? []) as BlockedTime[]);
    setLoading(false);
  };

  useEffect(() => { loadBlocks(); }, [user]);

  const handleAdd = async () => {
    if (!user || !form.blocked_date || !form.start_time || !form.end_time) return;
    if (form.start_time >= form.end_time) return;
    setSaving(true);
    await supabase.from("professional_blocked_times").insert({
      profile_id: user.id,
      blocked_date: form.blocked_date,
      start_time: form.start_time,
      end_time: form.end_time,
      reason: form.reason || null,
    });
    setForm({ blocked_date: "", start_time: "09:00", end_time: "13:00", reason: "" });
    setSaving(false);
    loadBlocks();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("professional_blocked_times").delete().eq("id", id);
    setDeleteConfirm(null);
    loadBlocks();
  };

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
            <p className="text-xs text-gray-400">Bloquea horas en un día específico para que los clientes no puedan reservar</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha</label>
              <input
                type="date"
                min={todayStr}
                value={form.blocked_date}
                onChange={e => setForm(prev => ({ ...prev, blocked_date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Desde</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Hasta</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Motivo (opcional)</label>
            <input
              type="text"
              value={form.reason}
              onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Ej: Descanso, cita médica, formación..."
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all"
            />
          </div>
          {form.start_time >= form.end_time && form.end_time !== "" && (
            <p className="text-xs text-red-500">La hora de inicio debe ser anterior a la hora de fin</p>
          )}
          <button
            onClick={handleAdd}
            disabled={saving || !form.blocked_date || !form.start_time || !form.end_time || form.start_time >= form.end_time}
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
            <p className="text-xs text-gray-400">Tus próximos bloqueos activos</p>
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
            <p className="text-sm text-gray-400">No tienes horarios bloqueados</p>
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
                      <p className="text-sm font-medium text-gray-800 capitalize">{dateFormatted}</p>
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

/* ─────────────────────────────────────────────
   GOOGLE CALENDAR
───────────────────────────────────────────── */
function ProGoogleCalendar() {
  const { user } = useAuth();
  const [gcalConnected, setGcalConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gcalLoading, setGcalLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from("google_calendar_tokens")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      setGcalConnected(!!data);
      setLoading(false);
    };
    check();
  }, [user]);

  const handleConnect = async () => {
    if (!user) return;
    setGcalLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth?action=authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: user.id }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        const popup = window.open(data.url, "google-oauth", "width=600,height=700,left=200,top=100");
        const timer = setInterval(() => {
          if (popup?.closed) {
            clearInterval(timer);
            setGcalLoading(false);
            // Re-check connection
            supabase.from("google_calendar_tokens").select("id").eq("profile_id", user.id).maybeSingle()
              .then(({ data: token }) => setGcalConnected(!!token));
          }
        }, 500);
      } else {
        setGcalLoading(false);
      }
    } catch {
      setGcalLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    await supabase.from("google_calendar_tokens").delete().eq("profile_id", user.id);
    await supabase.from("professional_settings").update({ google_calendar_connected: false }).eq("profile_id", user.id);
    setGcalConnected(false);
  };

  if (loading) {
    return <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
            <i className="ri-google-line text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Google Calendar</h3>
            <p className="text-xs text-gray-400">Sincroniza tus citas automáticamente</p>
          </div>
        </div>

        {gcalConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <i className="ri-check-line text-sm"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">Google Calendar conectado</p>
                <p className="text-xs text-emerald-600">Las nuevas citas se añadirán automáticamente a tu calendario</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-600">¿Qué ocurre con cada cita?</p>
              <div className="space-y-1.5">
                {[
                  "Al confirmar una reserva → se crea el evento en tu Google Calendar",
                  "El evento incluye nombre del cliente, servicios y duración",
                  "Recibirás notificaciones de Google Calendar 30 min antes",
                  "Puedes ver y gestionar tus citas desde Google Calendar directamente",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <i className="ri-check-line text-emerald-500 text-xs mt-0.5 flex-shrink-0"></i>
                    <p className="text-xs text-gray-500">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
            >
              Desconectar Google Calendar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-600">Al conectar Google Calendar podrás:</p>
              <div className="space-y-1.5">
                {[
                  "Ver todas tus citas directamente en Google Calendar",
                  "Recibir notificaciones automáticas antes de cada cita",
                  "Sincronización automática al confirmar reservas",
                  "Gestionar tu disponibilidad desde cualquier dispositivo",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <i className="ri-calendar-check-line text-teal-400 text-xs mt-0.5 flex-shrink-0"></i>
                    <p className="text-xs text-gray-500">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={gcalLoading}
              className="w-full py-3 rounded-xl border-2 border-gray-200 hover:border-teal-200 text-sm font-semibold text-gray-700 hover:text-teal-600 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {gcalLoading ? (
                <><i className="ri-loader-4-line animate-spin"></i>Conectando...</>
              ) : (
                <><i className="ri-google-line text-base"></i>Conectar con Google Calendar</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-teal-50 rounded-2xl border border-teal-100 p-5">
        <div className="flex items-start gap-3">
          <i className="ri-information-line text-teal-500 text-lg mt-0.5 flex-shrink-0"></i>
          <div>
            <p className="text-sm font-semibold text-teal-800 mb-1">¿Cómo funciona la sincronización?</p>
            <p className="text-xs text-teal-700 leading-relaxed">
              Cuando el admin o tú misma confirméis una reserva, el sistema crea automáticamente un evento en tu Google Calendar con todos los detalles de la cita: cliente, servicios, hora y duración. No necesitas hacer nada manualmente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
