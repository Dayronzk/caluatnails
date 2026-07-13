import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, User, Phone, Mail, Clock, Calendar, Sparkles, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

interface AdminNewBookingModalProps {
  professionalId?: string;
  professionalName?: string;
  date?: Date;
  startTime?: string;
  maxMinutes?: number;
  onClose: () => void;
  onSuccess: () => void;
  clientPrefill?: { name: string; phone: string; email: string };
}

export default function AdminNewBookingModal({ 
  professionalId, 
  professionalName, 
  date, 
  startTime, 
  maxMinutes,
  onClose, 
  onSuccess,
  clientPrefill
}: AdminNewBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [showClientResults, setShowClientResults] = useState(false);
  
  // Custom states for when props are not provided
  const [selProId, setSelProId] = useState(professionalId || "");
  const [selDate, setSelDate] = useState(date ? format(date, 'yyyy-MM-dd') : "");
  const [selTime, setSelTime] = useState(startTime || "");
  const [maxMins, setMaxMins] = useState(maxMinutes || 390); // default large limit

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState({
    client_name: clientPrefill?.name || "",
    client_email: clientPrefill?.email || "",
    client_phone: clientPrefill?.phone || "",
    notes: ""
  });

  const [isGuarantee, setIsGuarantee] = useState(false);
  const [guaranteeOriginalBookingId, setGuaranteeOriginalBookingId] = useState("");
  const [guaranteeOriginalProfessionalId, setGuaranteeOriginalProfessionalId] = useState("");
  const [guaranteeReason, setGuaranteeReason] = useState("");
  const [clientBookings, setClientBookings] = useState<any[]>([]);
  const [loadingClientBookings, setLoadingClientBookings] = useState(false);

  const [guaranteeDurationMode, setGuaranteeDurationMode] = useState<"original" | "custom">("original");
  const [guaranteeCustomDuration, setGuaranteeCustomDuration] = useState<number>(30);

  const baseDuration = services
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  const totalDuration = isGuarantee && guaranteeDurationMode === "custom" 
    ? guaranteeCustomDuration 
    : baseDuration;

  const isDurationValid = totalDuration <= maxMins;

  useEffect(() => {
    loadServices();
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .or('role.eq.admin,is_professional.eq.true');
    setProfessionals(data || []);
  };

  useEffect(() => {
    if (!professionalId && selProId && selDate && totalDuration > 0) {
      loadAvailableSlots(selProId, selDate, totalDuration);
    } else {
      setAvailableSlots([]);
    }
  }, [selProId, selDate, totalDuration]);

  const loadAvailableSlots = async (profId: string, dateStr: string, duration: number) => {
    setLoadingSlots(true);
    try {
      const { data: pSettings } = await supabase.from('professional_settings').select('slot_duration_minutes, buffer_minutes, start_time, end_time').eq('profile_id', profId).single();
      const slotSize = pSettings?.slot_duration_minutes || 30;
      const buffer = pSettings?.buffer_minutes || 0;
      const startMins = pSettings?.start_time ? timeToMinutes(pSettings.start_time) : 9 * 60;
      const endMins = pSettings?.end_time ? timeToMinutes(pSettings.end_time) : 19 * 60;

      const dateObj = new Date(dateStr + "T12:00:00");
      const dow = dateObj.getDay(); // JS & DB: 0=Sun, 1=Mon, ..., 6=Sat

      const { data: schedule } = await supabase.from('professional_schedules').select('*').eq('profile_id', profId).eq('day_of_week', dow).single();
      
      if (schedule && !schedule.is_working) {
        setAvailableSlots([]);
        return;
      }

      const dayStart = schedule?.start_time ? timeToMinutes(schedule.start_time) : startMins;
      const dayEnd = schedule?.end_time ? timeToMinutes(schedule.end_time) : endMins;

      const [{ data: bookings }, { data: blocks }] = await Promise.all([
        supabase.from('bookings').select('booking_time, total_duration_minutes').eq('professional_id', profId).eq('booking_date', dateStr).neq('status', 'cancelled'),
        supabase.from('professional_blocked_times').select('start_time, end_time').eq('profile_id', profId).eq('blocked_date', dateStr)
      ]);

      const occupied: { start: number, end: number }[] = [];
      bookings?.forEach(b => {
        const s = timeToMinutes(b.booking_time);
        occupied.push({ start: s, end: s + (b.total_duration_minutes || 30) });
      });
      blocks?.forEach(b => {
        occupied.push({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) });
      });
      
      if (schedule?.break_start && schedule?.break_end) {
         occupied.push({ start: timeToMinutes(schedule.break_start), end: timeToMinutes(schedule.break_end) });
      }

      const slots = [];
      for (let t = dayStart; t + duration <= dayEnd; t += slotSize) {
        const h = Math.floor(t / 60);
        const m = t % 60;
        const slotStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        let conflict = false;
        const tEnd = t + duration + buffer;
        for (const occ of occupied) {
          if (Math.max(t, occ.start) < Math.min(tEnd, occ.end)) {
            conflict = true;
            break;
          }
        }
        if (!conflict) slots.push(slotStr);
      }

      setAvailableSlots(slots);
      
      // Auto-select first available if current selection is invalid
      if (slots.length > 0 && !slots.includes(selTime)) {
        setSelTime(slots[0]);
      } else if (slots.length === 0) {
        setSelTime("");
      }
    } catch (e) {
      console.error(e);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name');
    setServices(data || []);
  };

  const searchClients = async (query: string) => {
    setForm(prev => ({ ...prev, client_name: query }));
    
    if (query.length === 0) {
      // Load recent clients
      const { data } = await supabase
        .from('client_accounts')
        .select('id, name, email, phone')
        .order('created_at', { ascending: false })
        .limit(20);
        
      const deduped: any[] = [];
      (data || []).forEach(c => {
        const pKey = c.phone ? c.phone.replace(/\\D/g, "").slice(-9) : null;
        const eKey = c.email ? c.email.toLowerCase().trim() : null;
        const existing = deduped.find(d => {
          const dpKey = d.phone ? d.phone.replace(/\\D/g, "").slice(-9) : null;
          const deKey = d.email ? d.email.toLowerCase().trim() : null;
          return (pKey && dpKey && pKey === dpKey) || (eKey && deKey && eKey === deKey);
        });
        if (existing) {
          if (!existing.email && c.email) existing.email = c.email;
          if (!existing.phone && c.phone) existing.phone = c.phone;
          if (!existing.name && c.name) existing.name = c.name;
        } else {
          deduped.push({ ...c });
        }
      });
      
      setExistingClients(deduped.slice(0, 5));
      setShowClientResults(true);
      return;
    }

    if (query.length < 2) {
      setExistingClients([]);
      setShowClientResults(false);
      return;
    }

    const { data } = await supabase
      .from('client_accounts')
      .select('id, name, email, phone')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Deduplicate by phone or email to prevent showing ghost duplicates
    const deduped: any[] = [];
    (data || []).forEach(c => {
      const pKey = c.phone ? c.phone.replace(/\\D/g, "").slice(-9) : null;
      const eKey = c.email ? c.email.toLowerCase().trim() : null;
      
      const existing = deduped.find(d => {
        const dpKey = d.phone ? d.phone.replace(/\\D/g, "").slice(-9) : null;
        const deKey = d.email ? d.email.toLowerCase().trim() : null;
        return (pKey && dpKey && pKey === dpKey) || (eKey && deKey && eKey === deKey);
      });

      if (existing) {
        if (!existing.email && c.email) existing.email = c.email;
        if (!existing.phone && c.phone) existing.phone = c.phone;
        if (!existing.name && c.name) existing.name = c.name;
      } else {
        deduped.push({ ...c });
      }
    });

    setExistingClients(deduped.slice(0, 10));
    setShowClientResults(deduped.length > 0);
  };

  const selectClient = (client: any) => {
    setForm({
      ...form,
      client_name: client.name || "",
      client_email: client.email || "",
      client_phone: client.phone || ""
    });
    setShowClientResults(false);
    loadClientBookings(client.phone);
  };

  const loadClientBookings = async (phone: string) => {
    if (!phone) return;
    setLoadingClientBookings(true);
    try {
      const last9 = phone.replace(/\D/g, "").slice(-9);
      const { data } = await supabase
        .from("bookings")
        .select(`
          id, booking_date, booking_time, professional_id, status, total_duration_minutes,
          booking_services(service_id, service_name)
        `)
        .ilike("client_phone", `%${last9}`)
        .eq("status", "completed")
        .order("booking_date", { ascending: false })
        .limit(10);
      setClientBookings(data || []);
    } catch (e) {
      console.error("Error loading client bookings:", e);
    } finally {
      setLoadingClientBookings(false);
    }
  };

  const calculateTotal = () => {
    return services
      .filter(s => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + (s.price || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0 || !isDurationValid) return;
    
    setLoading(true);
    try {
      const totalPrice = isGuarantee ? 0 : calculateTotal();
      const dateStr = selDate;
 
      // 1. Create the booking
      const { data: booking, error: bError } = await supabase
        .from('bookings')
        .insert({
          professional_id: selProId,
          professional_name_snapshot: (() => {
            const matched = professionals.find(p => p.id === selProId);
            return matched?.display_name?.trim() || matched?.name?.trim() || professionalName?.trim() || null;
          })(),
          booking_date: dateStr,
          booking_time: selTime,
          client_name: form.client_name,
          client_email: form.client_email || null,
          client_phone: form.client_phone,
          total_duration_minutes: totalDuration,
          total_price: totalPrice,
          status: 'confirmed', // Admin bookings are confirmed by default
          deposit_paid: true,
          deposit_amount: 0,
          notes: form.notes,
          booking_source: 'admin',
          is_guarantee: isGuarantee,
          guarantee_original_booking_id: isGuarantee ? guaranteeOriginalBookingId || null : null,
          guarantee_original_professional_id: isGuarantee ? guaranteeOriginalProfessionalId || null : null,
          guarantee_reason: isGuarantee ? guaranteeReason : null,
        })
        .select()
        .single();
 
      if (bError) throw bError;
 
      // 2. Link services
      const bookingServices = selectedServices.map(sid => {
        const s = services.find(srv => srv.id === sid);
        return {
          booking_id: booking.id,
          service_id: sid,
          service_name: isGuarantee ? `Garantía - Reparación de ${s.name}` : s.name,
          price_at_booking: isGuarantee ? 0.00 : s.price
        };
      });
 
      const { error: sError } = await supabase
        .from('booking_services')
        .insert(bookingServices);

      if (sError) throw sError;

      onSuccess();
    } catch (err) {
      console.error("Error creating booking:", err);
      alert("Error al crear la reserva. Por favor, revisa los datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300 max-h-[95vh]">
        {/* Left Side: Summary */}
        <div className="bg-rose-500 p-6 md:p-8 text-white md:w-72 flex flex-col justify-between shrink-0">
          <div>
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl md:text-2xl font-black mb-1 md:mb-2 flex items-center justify-between">
              Nueva Reserva
              <Sparkles className="w-5 h-5 md:hidden" />
            </h2>
            <p className="text-rose-100 text-xs md:text-sm hidden md:block">Gestiona una cita manual para tu equipo de forma rápida.</p>
          </div>

          <div className="space-y-2 md:space-y-4 mt-4 md:mt-8">
            <div className="flex items-center gap-3 w-full">
              <User className="w-4 h-4 opacity-60 shrink-0" />
              {professionalId ? (
                <span className="text-sm font-bold">{professionalName}</span>
              ) : (
                <select 
                  value={selProId}
                  onChange={e => setSelProId(e.target.value)}
                  className="bg-transparent text-sm font-bold outline-none border-b border-white/30 focus:border-white pb-1 w-full truncate"
                >
                  <option value="" className="text-gray-900">Profesional...</option>
                  {professionals.map(p => <option key={p.id} value={p.id} className="text-gray-900">{p.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex items-center gap-3 w-full">
              <Calendar className="w-4 h-4 opacity-60 shrink-0" />
              {date ? (
                <span className="text-sm font-bold capitalize">{format(date, "EEEE, d MMM", { locale: es })}</span>
              ) : (
                <input 
                  type="date"
                  value={selDate}
                  onChange={e => setSelDate(e.target.value)}
                  className="bg-transparent text-sm font-bold outline-none border-b border-white/30 focus:border-white pb-1 w-full"
                  style={{ colorScheme: 'dark' }}
                />
              )}
            </div>
            <div className="flex items-center gap-3 w-full">
              <Clock className="w-4 h-4 opacity-60 shrink-0" />
              {startTime ? (
                <span className="text-sm font-bold">{startTime} hs</span>
              ) : (
                <select 
                  value={selTime}
                  onChange={e => setSelTime(e.target.value)}
                  disabled={loadingSlots || totalDuration === 0 || !selProId || !selDate}
                  className="bg-transparent text-sm font-bold outline-none border-b border-white/30 focus:border-white pb-1 w-full disabled:opacity-50"
                >
                  <option value="" className="text-gray-900">
                    {totalDuration === 0 ? "Elige servicios..." : loadingSlots ? "Cargando..." : "Horario..."}
                  </option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot} className="text-gray-900">{slot} hs</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="mt-6 md:mt-12 pt-4 md:pt-8 border-t border-white/20 flex md:block items-end justify-between">
            <div className="flex flex-col">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 md:mb-2">Total Estimado</p>
              <p className="text-2xl md:text-4xl font-black">{isGuarantee ? 0 : calculateTotal()}€</p>
            </div>
            <div className={`p-2 md:p-3 rounded-xl flex items-center gap-2 max-w-[140px] md:max-w-none md:mt-2 ${isDurationValid ? 'bg-white/10' : 'bg-red-600 animate-bounce'}`}>
              <Clock className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase">Duración: {totalDuration} min</p>
                <p className="text-[9px] opacity-70">Límite: {maxMins} min</p>
              </div>
            </div>
            {!isDurationValid && (
              <p className="text-[10px] font-bold text-white mt-2 bg-red-600 p-2 rounded-lg text-center">
                ⚠️ Excede el tiempo disponible
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-6 md:p-8 bg-white overflow-y-auto">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-lg font-bold text-gray-900">Datos del Cliente</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="relative group">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Nombre del Cliente</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                  <input
                    required
                    type="text"
                    value={form.client_name}
                    onChange={e => searchClients(e.target.value)}
                    onFocus={() => searchClients(form.client_name)}
                    onBlur={() => setTimeout(() => setShowClientResults(false), 200)}
                    placeholder="Ej: María García"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm"
                  />
                  
                  {/* Client Search Results Dropdown */}
                  {showClientResults && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {existingClients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => selectClient(client)}
                          className="w-full px-4 py-3 text-left hover:bg-rose-50 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-rose-600 transition-colors">{client.name}</p>
                            <p className="text-[10px] text-gray-400">{client.phone} · {client.email}</p>
                          </div>
                          <Check className="w-4 h-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                    <input
                      required
                      type="tel"
                      value={form.client_phone}
                      onChange={e => setForm({...form, client_phone: e.target.value})}
                      placeholder="+34 600 000 000"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm"
                    />
                  </div>
                </div>
                <div className="relative group">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Email (Opcional)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                    <input
                      type="email"
                      value={form.client_email}
                      onChange={e => setForm({...form, client_email: e.target.value})}
                      placeholder="email@ejemplo.com"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                Servicios Disponibles ({maxMins - totalDuration} min libres)
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {services
                  .filter(s => 
                    selectedServices.includes(s.id) || 
                    (s.duration_minutes || 0) <= (maxMins - totalDuration)
                  )
                  .map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (selectedServices.includes(s.id)) {
                        setSelectedServices(selectedServices.filter(id => id !== s.id));
                      } else {
                        setSelectedServices([...selectedServices, s.id]);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      selectedServices.includes(s.id)
                        ? "bg-rose-50 border-rose-200"
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        selectedServices.includes(s.id) ? "bg-rose-500 border-rose-500" : "border-gray-300"
                      }`}>
                        {selectedServices.includes(s.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">{s.name}</p>
                        <p className="text-[9px] text-gray-400 font-medium">{s.duration_minutes} minutos</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-rose-500">{s.price}€</span>
                  </button>
                ))}
                {services.filter(s => !selectedServices.includes(s.id) && (s.duration_minutes || 0) > (maxMins - totalDuration)).length > 0 && (
                  <p className="text-[10px] text-gray-400 italic mt-2 text-center">
                    * Algunos servicios se han ocultado por falta de tiempo disponible
                  </p>
                )}
              </div>
            </div>

            {/* Garantía Checkbox & Fields */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const newVal = !isGuarantee;
                    setIsGuarantee(newVal);
                    if (newVal && form.client_phone) {
                      loadClientBookings(form.client_phone);
                    }
                  }}
                  className={`w-11 h-6 rounded-full transition-all cursor-pointer relative flex-shrink-0 ${isGuarantee ? "bg-rose-500" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isGuarantee ? "left-6" : "left-1"}`} />
                </button>
                <div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">¿Es cita de Garantía?</span>
                  <p className="text-[10px] text-gray-400">Esta cita se agendará de forma gratuita para una reparación.</p>
                </div>
              </div>

              {isGuarantee && (
                <div className="space-y-3 pt-2 border-t border-gray-200/50">
                  {/* Past bookings dropdown */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                      Seleccionar Cita Original
                    </label>
                    {loadingClientBookings ? (
                      <p className="text-xs text-gray-400">Cargando citas del cliente...</p>
                    ) : clientBookings.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No se encontraron citas completadas recientes.</p>
                    ) : (
                      <select
                        value={guaranteeOriginalBookingId}
                        onChange={e => {
                          const bId = e.target.value;
                          setGuaranteeOriginalBookingId(bId);
                          const originalB = clientBookings.find(cb => cb.id === bId);
                          if (originalB) {
                            setGuaranteeOriginalProfessionalId(originalB.professional_id || "");
                            const serviceIds = originalB.booking_services
                              ?.map((s: any) => s.service_id)
                              .filter(Boolean) || [];
                            if (serviceIds.length > 0) {
                              setSelectedServices(serviceIds);
                            }
                          } else {
                            setGuaranteeOriginalProfessionalId("");
                            setSelectedServices([]);
                          }
                        }}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white cursor-pointer"
                      >
                        <option value="">Seleccionar cita original...</option>
                        {clientBookings.map(cb => (
                          <option key={cb.id} value={cb.id}>
                            {cb.booking_date} ({cb.booking_time}) - {cb.booking_services.map((s: any) => s.service_name).join(", ")}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Responsible Professional */}
                  {guaranteeOriginalBookingId && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        Profesional Responsable Original
                      </label>
                      <select
                        value={guaranteeOriginalProfessionalId}
                        onChange={e => setGuaranteeOriginalProfessionalId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white cursor-pointer"
                      >
                        <option value="">Seleccionar responsable...</option>
                        {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Duration Selection */}
                  {guaranteeOriginalBookingId && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        Duración de la Reparación
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setGuaranteeDurationMode("original")}
                          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                            guaranteeDurationMode === "original"
                              ? "bg-rose-50 border-rose-200 text-rose-600"
                              : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          Tiempo Original ({baseDuration} min)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuaranteeDurationMode("custom")}
                          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                            guaranteeDurationMode === "custom"
                              ? "bg-rose-50 border-rose-200 text-rose-600"
                              : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          Tiempo Personalizado
                        </button>
                      </div>
                      
                      {guaranteeDurationMode === "custom" && (
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            type="number"
                            min="5"
                            step="5"
                            value={guaranteeCustomDuration || ""}
                            onChange={e => setGuaranteeCustomDuration(parseInt(e.target.value) || 0)}
                            onBlur={e => {
                              if (!e.target.value || parseInt(e.target.value) < 5) {
                                setGuaranteeCustomDuration(5);
                              }
                            }}
                            className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
                          />
                          <span className="text-xs text-gray-500 font-medium">minutos</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                      Motivo / Detalle de la Garantía
                    </label>
                    <input
                      type="text"
                      value={guaranteeReason}
                      onChange={e => setGuaranteeReason(e.target.value)}
                      placeholder="Ej: Se partió la uña del dedo medio"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Notas Internas</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Añade cualquier detalle relevante para el profesional..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm min-h-[80px] resize-none"
              />
            </div>

            <button
              disabled={loading || selectedServices.length === 0 || !isDurationValid || !selProId || !selDate || !selTime}
              type="submit"
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? "Creando Reserva..." : !isDurationValid ? "Tiempo Excedido" : "Confirmar Nueva Reserva"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
