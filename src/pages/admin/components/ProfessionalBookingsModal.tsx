import { useState, useEffect } from "react";
import { X, Clock, User, Calendar as CalendarIcon, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  booking_time: string;
  total_duration_minutes: number;
  status: string;
  total_price: number;
}

interface ProfessionalBookingsModalProps {
  professionalId: string;
  professionalName: string;
  date: string;
  onClose: () => void;
}

export function ProfessionalBookingsModal({
  professionalId,
  professionalName,
  date,
  onClose,
}: ProfessionalBookingsModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("id, client_name, client_email, client_phone, booking_time, total_duration_minutes, status, total_price")
        .eq("professional_id", professionalId)
        .eq("booking_date", date)
        .neq("status", "cancelled")
        .order("booking_time", { ascending: true });

      if (!error && data) {
        setBookings(data);
      }
      setLoading(false);
    };

    fetchBookings();
  }, [professionalId, date]);

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-700" },
      confirmed: { label: "Confirmada", cls: "bg-emerald-100 text-emerald-700" },
      cancelled: { label: "Cancelada", cls: "bg-rose-100 text-rose-700" },
      completed: { label: "Completada", cls: "bg-gray-100 text-gray-600" },
    };
    return map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  };

  const formattedDate = format(new Date(date + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
        {/* Header */}
        <div className="bg-rose-500 p-6 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black mb-1">Citas de {professionalName}</h2>
            <p className="text-rose-100 text-sm flex items-center gap-2 capitalize">
              <CalendarIcon className="w-4 h-4" />
              {formattedDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <i className="ri-loader-4-line animate-spin text-4xl text-rose-500 mb-4"></i>
              <p className="text-gray-500 font-medium">Cargando citas...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No hay citas programadas para este día.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => {
                const { label, cls } = getStatusLabel(b.status);
                
                // Calculate end time
                const [h, m] = b.booking_time.split(':').map(Number);
                const startMins = h * 60 + m;
                const endMins = startMins + (b.total_duration_minutes || 30);
                const endH = Math.floor(endMins / 60);
                const endM = endMins % 60;
                const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

                return (
                  <div key={b.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4 hover:border-rose-200 transition-colors">
                    {/* Time block */}
                    <div className="flex items-center gap-3 md:w-32 shrink-0">
                      <div className="w-2 h-10 bg-rose-500 rounded-full"></div>
                      <div>
                        <p className="text-lg font-black text-gray-900">{b.booking_time.substring(0, 5)}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          hasta {endTimeStr}
                        </p>
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <h4 className="font-bold text-gray-900 truncate">{b.client_name}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {b.client_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {b.client_phone}
                          </span>
                        )}
                        <span>{b.total_duration_minutes} min</span>
                      </div>
                    </div>

                    {/* Status & Price */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0 gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${cls}`}>
                        {label}
                      </span>
                      <span className="font-black text-lg text-emerald-600">
                        {Number(b.total_price).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
