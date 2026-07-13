import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { GOOGLE_REVIEW_URL } from "@/lib/constants";

interface BookingService {
  service_id: string;
  service_name: string;
  price_at_booking: number;
  services?: {
    guarantee_window_days: number;
    guarantee_duration_minutes: number;
  } | null;
}

interface ClientBooking {
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
  notes: string | null;
  professional_id: string | null;
  booking_services: BookingService[];
  payment_method?: string | null;
  booking_source?: string | null;
  stripe_session_id?: string | null;
}

interface AvailableSlot {
  date: string;
  time: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-50 text-amber-600 border-amber-100", icon: "ri-time-line" },
  confirmed: { label: "Confirmada", color: "bg-teal-50 text-teal-600 border-teal-100", icon: "ri-check-double-line" },
  cancelled: { label: "Cancelada", color: "bg-red-50 text-red-500 border-red-100", icon: "ri-close-circle-line" },
  completed: { label: "Completada", color: "bg-gray-100 text-gray-500 border-gray-200", icon: "ri-checkbox-circle-line" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function isUpcoming(booking: ClientBooking) {
  const d = new Date(booking.booking_date + "T12:00:00");
  return d >= new Date(new Date().setHours(0, 0, 0, 0)) && booking.status !== "cancelled" && booking.status !== "completed";
}

function canModify(booking: ClientBooking) {
  // Can only modify if upcoming and at least 24h away
  const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
  const now = new Date();
  const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return isUpcoming(booking) && hoursUntil >= 24;
}

// ── Calendar helpers ──────────────────────────────────────────────────────
function buildCalendarLinks(booking: ClientBooking) {
  const services = booking.booking_services.map(s => s.service_name).join(", ");
  const title = `Cita: ${services}`;
  const description = `Servicios: ${services}\nTotal: €${Number(booking.total_price).toFixed(2)}`;

  const [year, month, day] = booking.booking_date.split("-").map(Number);
  const [hour, minute] = booking.booking_time.split(":").map(Number);
  const startDate = new Date(year, month - 1, day, hour, minute);
  const endDate = new Date(startDate.getTime() + booking.total_duration_minutes * 60000);

  const pad = (n: number) => String(n).padStart(2, "0");
  const toGCal = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const gcalStart = toGCal(startDate);
  const gcalEnd = toGCal(endDate);

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent(description)}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(description)}`;

  const icsContent = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nailox//Agenda//ES",
    "BEGIN:VEVENT",
    `DTSTART:${gcalStart}`, `DTEND:${gcalEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");

  const icsBlob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const icsUrl = URL.createObjectURL(icsBlob);

  return { googleUrl, outlookUrl, icsUrl };
}
// ─────────────────────────────────────────────────────────────────────────

export default function ClientBookingsTab({ clientPhone }: { clientPhone?: string }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Cancel modal
  const [cancelModal, setCancelModal] = useState<ClientBooking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  // Reschedule modal
  const [rescheduleModal, setRescheduleModal] = useState<ClientBooking | null>(null);
  const [rescheduleStep, setRescheduleStep] = useState<"pick" | "confirm" | "done">("pick");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Guarantee Modal state
  const [guaranteeModal, setGuaranteeModal] = useState<ClientBooking | null>(null);
  const [guaranteeStep, setGuaranteeStep] = useState<"pick" | "confirm" | "done">("pick");
  const [guaranteeDate, setGuaranteeDate] = useState("");
  const [guaranteeTime, setGuaranteeTime] = useState("");
  const [guaranteeReason, setGuaranteeReason] = useState("");
  const [guaranteeLoading, setGuaranteeLoading] = useState(false);

  const loadBookings = async () => {
    if (!user && !clientPhone) return;
    setLoading(true);

    const filters: string[] = [];

    if (user) {
      filters.push(`user_id.eq.${user.id}`);
      if (user.email) {
        filters.push(`client_email.eq.${user.email}`);
      }
    }

    if (clientPhone) {
      const cleanDigits = clientPhone.replace(/\D/g, "");
      if (cleanDigits.length >= 9) {
        filters.push(`client_phone.ilike.%${cleanDigits.slice(-9)}`);
      } else if (cleanDigits.length > 0) {
        filters.push(`client_phone.eq.${clientPhone}`);
      }
    }

    if (filters.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("bookings")
      .select(`
        *,
        booking_services(
          service_id,
          service_name,
          price_at_booking,
          services(
            guarantee_window_days,
            guarantee_duration_minutes
          )
        )
      `)
      .or(filters.join(","));

    const { data } = await query
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false });
    setBookings((data ?? []) as ClientBooking[]);
    setLoading(false);
  };

  useEffect(() => { loadBookings(); }, [user, clientPhone]);

  // Load available slots for a given date
  const loadSlotsForDate = async (date: string, booking: ClientBooking) => {
    if (!date || !booking.professional_id) return;
    setSlotsLoading(true);
    setRescheduleTime("");

    try {
      // Get professional schedule for that day of week
      const dow = new Date(date + "T12:00:00").getDay(); // 0=Sun
      const { data: sched } = await supabase
        .from("professional_schedules")
        .select("*")
        .eq("profile_id", booking.professional_id)
        .eq("day_of_week", dow)
        .maybeSingle();

      if (!sched || !sched.is_working) {
        setAvailableSlots([]);
        setSlotsLoading(false);
        return;
      }

      // Get professional settings for slot duration
      const { data: settings } = await supabase
        .from("professional_settings")
        .select("slot_duration_minutes, buffer_minutes")
        .eq("profile_id", booking.professional_id)
        .maybeSingle();

      const slotDuration = settings?.slot_duration_minutes ?? 30;
      const buffer = settings?.buffer_minutes ?? 10;

      // Get existing bookings for that date (excluding current booking)
      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("booking_time, total_duration_minutes")
        .eq("professional_id", booking.professional_id)
        .eq("booking_date", date)
        .neq("id", booking.id)
        .neq("status", "cancelled");

      // Generate slots
      const [startH, startM] = (sched.start_time ?? "09:00").split(":").map(Number);
      const [endH, endM] = (sched.end_time ?? "19:00").split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      const busyRanges = (existingBookings ?? []).map(b => {
        const [bH, bM] = b.booking_time.split(":").map(Number);
        const bStart = bH * 60 + bM;
        return { start: bStart, end: bStart + b.total_duration_minutes + buffer };
      });

      const slots: AvailableSlot[] = [];
      const nowDate = new Date();
      const isToday = date === nowDate.toISOString().split("T")[0];
      const nowMinutes = isToday ? nowDate.getHours() * 60 + nowDate.getMinutes() + 60 : 0;

      for (let t = startMinutes; t + booking.total_duration_minutes <= endMinutes; t += slotDuration) {
        if (isToday && t <= nowMinutes) continue;
        const slotEnd = t + booking.total_duration_minutes + buffer;
        const isBusy = busyRanges.some(r => t < r.end && slotEnd > r.start);
        if (!isBusy) {
          const h = Math.floor(t / 60);
          const m = t % 60;
          const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          slots.push({ date, time: timeStr });
        }
      }

      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
    }
    setSlotsLoading(false);
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal) return;
    setCancelLoading(true);

    let query = supabase
      .from("bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() });

    if (cancelModal.stripe_session_id) {
      query = query.eq("stripe_session_id", cancelModal.stripe_session_id);
    } else {
      query = query.eq("id", cancelModal.id);
    }

    const { error } = await query;

    setCancelLoading(false);

    if (error) {
      alert("Error al cancelar la cita: " + error.message);
      return;
    }

    setCancelDone(true);
    loadBookings(); // Refresh immediately

    setTimeout(() => {
      setCancelModal(null);
      setCancelDone(false);
    }, 2000);
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleModal || !rescheduleDate || !rescheduleTime) return;
    setRescheduleLoading(true);
    const { error } = await supabase
      .from("bookings")
      .update({
        booking_date: rescheduleDate,
        booking_time: rescheduleTime,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", rescheduleModal.id);

    setRescheduleLoading(false);

    if (error) {
      alert("Error al reprogramar la cita: " + error.message);
      return;
    }

    setRescheduleStep("done");
    loadBookings(); // Refresh immediately

    setTimeout(() => {
      setRescheduleModal(null);
      setRescheduleStep("pick");
      setRescheduleDate("");
      setRescheduleTime("");
    }, 2500);
  };

  const openReschedule = (booking: ClientBooking) => {
    setRescheduleModal(booking);
    setRescheduleStep("pick");
    setRescheduleDate("");
    setRescheduleTime("");
    setAvailableSlots([]);
  };

  const openGuarantee = (booking: ClientBooking) => {
    setGuaranteeModal(booking);
    setGuaranteeStep("pick");
    setGuaranteeDate("");
    setGuaranteeTime("");
    setGuaranteeReason("");
    setAvailableSlots([]);
  };

  const loadSlotsForGuarantee = async (date: string, booking: ClientBooking, duration: number) => {
    if (!date || !booking.professional_id) return;
    setSlotsLoading(true);
    setGuaranteeTime("");

    try {
      const dow = new Date(date + "T12:00:00").getDay();
      const { data: sched } = await supabase
        .from("professional_schedules")
        .select("*")
        .eq("profile_id", booking.professional_id)
        .eq("day_of_week", dow)
        .maybeSingle();

      if (!sched || !sched.is_working) {
        setAvailableSlots([]);
        setSlotsLoading(false);
        return;
      }

      const { data: settings } = await supabase
        .from("professional_settings")
        .select("slot_duration_minutes, buffer_minutes")
        .eq("profile_id", booking.professional_id)
        .maybeSingle();

      const slotDuration = settings?.slot_duration_minutes ?? 30;
      const buffer = settings?.buffer_minutes ?? 10;

      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("booking_time, total_duration_minutes")
        .eq("professional_id", booking.professional_id)
        .eq("booking_date", date)
        .neq("status", "cancelled");

      const [startH, startM] = (sched.start_time ?? "09:00").split(":").map(Number);
      const [endH, endM] = (sched.end_time ?? "19:00").split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      const busyRanges = (existingBookings ?? []).map(b => {
        const [bH, bM] = b.booking_time.split(":").map(Number);
        const bStart = bH * 60 + bM;
        return { start: bStart, end: bStart + b.total_duration_minutes + buffer };
      });

      const slots: AvailableSlot[] = [];
      const nowDate = new Date();
      const isToday = date === nowDate.toISOString().split("T")[0];
      const nowMinutes = isToday ? nowDate.getHours() * 60 + nowDate.getMinutes() + 60 : 0;

      for (let t = startMinutes; t + duration <= endMinutes; t += slotDuration) {
        if (isToday && t <= nowMinutes) continue;
        const slotEnd = t + duration + buffer;
        const isBusy = busyRanges.some(r => t < r.end && slotEnd > r.start);
        if (!isBusy) {
          const h = Math.floor(t / 60);
          const m = t % 60;
          const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          slots.push({ date, time: timeStr });
        }
      }

      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
    }
    setSlotsLoading(false);
  };

  const handleGuaranteeConfirm = async () => {
    const eligible = getEligibleGuarantee(guaranteeModal!);
    if (!guaranteeModal || !guaranteeDate || !guaranteeTime || !eligible) return;

    setGuaranteeLoading(true);
    try {
      const { data: created, error: bError } = await supabase
        .from("bookings")
        .insert({
          user_id: user?.id || null,
          client_name: guaranteeModal.client_name,
          client_email: guaranteeModal.client_email || null,
          client_phone: guaranteeModal.client_phone,
          booking_date: guaranteeDate,
          booking_time: guaranteeTime,
          total_duration_minutes: eligible.duration,
          total_price: 0.00,
          deposit_amount: 0.00,
          deposit_paid: true,
          status: "confirmed",
          payment_method: "in_person",
          professional_id: guaranteeModal.professional_id,
          is_guarantee: true,
          guarantee_original_booking_id: guaranteeModal.id,
          guarantee_original_professional_id: guaranteeModal.professional_id,
          guarantee_reason: guaranteeReason || "Garantía de reparación",
          notes: `Garantía de reparación para cita del ${guaranteeModal.booking_date} (${eligible.serviceName})`,
          booking_source: "web",
        })
        .select()
        .single();

      if (bError) throw bError;

      const { error: sError } = await supabase
        .from("booking_services")
        .insert({
          booking_id: created.id,
          service_id: eligible.serviceId,
          service_name: `Garantía - Reparación de ${eligible.serviceName}`,
          price_at_booking: 0.00,
        });

      if (sError) throw sError;

      setGuaranteeStep("done");
      loadBookings();

      setTimeout(() => {
        setGuaranteeModal(null);
        setGuaranteeStep("pick");
        setGuaranteeDate("");
        setGuaranteeTime("");
        setGuaranteeReason("");
      }, 2500);

    } catch (err: any) {
      alert("Error al agendar la garantía: " + err.message);
    } finally {
      setGuaranteeLoading(false);
    }
  };

  function getEligibleGuarantee(booking: ClientBooking) {
    if (booking.status !== "completed") return null;

    const bookingDate = new Date(booking.booking_date + "T12:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - bookingDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    for (const bs of booking.booking_services) {
      const srv = bs.services;
      if (srv && srv.guarantee_window_days > 0) {
        if (diffDays >= 0 && diffDays <= srv.guarantee_window_days) {
          return {
            serviceId: bs.service_id,
            serviceName: bs.service_name,
            windowDays: srv.guarantee_window_days,
            duration: srv.guarantee_duration_minutes,
          };
        }
      }
    }
    return null;
  }

  const filtered = bookings.filter(b => filterStatus === "all" || b.status === filterStatus);
  const upcoming = filtered.filter(b => {
    const d = new Date(b.booking_date + "T12:00:00");
    return d >= new Date(new Date().setHours(0, 0, 0, 0)) && b.status !== "cancelled";
  });
  const past = filtered.filter(b => {
    const d = new Date(b.booking_date + "T12:00:00");
    return d < new Date(new Date().setHours(0, 0, 0, 0)) || b.status === "cancelled";
  });

  // Min date for reschedule: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-6 text-white flex items-center gap-4">
        <div className="w-14 h-14 flex items-center justify-center bg-white/20 rounded-xl shrink-0">
          <i className="ri-calendar-check-line text-2xl"></i>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Mis reservas</h2>
          <p className="text-sm opacity-90">Historial completo de tus citas y servicios</p>
        </div>
        <Link
          to="/reservar"
          className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line mr-1.5"></i>Nueva reserva
        </Link>
      </div>

      {/* Banner Google Reviews — sólo si tiene al menos una reserva completada */}
      {bookings.some(b => b.status === "completed") && (
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-rose-200 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-rose-50 flex items-center justify-center shrink-0">
              <i className="ri-google-fill text-2xl bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 bg-clip-text text-transparent"></i>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-gray-900 text-sm">¿Cómo fue tu experiencia?</h3>
                <div className="flex">
                  {[1,2,3,4,5].map(i => <i key={i} className="ri-star-fill text-amber-400 text-xs"></i>)}
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Déjanos una reseña en Google — nos ayudas un montón y solo te llevará 1 minuto.
              </p>
              <span className="inline-flex items-center gap-1.5 bg-rose-500 group-hover:bg-rose-600 transition-colors text-white px-4 py-2 rounded-full text-xs font-bold">
                Escribir reseña <i className="ri-external-link-line"></i>
              </span>
            </div>
          </div>
        </a>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: bookings.length, icon: "ri-calendar-line", color: "text-rose-500" },
          { label: "Próximas", value: bookings.filter(b => new Date(b.booking_date + "T12:00:00") >= new Date(new Date().setHours(0,0,0,0)) && b.status !== "cancelled").length, icon: "ri-calendar-schedule-line", color: "text-teal-500" },
          { label: "Completadas", value: bookings.filter(b => b.status === "completed").length, icon: "ri-checkbox-circle-line", color: "text-emerald-500" },
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

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "Todas" },
          { value: "pending", label: "Pendientes" },
          { value: "confirmed", label: "Confirmadas" },
          { value: "completed", label: "Completadas" },
          { value: "cancelled", label: "Canceladas" },
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

      {/* Booking list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-calendar-line text-2xl text-rose-300"></i>
          </div>
          <p className="text-gray-500 font-medium">No tienes reservas todavía</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Reserva tu primera cita y aparecerá aquí</p>
          <Link
            to="/reservar"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-calendar-line"></i>Reservar ahora
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Próximas citas ({upcoming.length})
              </h3>
              <div className="space-y-3">
                {upcoming.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    expanded={expandedId === b.id}
                    onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
                    onCancel={() => setCancelModal(b)}
                    onReschedule={() => openReschedule(b)}
                    onGuaranteeRequest={() => openGuarantee(b)}
                    formatDate={formatDate}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Historial ({past.length})
              </h3>
              <div className="space-y-3 opacity-80">
                {past.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    expanded={expandedId === b.id}
                    onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
                    onCancel={() => setCancelModal(b)}
                    onReschedule={() => openReschedule(b)}
                    onGuaranteeRequest={() => openGuarantee(b)}
                    formatDate={formatDate}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CANCEL MODAL ── */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            {cancelDone ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-check-line text-2xl text-teal-500"></i>
                </div>
                <p className="font-bold text-gray-900 mb-1">Cita cancelada</p>
                <p className="text-sm text-gray-500">Tu reserva ha sido cancelada correctamente</p>
              </div>
            ) : (
              <>
                <div className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <i className="ri-calendar-close-line text-2xl text-red-500"></i>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">¿Cancelar esta cita?</h3>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
                    <p className="text-sm font-semibold text-gray-800 capitalize">
                      {formatDate(cancelModal.booking_date)}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {cancelModal.booking_time} · {cancelModal.booking_services.map(s => s.service_name).join(", ")}
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5 text-left">
                    <div className="flex items-start gap-2">
                      <i className="ri-information-line text-amber-500 mt-0.5 flex-shrink-0"></i>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        El anticipo pagado <strong>(€{Number(cancelModal.deposit_amount).toFixed(2)})</strong> puede no ser reembolsable según la política de cancelación. Contacta con el centro para más información.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-5">Esta acción no se puede deshacer.</p>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button
                    onClick={() => setCancelModal(null)}
                    className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleCancelConfirm}
                    disabled={cancelLoading}
                    className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {cancelLoading
                      ? <><i className="ri-loader-4-line animate-spin"></i>Cancelando...</>
                      : "Sí, cancelar cita"
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── RESCHEDULE MODAL ── */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <i className="ri-calendar-line text-base"></i>
                </div>
                <h2 className="font-bold text-gray-900">Reprogramar cita</h2>
              </div>
              {rescheduleStep !== "done" && (
                <button
                  onClick={() => { setRescheduleModal(null); setRescheduleStep("pick"); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <i className="ri-close-line text-gray-500"></i>
                </button>
              )}
            </div>

            <div className="p-6">
              {rescheduleStep === "done" ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                    <i className="ri-check-line text-2xl text-teal-500"></i>
                  </div>
                  <p className="font-bold text-gray-900 mb-1">¡Cita reprogramada!</p>
                  <p className="text-sm text-gray-500">
                    Tu cita ha sido movida al{" "}
                    <strong className="capitalize">{formatDate(rescheduleDate)}</strong> a las{" "}
                    <strong>{rescheduleTime}</strong>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Quedará pendiente de confirmación por el profesional</p>
                </div>
              ) : rescheduleStep === "confirm" ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">Confirma el cambio de fecha y hora:</p>

                  {/* Old */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 flex-shrink-0">
                      <i className="ri-close-line text-sm"></i>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Fecha actual</p>
                      <p className="text-sm font-medium text-gray-700 capitalize line-through">
                        {formatDate(rescheduleModal.booking_date)} · {rescheduleModal.booking_time}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <i className="ri-arrow-down-line text-gray-300"></i>
                    </div>
                  </div>

                  {/* New */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-50 text-teal-500 flex-shrink-0">
                      <i className="ri-check-line text-sm"></i>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Nueva fecha</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">
                        {formatDate(rescheduleDate)} · {rescheduleTime}
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
                    <div className="flex items-start gap-2">
                      <i className="ri-information-line text-amber-500 mt-0.5 flex-shrink-0 text-sm"></i>
                      <p className="text-xs text-amber-700">
                        La cita quedará en estado <strong>pendiente</strong> hasta que el profesional la confirme de nuevo.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setRescheduleStep("pick")}
                      className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap"
                    >
                      Cambiar fecha
                    </button>
                    <button
                      onClick={handleRescheduleConfirm}
                      disabled={rescheduleLoading}
                      className="flex-1 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {rescheduleLoading
                        ? <><i className="ri-loader-4-line animate-spin"></i>Guardando...</>
                        : "Confirmar cambio"
                      }
                    </button>
                  </div>
                </>
              ) : (
                /* STEP: PICK */
                <>
                  {/* Current booking info */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-5">
                    <p className="text-xs text-gray-400 mb-0.5">Cita actual</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">
                      {formatDate(rescheduleModal.booking_date)} · {rescheduleModal.booking_time}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {rescheduleModal.booking_services.map(s => s.service_name).join(", ")}
                    </p>
                  </div>

                  {/* Date picker */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Selecciona una nueva fecha
                    </label>
                    <input
                      type="date"
                      min={minDate}
                      value={rescheduleDate}
                      onChange={e => {
                        setRescheduleDate(e.target.value);
                        setRescheduleTime("");
                        if (e.target.value) loadSlotsForDate(e.target.value, rescheduleModal);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all cursor-pointer"
                    />
                  </div>

                  {/* Time slots */}
                  {rescheduleDate && (
                    <div className="mb-5">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Horarios disponibles
                      </label>
                      {slotsLoading ? (
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
                          ))}
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                          <i className="ri-calendar-close-line text-2xl text-gray-300 mb-2 block"></i>
                          <p className="text-sm text-gray-400">No hay horarios disponibles este día</p>
                          <p className="text-xs text-gray-300 mt-1">Prueba con otra fecha</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                          {availableSlots.map(slot => (
                            <button
                              key={slot.time}
                              onClick={() => setRescheduleTime(slot.time)}
                              className={`py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                                rescheduleTime === slot.time
                                  ? "bg-rose-500 text-white"
                                  : "bg-gray-50 text-gray-700 hover:bg-rose-50 hover:text-rose-600 border border-gray-100"
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setRescheduleStep("confirm")}
                    disabled={!rescheduleDate || !rescheduleTime}
                    className="w-full py-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-40 transition-colors whitespace-nowrap"
                  >
                    Continuar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GUARANTEE MODAL ── */}
      {guaranteeModal && (() => {
        const eligible = getEligibleGuarantee(guaranteeModal);
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <i className="ri-shield-check-line text-base"></i>
                  </div>
                  <h2 className="font-bold text-gray-900">Solicitar Garantía (Gratis)</h2>
                </div>
                {guaranteeStep !== "done" && (
                  <button
                    onClick={() => { setGuaranteeModal(null); setGuaranteeStep("pick"); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                  >
                    <i className="ri-close-line text-gray-500"></i>
                  </button>
                )}
              </div>

              <div className="p-6">
                {guaranteeStep === "done" ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                      <i className="ri-check-line text-2xl text-teal-500"></i>
                    </div>
                    <p className="font-bold text-gray-900 mb-1">¡Cita de garantía agendada!</p>
                    <p className="text-sm text-gray-500">
                      Tu cita de reparación ha sido agendada para el{" "}
                      <strong className="capitalize">{formatDate(guaranteeDate)}</strong> a las{" "}
                      <strong>{guaranteeTime}</strong>.
                    </p>
                  </div>
                ) : guaranteeStep === "confirm" ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4">Confirma tu cita de reparación en garantía:</p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-400">Servicio de reparación</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">
                        Reparación de {eligible?.serviceName} ({eligible?.duration} min)
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-400">Fecha y hora seleccionadas</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">
                        {formatDate(guaranteeDate)} a las {guaranteeTime} hs
                      </p>
                    </div>

                    {guaranteeReason && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-5">
                        <p className="text-xs text-gray-400">Detalle del problema</p>
                        <p className="text-sm text-gray-600 italic">"{guaranteeReason}"</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setGuaranteeStep("pick")}
                        className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        Cambiar fecha
                      </button>
                      <button
                        onClick={handleGuaranteeConfirm}
                        disabled={guaranteeLoading}
                        className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {guaranteeLoading
                          ? <><i className="ri-loader-4-line animate-spin"></i>Agendando...</>
                          : "Confirmar cita"
                        }
                      </button>
                    </div>
                  </>
                ) : (
                  /* STEP: PICK */
                  <>
                    {/* Info */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-5 text-emerald-800 text-xs">
                      <p className="font-semibold mb-1">Información de Garantía:</p>
                      <p>
                        Este servicio cuenta con un plazo de <strong>{eligible?.windowDays} días</strong> de garantía gratuita.
                        La cita ocupará un hueco de <strong>{eligible?.duration} minutos</strong> en la agenda del profesional original.
                      </p>
                    </div>

                    {/* Date picker */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Selecciona una fecha para la reparación
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={guaranteeDate}
                        onChange={e => {
                          setGuaranteeDate(e.target.value);
                          setGuaranteeTime("");
                          if (e.target.value && eligible) {
                            loadSlotsForGuarantee(e.target.value, guaranteeModal, eligible.duration);
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all cursor-pointer"
                      />
                    </div>

                    {/* Time slots */}
                    {guaranteeDate && (
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          Horarios disponibles
                        </label>
                        {slotsLoading ? (
                          <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
                            ))}
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="text-center py-6 bg-gray-50 rounded-xl">
                            <i className="ri-calendar-close-line text-2xl text-gray-300 mb-2 block"></i>
                            <p className="text-sm text-gray-400">No hay horarios disponibles este día</p>
                            <p className="text-xs text-gray-300 mt-1">Prueba con otra fecha</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                            {availableSlots.map(slot => (
                              <button
                                key={slot.time}
                                onClick={() => setGuaranteeTime(slot.time)}
                                className={`py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                                  guaranteeTime === slot.time
                                    ? "bg-rose-500 text-white"
                                    : "bg-gray-50 text-gray-700 hover:bg-rose-50 hover:text-rose-600 border border-gray-100"
                                }`}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Guarantee Reason input */}
                    <div className="mb-5">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        ¿Qué ha ocurrido? (Motivo)
                      </label>
                      <textarea
                        value={guaranteeReason}
                        onChange={e => setGuaranteeReason(e.target.value)}
                        placeholder="Ej: Se me ha partido la uña del dedo pulgar derecho."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all resize-none min-h-[60px]"
                      />
                    </div>

                    <button
                      onClick={() => setGuaranteeStep("confirm")}
                      disabled={!guaranteeDate || !guaranteeTime}
                      className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      Continuar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

interface BookingCardProps {
  booking: ClientBooking;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onGuaranteeRequest: () => void;
  formatDate: (d: string) => string;
  formatDuration: (m: number) => string;
}

function BookingCard({ booking, expanded, onToggle, onCancel, onReschedule, onGuaranteeRequest, formatDate, formatDuration }: BookingCardProps) {
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const remaining = Number(booking.total_price) - Number(booking.deposit_amount);
  const modifiable = canModify(booking);
  const [calDropdown, setCalDropdown] = useState(false);

  // Helper to extract guarantee details in client card
  const getEligibleGuarantee = (b: ClientBooking) => {
    if (b.status !== "completed") return null;
    const bookingDate = new Date(b.booking_date + "T12:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - bookingDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    for (const bs of b.booking_services) {
      const srv = bs.services;
      if (srv && srv.guarantee_window_days > 0) {
        if (diffDays >= 0 && diffDays <= srv.guarantee_window_days) {
          return {
            serviceName: bs.service_name,
            windowDays: srv.guarantee_window_days,
            duration: srv.guarantee_duration_minutes,
          };
        }
      }
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-4 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        {/* Date badge */}
        <div className="w-14 h-14 rounded-xl bg-rose-50 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-rose-400 uppercase">
            {new Date(booking.booking_date + "T12:00:00").toLocaleDateString("es-ES", { month: "short" })}
          </span>
          <span className="text-xl font-bold text-rose-600 leading-none">
            {new Date(booking.booking_date + "T12:00:00").getDate()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">
              {booking.booking_services.map(s => s.service_name).join(", ") || "Servicio"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <i className="ri-time-line"></i>{booking.booking_time}
            </span>
            <span className="flex items-center gap-1">
              <i className="ri-timer-line"></i>{formatDuration(booking.total_duration_minutes)}
            </span>
            <span className="flex items-center gap-1 font-semibold text-gray-600">
              <i className="ri-money-euro-circle-line"></i>€{Number(booking.total_price).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${status.color}`}>
            <i className={`${status.icon} mr-1`}></i>{status.label}
          </span>
          <i className={expanded ? "ri-arrow-up-s-line text-gray-400" : "ri-arrow-down-s-line text-gray-400"}></i>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Fecha y hora</p>
                <p className="text-sm text-gray-800 capitalize">{formatDate(booking.booking_date)} a las {booking.booking_time}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Servicios</p>
                <div className="flex flex-wrap gap-1.5">
                  {booking.booking_services.map((s, i) => (
                    <span key={i} className="text-xs bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full">
                      {s.service_name} — €{Number(s.price_at_booking).toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
              {booking.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Notas</p>
                  <p className="text-sm text-gray-600 italic">{booking.notes}</p>
                </div>
              )}

              {/* Action buttons */}
              {(booking.status === "pending" || booking.status === "confirmed") && (
                <div className="pt-1 space-y-2">
                  {modifiable ? (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); onReschedule(); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-calendar-line"></i>
                        Reprogramar cita
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onCancel(); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-close-circle-line"></i>
                        Cancelar cita
                      </button>
                    </>
                  ) : (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                      <i className="ri-information-line text-amber-500 text-sm mt-0.5 flex-shrink-0"></i>
                      <p className="text-xs text-amber-700">
                        No se puede modificar esta cita con menos de 24 horas de antelación. Contacta directamente con el centro.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-600">Resumen de pago</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-semibold text-gray-900">€{Number(booking.total_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Método de pago</span>
                  <span className="font-semibold text-gray-800">
                    {booking.booking_source === "admin"
                      ? "Presencial"
                      : booking.payment_method === "stripe" && booking.stripe_session_id && booking.deposit_paid
                      ? "Tarjeta"
                      : booking.payment_method === "stripe"
                      ? "Efectivo"
                      : booking.payment_method === "efectivo" || booking.payment_method === "efectivo_full"
                      ? "Efectivo"
                      : "Presencial"}
                  </span>
                </div>
                {Number(booking.deposit_amount) > 0 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {Number(booking.deposit_amount) >= Number(booking.total_price) * 0.9
                          ? "Pago completo"
                          : "Anticipo pagado"}
                      </span>
                      <span className={`font-semibold ${booking.deposit_paid ? "text-teal-600" : "text-amber-600"}`}>
                        €{Number(booking.deposit_amount).toFixed(2)} {booking.deposit_paid ? "✓" : "(pendiente)"}
                      </span>
                    </div>
                    {remaining > 0 && (
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                        <span className="text-gray-500">Resto en cita</span>
                        <span className="font-bold text-gray-900">€{remaining.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                    <span className="text-gray-500">Pago en salón</span>
                    <span className="font-bold text-gray-900">€{Number(booking.total_price).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Add to calendar */}
              {(booking.status === "pending" || booking.status === "confirmed") && (
                <div className="relative">
                  <button
                    onClick={e => { e.stopPropagation(); setCalDropdown(p => !p); }}
                    className="w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <i className="ri-calendar-check-line text-teal-500"></i>
                      Añadir al calendario
                    </span>
                    {calDropdown
                      ? <i className="ri-arrow-up-s-line text-gray-400"></i>
                      : <i className="ri-arrow-down-s-line text-gray-400"></i>
                    }
                  </button>
                  {calDropdown && (() => {
                    const links = buildCalendarLinks(booking);
                    return (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl overflow-hidden z-10">
                        {[
                          { href: links.googleUrl, target: "_blank", download: undefined, icon: "ri-google-line", color: "bg-red-50 text-red-500", label: "Google Calendar", desc: "Abre en Google Calendar" },
                          { href: links.icsUrl, target: undefined, download: `cita-${booking.booking_date}.ics`, icon: "ri-apple-line", color: "bg-gray-100 text-gray-600", label: "Apple Calendar", desc: "Descarga archivo .ics" },
                          { href: links.outlookUrl, target: "_blank", download: undefined, icon: "ri-mail-line", color: "bg-sky-50 text-sky-500", label: "Outlook", desc: "Abre en Outlook Web" },
                        ].map((item, i) => (
                          <a
                            key={i}
                            href={item.href}
                            target={item.target}
                            download={item.download}
                            rel="noopener noreferrer"
                            onClick={() => setCalDropdown(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                          >
                            <div className={`w-7 h-7 flex items-center justify-center rounded-full ${item.color}`}>
                              <i className={`${item.icon} text-sm`}></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{item.label}</p>
                              <p className="text-xs text-gray-400">{item.desc}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {booking.status === "completed" && (
                <div className="space-y-2">
                  {(() => {
                    const eligible = getEligibleGuarantee(booking);
                    if (eligible) {
                      return (
                        <button
                          onClick={e => { e.stopPropagation(); onGuaranteeRequest(); }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-shield-check-line text-base"></i>
                          Solicitar Garantía (Gratis)
                        </button>
                      );
                    }
                    return null;
                  })()}
                  <a
                    href={GOOGLE_REVIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-50 hover:bg-amber-100 transition-colors rounded-xl p-3 flex items-center gap-3 cursor-pointer block"
                  >
                    <i className="ri-google-fill text-amber-500 text-lg"></i>
                    <div className="flex-1">
                      <p className="text-xs text-amber-900 font-semibold">¿Te gustó el servicio?</p>
                      <p className="text-xs text-amber-700">Déjanos tu reseña en Google ★★★★★ — nos ayudas un montón</p>
                    </div>
                    <i className="ri-external-link-line text-amber-500 text-sm"></i>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
