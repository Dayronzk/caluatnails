import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import ProfessionalScheduleConfig from "./ProfessionalScheduleConfig";
import AdminNewBookingModal from "./AdminNewBookingModal";
import { 
  Users, 
  Calendar, 
  Clock, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  UserCheck,
  CalendarDays,
  Sparkles
} from "lucide-react";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

interface Professional {
  id: string;
  name: string;
  display_name: string | null;
  avatar_url: string | null;
  slot_duration_minutes: number;
  is_working_today: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start: string | null;
  break_end: string | null;
}

export default function ProfessionalAvailability() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPro, setEditingPro] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [creatingBooking, setCreatingBooking] = useState<{ proId: string, proName: string, time: string, maxMinutes: number } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setBookings([]);
    setBlockedTimes([]);
    setProfessionals([]);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayOfWeek = selectedDate.getDay();

    try {
      // 1. Get all professionals (admins or profiles with is_professional=true)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, role, is_professional')
        .or('role.eq.admin,is_professional.eq.true');

      if (!profiles) return;

      // 2. Get their settings and schedules for the selected day
      const profIds = profiles.map(p => p.id);
      
      const { data: settings } = await supabase
        .from('professional_settings')
        .select('*')
        .in('profile_id', profIds);

      const { data: schedules } = await supabase
        .from('professional_schedules')
        .select('*')
        .in('profile_id', profIds)
        .eq('day_of_week', dayOfWeek);

      // 3. Get bookings and blocked times for this date
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_services(service_name)
        `)
        .eq('booking_date', dateStr)
        .neq('status', 'cancelled');

      const { data: blocks } = await supabase
        .from('professional_blocked_times')
        .select('*')
        .eq('blocked_date', dateStr);

      setBookings(bookingsData || []);
      setBlockedTimes(blocks || []);

      // 4. Map everything together
      const mapped = profiles.map(p => {
        const s = settings?.find(set => set.profile_id === p.id);
        const sch = schedules?.find(sc => sc.profile_id === p.id);
        
        return {
          id: p.id,
          name: p.name || 'Profesional',
          display_name: s?.display_name || p.name,
          avatar_url: p.avatar_url,
          slot_duration_minutes: s?.slot_duration_minutes || 30,
          is_working_today: sch?.is_working ?? false,
          start_time: sch?.start_time || null,
          end_time: sch?.end_time || null,
          break_start: sch?.break_start || null,
          break_end: sch?.break_end || null,
        };
      });

      setProfessionals(mapped);
    } catch (err) {
      console.error("Error loading availability:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 21; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Convert "HH:mm" or "HH:mm:ss" to total minutes from midnight
  const timeToMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const getStatus = (pro: Professional, time: string) => {
    const slotMins = timeToMins(time);

    // 1. Check if booked (must come first so bookings are always visible on the grid)
    const isBooked = bookings.some(b => {
      if (b.professional_id !== pro.id) return false;
      const bookStart = timeToMins(b.booking_time);
      const bookEnd = bookStart + (b.total_duration_minutes as number);
      return slotMins >= bookStart && slotMins < bookEnd;
    });
    if (isBooked) return 'booked';

    // If not booked, and it is a non-working day, mark as off
    if (!pro.is_working_today) return 'off';

    // 2. Check if within working hours
    if (pro.start_time && pro.end_time) {
      const startMins = timeToMins(pro.start_time);
      const endMins = timeToMins(pro.end_time);
      if (slotMins < startMins || slotMins >= endMins) return 'off';
    }

    // 3. Check if within break time
    if (pro.break_start && pro.break_end) {
      const breakStart = timeToMins(pro.break_start);
      const breakEnd = timeToMins(pro.break_end);
      if (slotMins >= breakStart && slotMins < breakEnd) return 'blocked';
    }

    // 4. Check if individually blocked
    const isBlocked = blockedTimes.some(b => {
      if (b.profile_id !== pro.id) return false;
      const bStart = timeToMins(b.start_time);
      const bEnd = timeToMins(b.end_time);
      return slotMins >= bStart && slotMins < bEnd;
    });
    if (isBlocked) return 'blocked';

    // 5. Hide slots that already passed today
    const isToday = isSameDay(selectedDate, startOfToday());
    if (isToday) {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      if (slotMins < nowMins) return 'off';
    }

    return 'free';
  };

  const calculateStats = () => {
    const totalPros = professionals.length;
    const workingToday = professionals.filter(p => p.is_working_today).length;
    
    let totalCapacity = 0;
    professionals.forEach(pro => {
      if (pro.is_working_today && pro.start_time && pro.end_time) {
        const [h1, m1] = pro.start_time.split(':').map(Number);
        const [h2, m2] = pro.end_time.split(':').map(Number);
        const workMins = (h2 * 60 + m2) - (h1 * 60 + m1);
        totalCapacity += Math.floor(workMins / pro.slot_duration_minutes);
      }
    });

    const bookedSlots = bookings.reduce((sum, b) => sum + Math.ceil(b.total_duration_minutes / 30), 0);
    const occupancy = totalCapacity > 0 ? Math.round((bookedSlots / totalCapacity) * 100) : 0;

    return { totalPros, workingToday, occupancy, totalCapacity };
  };

  const stats = calculateStats();

  const generateDailyReport = () => {
    const dateStr = format(selectedDate, "eeee, d 'de' MMMM 'de' yyyy", { locale: es });
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte Diario - Caluatnails - ${dateStr}</title>
          <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print { .no-print { display: none; } }
            body { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a1a; }
          </style>
        </head>
        <body class="p-10 max-w-4xl mx-auto">
          <div class="flex justify-between items-start border-b-2 border-rose-500 pb-6 mb-8">
            <div>
              <h1 class="text-3xl font-black text-gray-900 tracking-tight">REPORTAJE DIARIO</h1>
              <p class="text-rose-500 font-bold uppercase tracking-widest text-xs mt-1">Gestión Administrativa · Caluatnails</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-gray-900">${dateStr}</p>
              <p class="text-xs text-gray-400">Generado el ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-6 mb-10">
            <div class="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ocupación Total</p>
              <p class="text-3xl font-black text-rose-500">${stats.occupancy}%</p>
            </div>
            <div class="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Citas Agendadas</p>
              <p class="text-3xl font-black text-gray-900">${bookings.length}</p>
            </div>
            <div class="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Capacidad Total</p>
              <p class="text-3xl font-black text-gray-900">${stats.totalCapacity} <span class="text-xs font-normal">slots</span></p>
            </div>
          </div>

          <div class="mb-10">
            <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="ri-team-line text-rose-500"></i> Estado del Equipo
            </h2>
            <div class="grid grid-cols-2 gap-4">
              ${professionals.map(p => {
                const proBookings = bookings.filter(b => b.professional_id === p.id).length;
                return `
                  <div class="p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p class="font-bold text-gray-800 text-sm">${p.display_name || p.name}</p>
                      <p class="text-xs ${p.is_working_today ? "text-teal-600" : "text-gray-400"} font-medium">
                        ${p.is_working_today ? "En turno hoy" : "Descanso / No disponible"}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-black text-gray-900">${proBookings}</p>
                      <p class="text-[9px] text-gray-400 font-bold uppercase">Citas</p>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div class="mt-20 border-t border-dashed border-gray-200 pt-8 flex justify-between items-end">
            <div class="text-xs text-gray-400">
              <p>Este reporte es para uso interno administrativo.</p>
              <p>© ${new Date().getFullYear()} Caluatnails Dashboard System</p>
            </div>
            <button onclick="window.print()" class="no-print bg-rose-500 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all">
              Imprimir Reporte
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading && professionals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Date Selector & Capacity Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div 
              className="flex items-center gap-3 cursor-pointer group select-none relative"
              title="Abrir calendario"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 capitalize group-hover:text-rose-500 transition-colors flex items-center gap-1.5">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  <Calendar className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-rose-400" />
                </h3>
                <p className="text-xs text-gray-400">Estado de disponibilidad del equipo</p>
              </div>
              <input 
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(new Date(e.target.value + 'T00:00:00'));
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors border border-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setSelectedDate(startOfToday())}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isSameDay(selectedDate, startOfToday())
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
                    : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                Hoy
              </button>
              
              <div className="relative overflow-hidden">
                <button 
                  className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors border border-gray-100 flex items-center justify-center"
                  title="Abrir calendario"
                >
                  <Calendar className="w-5 h-5" />
                </button>
                <input 
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(new Date(e.target.value + 'T00:00:00'));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              <button 
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors border border-gray-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
              <div className="flex items-center gap-2 mb-1 text-gray-500">
                <UserCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Activos</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.workingToday} <span className="text-gray-400 font-normal text-sm">/ {stats.totalPros}</span></p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
              <div className="flex items-center gap-2 mb-1 text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Ocupación</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.occupancy}%</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
              <div className="flex items-center gap-2 mb-1 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Capacidad</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.totalCapacity} <span className="text-gray-400 font-normal text-sm">slots</span></p>
            </div>
          </div>
        </div>

        <div className="bg-rose-500 p-6 rounded-3xl text-white shadow-xl shadow-rose-200 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Gestión de Equipo</h3>
            <p className="text-rose-100 text-sm mt-1">Configura horarios y bloqueos de todos los profesionales desde un solo lugar.</p>
          </div>
          <button 
            onClick={generateDailyReport}
            className="relative z-10 mt-6 w-full py-3.5 bg-white text-rose-500 rounded-2xl font-bold text-sm hover:bg-rose-50 transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="ri-file-chart-line text-lg"></i>
            Generar Reporte Diario
          </button>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Availability Grid */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="sticky left-0 z-20 bg-gray-50/50 p-4 border-b border-gray-100 text-left min-w-[200px]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profesional</span>
                </th>
                {getTimeSlots().map(slot => (
                  <th key={slot} className="p-4 border-b border-gray-100 text-center min-w-[80px]">
                    <span className="text-[10px] font-bold text-gray-400">{slot}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {professionals.map(pro => (
                <tr key={pro.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-white p-4 border-r border-gray-50">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                          {pro.avatar_url ? (
                            <img src={pro.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{pro.display_name}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-tight ${pro.is_working_today ? 'text-teal-500' : 'text-gray-400'}`}>
                            {pro.is_working_today ? 'En turno' : 'Libre'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setEditingPro(pro.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  {getTimeSlots().map(slot => {
                    const status = getStatus(pro, slot);
                    const slotM = timeToMins(slot);
                    const booking = status === 'booked' ? bookings.find(b => {
                      if (b.professional_id !== pro.id) return false;
                      const bookStart = timeToMins(b.booking_time);
                      const bookEnd = bookStart + (b.total_duration_minutes as number);
                      return slotM >= bookStart && slotM < bookEnd;
                    }) : null;

                    const isStart = booking && slotM === timeToMins(booking.booking_time);
                    const bookEndMins = booking ? timeToMins(booking.booking_time) + (booking.total_duration_minutes as number) : 0;
                    const nextSlotMins = slotM + 30;
                    const isEnd = booking && nextSlotMins >= bookEndMins;

                    return (
                      <td key={slot} className={`p-2 border-r border-gray-50 ${booking ? 'px-0' : ''}`}>
                        <div 
                          onClick={() => {
                            if (status === 'booked' && booking) {
                              setSelectedBooking(booking);
                            } else if (status === 'free') {
                              const slotM2 = timeToMins(slot);
                              // Find next booking for this pro after slot
                              const nextBooking = bookings
                                .filter(b => b.professional_id === pro.id && timeToMins(b.booking_time) > slotM2)
                                .sort((a, b) => timeToMins(a.booking_time) - timeToMins(b.booking_time))[0];
                              // Find next block for this pro after slot
                              const nextBlock = blockedTimes
                                .filter(b => b.profile_id === pro.id && timeToMins(b.start_time) > slotM2)
                                .sort((a, b) => timeToMins(a.start_time) - timeToMins(b.start_time))[0];
                              let limitMins = pro.end_time ? timeToMins(pro.end_time) : 22 * 60;
                              if (nextBooking) limitMins = Math.min(limitMins, timeToMins(nextBooking.booking_time));
                              if (nextBlock) limitMins = Math.min(limitMins, timeToMins(nextBlock.start_time));
                              if (pro.break_start) {
                                const bStartM = timeToMins(pro.break_start);
                                if (bStartM > slotM2) limitMins = Math.min(limitMins, bStartM);
                              }
                              const maxMins = limitMins - slotM2;

                              setCreatingBooking({ proId: pro.id, proName: pro.display_name || pro.name, time: slot, maxMinutes: maxMins });
                            }
                          }}
                          className={`h-12 w-full transition-all hover:scale-[1.02] cursor-pointer flex items-center px-2 overflow-hidden ${
                            status === 'free' ? 'bg-teal-50/50 border border-teal-100 hover:bg-teal-100 rounded-xl' :
                            status === 'booked' ? `bg-rose-500 shadow-md shadow-rose-100 border-y border-rose-600 animate-pulse ${isStart ? 'rounded-l-xl border-l' : ''} ${isEnd ? 'rounded-r-xl border-r' : ''}` :
                            status === 'blocked' ? 'bg-gray-200 border border-gray-300 rounded-xl' :
                            'bg-gray-50/50 opacity-20 cursor-default hover:scale-100 rounded-xl'
                          }`}
                          title={status === 'booked' ? `Cita: ${booking?.client_name}` : status === 'blocked' ? 'Horario bloqueado' : status === 'free' ? 'Crear reserva' : ''}
                        >
                          {status === 'booked' && isStart && (
                            <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">
                              {booking?.client_name}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-4 py-2 bg-gray-100/50 rounded-2xl w-fit">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-teal-500"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bloqueado</span>
        </div>
        <div className="flex items-center gap-2 opacity-30">
          <div className="w-3 h-3 rounded-full bg-gray-200"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No trabaja</span>
        </div>
      </div>

      {/* Admin Schedule Config Modal */}
      {editingPro && (
        <ProfessionalScheduleConfig 
          adminProId={editingPro} 
          onClose={() => {
            setEditingPro(null);
            loadData();
          }} 
        />
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <UserCheck className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cliente</p>
                  <h3 className="text-xl font-bold text-gray-900">{selectedBooking.client_name}</h3>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Servicios</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.booking_services?.map((s: any, i: number) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        {s.service_name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Inicio</p>
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {selectedBooking.booking_time.slice(0, 5)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Se libera a las</p>
                    <div className="flex items-center gap-2 text-rose-600 font-bold">
                      <Sparkles className="w-4 h-4 text-rose-400" />
                      {(() => {
                        const endM = timeToMins(selectedBooking.booking_time) + (selectedBooking.total_duration_minutes as number);
                        return `${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`;
                      })()}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-[0.98]"
                >
                  Cerrar detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {creatingBooking && (
        <AdminNewBookingModal 
          professionalId={creatingBooking.proId}
          professionalName={creatingBooking.proName}
          date={selectedDate}
          startTime={creatingBooking.time}
          maxMinutes={creatingBooking.maxMinutes}
          onClose={() => setCreatingBooking(null)}
          onSuccess={() => {
            setCreatingBooking(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
