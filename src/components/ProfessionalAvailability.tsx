import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, User, CheckCircle2, XCircle, Info, TrendingUp } from "lucide-react";

interface Professional {
  profile_id: string;
  display_name: string;
  is_active: boolean;
  slot_duration_minutes: number;
}

interface Schedule {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

interface BlockedTime {
  start_time: string;
  end_time: string;
  reason: string | null;
}

interface Booking {
  booking_time: string;
  total_duration_minutes: number;
}

export default function ProfessionalAvailability() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityData, setAvailabilityData] = useState<any[]>([]);
  const [dailyCapacity, setDailyCapacity] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get active professionals
      const { data: pros } = await supabase
        .from("professional_settings")
        .select("profile_id, display_name, is_active, slot_duration_minutes")
        .eq("is_active", true);

      if (!pros) return;
      setProfessionals(pros);

      const dayOfWeek = new Date(date).getDay(); // 0 (Sun) to 6 (Sat)
      
      const proData = await Promise.all(pros.map(async (pro) => {
        // 2. Get schedule for this day
        const { data: schedule } = await supabase
          .from("professional_schedules")
          .select("*")
          .eq("profile_id", pro.profile_id)
          .eq("day_of_week", dayOfWeek)
          .single();

        // 3. Get blocked times for this date
        const { data: blocks } = await supabase
          .from("professional_blocked_times")
          .select("start_time, end_time, reason")
          .eq("profile_id", pro.profile_id)
          .eq("blocked_date", date);

        // 4. Get bookings for this date
        const { data: bookings } = await supabase
          .from("bookings")
          .select("booking_time, total_duration_minutes")
          .eq("professional_id", pro.profile_id)
          .eq("booking_date", date)
          .neq("status", "cancelled");

        return {
          ...pro,
          schedule: schedule as Schedule,
          blocks: (blocks || []) as BlockedTime[],
          bookings: (bookings || []) as Booking[]
        };
      }));

      setAvailabilityData(proData);

      // Calculate Capacity
      let totalCapacity = 0;
      proData.forEach(pro => {
        if (pro.schedule?.is_working) {
          const start = pro.schedule.start_time.split(":");
          const end = pro.schedule.end_time.split(":");
          const startMins = parseInt(start[0]) * 60 + parseInt(start[1]);
          const endMins = parseInt(end[0]) * 60 + parseInt(end[1]);
          let workMins = endMins - startMins;

          // Subtract blocks
          pro.blocks.forEach(block => {
            const bStart = block.start_time.split(":");
            const bEnd = block.end_time.split(":");
            const bStartMins = parseInt(bStart[0]) * 60 + parseInt(bStart[1]);
            const bEndMins = parseInt(bEnd[0]) * 60 + parseInt(bEnd[1]);
            workMins -= (bEndMins - bStartMins);
          });

          if (workMins > 0) {
            totalCapacity += Math.floor(workMins / pro.slot_duration_minutes);
          }
        }
      });
      setDailyCapacity(totalCapacity);

    } catch (err) {
      console.error("Error loading availability:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const getTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 21; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  };

  const isBlocked = (pro: any, time: string) => {
    const timeMins = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
    return pro.blocks.some((b: any) => {
      const bStartMins = parseInt(b.start_time.split(":")[0]) * 60 + parseInt(b.start_time.split(":")[1]);
      const bEndMins = parseInt(b.end_time.split(":")[0]) * 60 + parseInt(b.end_time.split(":")[1]);
      return timeMins >= bStartMins && timeMins < bEndMins;
    });
  };

  const isBooked = (pro: any, time: string) => {
    const timeMins = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
    return pro.bookings.some((b: any) => {
      const bStartMins = parseInt(b.booking_time.split(":")[0]) * 60 + parseInt(b.booking_time.split(":")[1]);
      const bEndMins = bStartMins + b.total_duration_minutes;
      return timeMins >= bStartMins && timeMins < bEndMins;
    });
  };

  const isOutsideWorkingHours = (pro: any, time: string) => {
    if (!pro.schedule?.is_working) return true;
    const timeMins = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
    const startMins = parseInt(pro.schedule.start_time.split(":")[0]) * 60 + parseInt(pro.schedule.start_time.split(":")[1]);
    const endMins = parseInt(pro.schedule.end_time.split(":")[0]) * 60 + parseInt(pro.schedule.end_time.split(":")[1]);
    return timeMins < startMins || timeMins >= endMins;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-gray-900">Fecha de consulta</h3>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm"
            />
          </div>
          <p className="text-sm text-gray-500">
            Visualiza la ocupación de todo el equipo para organizar mejor el día.
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Capacidad Total</span>
          </div>
          <div className="text-3xl font-bold mb-1">{dailyCapacity} servicios</div>
          <p className="text-xs opacity-80">Basado en horarios activos y bloqueos para este día.</p>
        </div>
      </div>

      {/* Availability Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header row with professional names */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <div className="w-24 flex-shrink-0 border-r border-gray-100 py-4 px-4 font-semibold text-xs text-gray-400 uppercase tracking-wider text-center">
                Hora
              </div>
              {professionals.map((pro) => (
                <div key={pro.profile_id} className="flex-1 border-r border-gray-100 py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold text-sm text-gray-900">{pro.display_name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Slots de {pro.slot_duration_minutes}m</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm">Cargando disponibilidad...</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {getTimeSlots().map((time) => (
                  <div key={time} className="flex border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                    <div className="w-24 flex-shrink-0 border-r border-gray-100 py-3 px-4 text-xs font-medium text-gray-500 flex items-center justify-center bg-gray-50/30">
                      <Clock className="w-3 h-3 mr-1 opacity-40" />
                      {time}
                    </div>
                    {availabilityData.map((pro) => {
                      const blocked = isBlocked(pro, time);
                      const booked = isBooked(pro, time);
                      const outside = isOutsideWorkingHours(pro, time);

                      let statusClass = "bg-white";
                      let content = <span className="text-[10px] text-emerald-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Disponible</span>;
                      let icon = null;

                      if (outside) {
                        statusClass = "bg-gray-50 text-gray-300";
                        content = <span className="text-[10px] uppercase font-bold tracking-tighter opacity-30">Cerrado</span>;
                      } else if (blocked) {
                        statusClass = "bg-red-50 text-red-500";
                        content = <span className="text-[10px] font-semibold">Bloqueado</span>;
                        icon = <XCircle className="w-3 h-3" />;
                      } else if (booked) {
                        statusClass = "bg-amber-50 text-amber-600";
                        content = <span className="text-[10px] font-semibold">Reservado</span>;
                        icon = <CheckCircle2 className="w-3 h-3" />;
                      }

                      return (
                        <div key={pro.profile_id} className={`flex-1 border-r border-gray-50 py-3 px-2 flex flex-col items-center justify-center gap-1 group min-h-[50px] ${statusClass}`}>
                          {icon}
                          {content}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-gray-200"></div>
          <span className="text-xs text-gray-600 font-medium">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-50 border border-amber-100"></div>
          <span className="text-xs text-gray-600 font-medium">Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-50 border border-red-100"></div>
          <span className="text-xs text-gray-600 font-medium">Bloqueado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-50 border border-gray-100"></div>
          <span className="text-xs text-gray-600 font-medium">Fuera de horario</span>
        </div>
      </div>
    </div>
  );
}
