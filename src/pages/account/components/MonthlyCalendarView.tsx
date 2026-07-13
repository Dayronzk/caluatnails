import { useState } from "react";

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
}

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-teal-400",
  cancelled: "bg-red-400",
  completed: "bg-gray-400",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-50 text-amber-600" },
  confirmed: { label: "Confirmada", color: "bg-teal-50 text-teal-600" },
  cancelled: { label: "Cancelada", color: "bg-red-50 text-red-500" },
  completed: { label: "Completada", color: "bg-gray-100 text-gray-500" },
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface Props {
  bookings: Booking[];
}

export default function MonthlyCalendarView({ bookings }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(null);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const totalDays = lastDay.getDate();

  // Monday-first: getDay() returns 0=Sun, so shift
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const totalCells = Math.ceil((startDow + totalDays) / 7) * 7;

  // Map bookings by date string
  const bookingsByDate: Record<string, Booking[]> = {};
  bookings.forEach(b => {
    if (!bookingsByDate[b.booking_date]) bookingsByDate[b.booking_date] = [];
    bookingsByDate[b.booking_date].push(b);
  });

  const pad = (n: number) => String(n).padStart(2, "0");

  const cells: Array<{ dateStr: string | null; day: number | null }> = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDow + 1;
    if (dayNum < 1 || dayNum > totalDays) {
      cells.push({ dateStr: null, day: null });
    } else {
      const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(dayNum)}`;
      cells.push({ dateStr, day: dayNum });
    }
  }

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const selectedBookings = selectedDate ? (bookingsByDate[selectedDate] ?? []) : [];

  const formatTime = (t: string) => t.slice(0, 5);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  };

  // Monthly stats
  const monthBookings = bookings.filter(b => {
    const [y, mo] = b.booking_date.split("-").map(Number);
    return y === viewYear && mo === viewMonth + 1;
  });
  const monthRevenue = monthBookings
    .filter(b => b.status !== "cancelled")
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <div className="space-y-4">
      {/* Month stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{monthBookings.filter(b => b.status !== "cancelled").length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Citas este mes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">€{monthRevenue.toFixed(0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Ingresos estimados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{monthBookings.filter(b => b.status === "pending").length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Pendientes</p>
        </div>
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-gray-500"></i>
          </button>
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-gray-900 text-base">
              {MONTHS[viewMonth]} {viewYear}
            </h3>
            <button
              onClick={goToday}
              className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-600 font-medium hover:bg-teal-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              Hoy
            </button>
          </div>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-s-line text-gray-500"></i>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            const dayBookings = cell.dateStr ? (bookingsByDate[cell.dateStr] ?? []) : [];
            const hasBookings = dayBookings.length > 0;
            const isCurrentMonth = cell.day !== null;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (!cell.dateStr) return;
                  setSelectedDate(prev => prev === cell.dateStr ? null : cell.dateStr);
                }}
                className={`min-h-[72px] p-1.5 border-b border-r border-gray-50 transition-colors ${
                  isCurrentMonth ? "cursor-pointer hover:bg-gray-50" : "bg-gray-50/30"
                } ${isSelected ? "bg-teal-50 hover:bg-teal-50" : ""}`}
              >
                {cell.day !== null && (
                  <>
                    <div className="flex justify-end mb-1">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                          isToday
                            ? "bg-teal-500 text-white"
                            : isSelected
                            ? "bg-teal-100 text-teal-700"
                            : "text-gray-700"
                        }`}
                      >
                        {cell.day}
                      </span>
                    </div>
                    {hasBookings && (
                      <div className="space-y-0.5">
                        {dayBookings.slice(0, 3).map((b, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate ${
                              b.status === "confirmed"
                                ? "bg-teal-50 text-teal-700"
                                : b.status === "pending"
                                ? "bg-amber-50 text-amber-700"
                                : b.status === "cancelled"
                                ? "bg-red-50 text-red-500 line-through opacity-60"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[b.status] ?? "bg-gray-400"}`}></span>
                            <span className="truncate">{formatTime(b.booking_time)}</span>
                          </div>
                        ))}
                        {dayBookings.length > 3 && (
                          <p className="text-xs text-gray-400 pl-1">+{dayBookings.length - 3} más</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 flex-wrap">
          {[
            { label: "Confirmada", dot: "bg-teal-400" },
            { label: "Pendiente", dot: "bg-amber-400" },
            { label: "Cancelada", dot: "bg-red-400" },
            { label: "Completada", dot: "bg-gray-400" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${item.dot}`}></span>
              <span className="text-xs text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day detail panel */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedBookings.length === 0
                  ? "Sin citas este día"
                  : `${selectedBookings.length} cita${selectedBookings.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <i className="ri-close-line text-gray-400 text-sm"></i>
            </button>
          </div>

          {selectedBookings.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <i className="ri-calendar-line text-gray-300 text-xl"></i>
              </div>
              <p className="text-sm text-gray-400">No hay citas para este día</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {selectedBookings
                .sort((a, b) => a.booking_time.localeCompare(b.booking_time))
                .map(b => {
                  const status = STATUS_LABELS[b.status] ?? STATUS_LABELS.pending;
                  return (
                    <div key={b.id} className="px-5 py-4 flex items-start gap-4">
                      {/* Time column */}
                      <div className="text-center flex-shrink-0 w-12">
                        <p className="text-sm font-bold text-gray-900">{formatTime(b.booking_time)}</p>
                        <p className="text-xs text-gray-400">{formatDuration(b.total_duration_minutes)}</p>
                      </div>

                      {/* Divider */}
                      <div className="flex flex-col items-center flex-shrink-0 self-stretch">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 ${STATUS_DOT[b.status] ?? "bg-gray-400"}`}></div>
                        <div className="w-px flex-1 bg-gray-100 mt-1"></div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{b.client_name}</p>
                            <p className="text-xs text-gray-400">{b.client_email}</p>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {b.booking_services.map((bs, i) => (
                            <span key={i} className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">
                              {bs.service_name}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>Total: <strong className="text-gray-800">€{Number(b.total_price).toFixed(2)}</strong></span>
                          {Number(b.deposit_amount) >= Number(b.total_price) * 0.9 ? (
                            <span className={b.deposit_paid ? "text-teal-600" : "text-amber-600"}>
                              Pago completo: €{Number(b.deposit_amount).toFixed(2)} {b.deposit_paid ? "✓" : "(pendiente)"}
                            </span>
                          ) : (
                            <span className={b.deposit_paid ? "text-teal-600" : "text-amber-600"}>
                              Anticipo: €{Number(b.deposit_amount).toFixed(2)} {b.deposit_paid ? "✓" : "(pendiente)"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
