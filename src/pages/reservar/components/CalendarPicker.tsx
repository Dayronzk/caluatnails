import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Professional {
  profile_id: string;
  display_name: string | null;
  bio: string | null;
  photo_url: string | null;
  slot_duration_minutes: number;
  buffer_minutes: number;
  profile_name: string | null;
  address: string | null;
  instagram: string | null;
}

interface Companion {
  id: string;
  name: string;
  phone: string;
  services: { id: string; duration_minutes: number }[];
  professionalId: string;
}

interface Props {
  totalMinutes: number;
  selectedDate: string;
  selectedTime: string;
  selectedProfessionalId: string;
  onSelect: (date: string, time: string, professionalId: string) => void;
  selectedServices?: { id: string }[];
  companions?: Companion[];
  bookingMode?: "simultaneous" | "consecutive";
  setBookingMode?: (mode: "simultaneous" | "consecutive") => void;
  onAssignProfessionals?: (assignments: { [clientId: string]: string }) => void;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

const DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function CalendarPicker({
  totalMinutes,
  selectedDate,
  selectedTime,
  selectedProfessionalId,
  onSelect,
  selectedServices = [],
  companions = [],
  bookingMode = "simultaneous",
  setBookingMode,
  onAssignProfessionals,
}: Props) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingProfs, setLoadingProfs] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [monthBookedSlots, setMonthBookedSlots] = useState<Record<string, Record<string, string[]>>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);

  useEffect(() => {
    loadProfessionals();
  }, [selectedServices]);

  useEffect(() => {
    if (selectedDate) {
      loadBookedSlots(selectedDate);
    }
  }, [selectedDate]);

const DEFAULT_CALUATNAILS_PROFESSIONALS: Professional[] = [
  {
    profile_id: "prof-karol",
    display_name: "Karol",
    bio: "Master Stylist & Fundadora · Especialista en Manicura Rusa, Gel y Arquitectura Ungueal (+10 años exp.)",
    photo_url: "/assets/manicure-premium.png",
    slot_duration_minutes: 30,
    buffer_minutes: 10,
    profile_name: "Karol",
    address: "Calle Padilla 301, Barcelona",
    instagram: "@caluatnails",
  },
  {
    profile_id: "prof-eidy",
    display_name: "Eidy",
    bio: "Especialista Técnica & Nail Art · Experta en Semipermanente y Pedicura Spa (+6 años exp.)",
    photo_url: "/assets/manicure-pastel.jpg",
    slot_duration_minutes: 30,
    buffer_minutes: 10,
    profile_name: "Eidy",
    address: "Calle Padilla 301, Barcelona",
    instagram: "@caluatnails",
  },
  {
    profile_id: "prof-maryuri",
    display_name: "Maryuri",
    bio: "Estilista de la Mirada & Piel · Especialista en Lifting de Pestañas, Cejas y Depilación con Hilo (+5 años exp.)",
    photo_url: "/assets/extensions-premium.png",
    slot_duration_minutes: 30,
    buffer_minutes: 10,
    profile_name: "Maryuri",
    address: "Calle Padilla 301, Barcelona",
    instagram: "@caluatnails",
  },
];

  const loadProfessionals = async () => {
    setLoadingProfs(true);
    try {
      const { data: settings } = await supabase
        .from("professional_settings")
        .select("profile_id, display_name, bio, photo_url, slot_duration_minutes, buffer_minutes")
        .eq("is_active", true);

      const { data: certifiedProfs } = await supabase
        .from("professional_profiles")
        .select("user_id, bio, specialties, instagram, rating, address")
        .eq("active", true);

      const settingsIds = (settings ?? []).map((s: { profile_id: string }) => s.profile_id);
      const certifiedIds = (certifiedProfs ?? [])
        .map((p: { user_id: string }) => p.user_id)
        .filter((id: string) => !settingsIds.includes(id));

      const allIds = [...settingsIds, ...certifiedIds];

      if (allIds.length === 0) {
        setProfessionals(DEFAULT_CALUATNAILS_PROFESSIONALS);
        setLoadingProfs(false);
        return;
      }

      const { data: profServices } = await supabase
        .from("professional_services")
        .select("profile_id, service_id")
        .in("profile_id", allIds);

      const profToServices: Record<string, string[]> = {};
      (profServices ?? []).forEach((ps: any) => {
        if (!profToServices[ps.profile_id]) profToServices[ps.profile_id] = [];
        profToServices[ps.profile_id].push(ps.service_id);
      });

      const selectedServiceIds = selectedServices.map(s => s.id);
      const validIds = allIds.filter(id => {
        if (selectedServiceIds.length === 0) return true;
        const assigned = profToServices[id] || [];
        if (assigned.length === 0) return true; // Si no tiene restricciones asignadas, lo consideramos disponible
        return selectedServiceIds.every(sid => assigned.includes(sid));
      });

      const idsToFetch = validIds.length > 0 ? validIds : allIds;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", idsToFetch);

      const fromSettings: Professional[] = (settings ?? [])
        .filter((s: any) => idsToFetch.includes(s.profile_id))
        .map((s: {
        profile_id: string; display_name: string | null; bio: string | null;
        photo_url: string | null; slot_duration_minutes: number; buffer_minutes: number;
      }) => {
        const cp = (certifiedProfs ?? []).find((p: { user_id: string }) => p.user_id === s.profile_id);
        return {
          profile_id: s.profile_id,
          display_name: s.display_name,
          bio: s.bio,
          photo_url: s.photo_url,
          slot_duration_minutes: s.slot_duration_minutes ?? 30,
          buffer_minutes: s.buffer_minutes ?? 10,
          profile_name: profiles?.find((p: { id: string; name: string | null }) => p.id === s.profile_id)?.name ?? null,
          address: cp?.address ?? null,
          instagram: cp?.instagram ?? null,
        };
      });

      const fromCertified: Professional[] = certifiedIds
        .filter((uid: string) => idsToFetch.includes(uid))
        .map((uid: string) => {
        const cp = (certifiedProfs ?? []).find((p: { user_id: string }) => p.user_id === uid);
        const profileName = profiles?.find((p: { id: string; name: string | null }) => p.id === uid)?.name ?? null;
        return {
          profile_id: uid,
          display_name: profileName,
          bio: cp?.bio ?? null,
          photo_url: null,
          slot_duration_minutes: 30,
          buffer_minutes: 10,
          profile_name: profileName,
          address: cp?.address ?? null,
          instagram: cp?.instagram ?? null,
        };
      });

      const fetchedList = [...fromSettings, ...fromCertified];
      const finalProfs = fetchedList.length > 0 ? fetchedList : DEFAULT_CALUATNAILS_PROFESSIONALS;
      setProfessionals(finalProfs);

      // Auto-seleccionar profesional si viene por parámetro URL
      const urlParams = new URLSearchParams(window.location.search);
      const paramProf = urlParams.get("profesional");
      if (paramProf) {
        const match = finalProfs.find(p => 
          (p.display_name || p.profile_name || "").toLowerCase().includes(paramProf.toLowerCase())
        );
        if (match && !selectedProfessionalId) {
          onSelect(selectedDate, selectedTime, match.profile_id);
        }
      }
    } catch {
      setProfessionals(DEFAULT_CALUATNAILS_PROFESSIONALS);
    } finally {
      setLoadingProfs(false);
    }
  };

  const loadBookedSlots = async (date: string) => {
    setLoadingSlots(true);
    const [{ data: bookingsData }, { data: blockedData }] = await Promise.all([
      supabase
        .from("bookings")
        .select("booking_time, total_duration_minutes, professional_id")
        .eq("booking_date", date)
        .neq("status", "cancelled"),
      supabase
        .from("professional_blocked_times")
        .select("profile_id, start_time, end_time")
        .eq("blocked_date", date),
    ]);

    const slotMap: Record<string, string[]> = {};
    const addOccupied = (profId: any, fromMin: number, toMin: number) => {
      const id = String(profId || "any").toLowerCase();
      if (!slotMap[id]) slotMap[id] = [];
      for (let t = fromMin; t < toMin; t += 15) {
        const h = Math.floor(t / 60);
        const m = t % 60;
        slotMap[id].push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    };

    (bookingsData ?? []).forEach(b => {
      const duration = b.total_duration_minutes || 30;
      addOccupied(b.professional_id, timeToMinutes(b.booking_time), timeToMinutes(b.booking_time) + duration);
    });

    (blockedData ?? []).forEach((b: any) => {
      addOccupied(b.profile_id, timeToMinutes(b.start_time), timeToMinutes(b.end_time));
    });

    setBookedSlots(slotMap);
    setLoadingSlots(false);
  };

  const loadMonthData = async () => {
    if (professionals.length === 0) return;
    setLoadingMonth(true);
    const firstDay = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
    const lastDay = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${new Date(viewYear, viewMonth + 1, 0).getDate()}`;

    const [{ data: bookingsData }, { data: blockedData }] = await Promise.all([
      supabase
        .from("bookings")
        .select("booking_date, booking_time, total_duration_minutes, professional_id")
        .gte("booking_date", firstDay)
        .lte("booking_date", lastDay)
        .neq("status", "cancelled"),
      supabase
        .from("professional_blocked_times")
        .select("blocked_date, profile_id, start_time, end_time")
        .gte("blocked_date", firstDay)
        .lte("blocked_date", lastDay),
    ]);

    const monthMap: Record<string, Record<string, string[]>> = {};
    const ensureDay = (date: string, profId: string) => {
      if (!monthMap[date]) monthMap[date] = {};
      if (!monthMap[date][profId]) monthMap[date][profId] = [];
    };
    const addOccupied = (date: string, profId: any, fromMin: number, toMin: number) => {
      const id = String(profId || "any").toLowerCase();
      ensureDay(date, id);
      for (let t = fromMin; t < toMin; t += 15) {
        const h = Math.floor(t / 60);
        const m = t % 60;
        monthMap[date][id].push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    };

    (bookingsData ?? []).forEach(b => {
      const duration = b.total_duration_minutes || 30;
      addOccupied(b.booking_date, b.professional_id, timeToMinutes(b.booking_time), timeToMinutes(b.booking_time) + duration);
    });
    (blockedData ?? []).forEach((b: any) => {
      addOccupied(b.blocked_date, b.profile_id, timeToMinutes(b.start_time), timeToMinutes(b.end_time));
    });

    setMonthBookedSlots(monthMap);
    setLoadingMonth(false);
  };

  useEffect(() => { loadMonthData(); }, [professionals, viewMonth, viewYear]);

  const [profSchedules, setProfSchedules] = useState<Record<string, { day_of_week: number; is_working: boolean; start_time: string; end_time: string; break_start?: string | null; break_end?: string | null }[]>>({});

  useEffect(() => {
    if (professionals.length === 0) return;
    const loadSchedules = async () => {
      const profIds = professionals.map(p => p.profile_id);
      const { data } = await supabase
        .from("professional_schedules")
        .select("profile_id, day_of_week, is_working, start_time, end_time, break_start, break_end")
        .in("profile_id", profIds);

      const map: Record<string, { day_of_week: number; is_working: boolean; start_time: string; end_time: string; break_start?: string | null; break_end?: string | null }[]> = {};
      (data ?? []).forEach(s => {
        if (!map[s.profile_id]) map[s.profile_id] = [];
        map[s.profile_id].push(s);
      });
      setProfSchedules(map);
    };
    loadSchedules();
  }, [professionals]);

  const getAvailableSlotsForProf = (prof: Professional, date: string, bookedData: Record<string, string[]>, duration: number = totalMinutes): string[] => {
    if (!date) return [];
    const dateObj = new Date(date + "T12:00:00");
    const dow = dateObj.getDay();
    const schedules = profSchedules[prof.profile_id];
    
    let startMin = 9 * 60;
    let endMin = 19 * 60;
    let isWorking = dow >= 1 && dow <= 6;

    let breakStartMin = -1;
    let breakEndMin = -1;

    if (schedules && schedules.length > 0) {
      const daySched = schedules.find(s => s.day_of_week === dow);
      isWorking = daySched?.is_working ?? false;
      if (isWorking) {
        if (daySched?.start_time) startMin = timeToMinutes(daySched.start_time.slice(0, 5));
        if (daySched?.end_time) endMin = timeToMinutes(daySched.end_time.slice(0, 5));
        if (daySched?.break_start && daySched?.break_end) {
          breakStartMin = timeToMinutes(daySched.break_start.slice(0, 5));
          breakEndMin = timeToMinutes(daySched.break_end.slice(0, 5));
        }
      }
    } else if (dow === 0) {
      isWorking = false;
    }

    if (!isWorking) return [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const nowMinutes = date === todayStr ? now.getHours() * 60 + now.getMinutes() : 0;

    const slotSize = prof.slot_duration_minutes || 30;
    const buffer = prof.buffer_minutes || 0;
    
    const profIdKey = String(prof.profile_id).toLowerCase();
    const occupied = [...(bookedData[profIdKey] ?? []), ...(bookedData["any"] ?? [])];
    const slots: string[] = [];

    for (let t = startMin; t + duration <= endMin; t += slotSize) {
      if (t < nowMinutes) continue;

      if (breakStartMin >= 0 && breakEndMin > breakStartMin) {
        const slotEnd = t + duration;
        if (t < breakEndMin && slotEnd > breakStartMin) continue;
      }

      let conflict = false;
      for (let check = t; check < t + duration + buffer; check += 15) {
        const ch = Math.floor(check / 60);
        const cm = check % 60;
        const checkStr = `${String(ch).padStart(2, "0")}:${String(cm).padStart(2, "0")}`;
        if (occupied.includes(checkStr)) { 
          conflict = true; 
          break; 
        }
      }
      
      if (!conflict) {
        const h = Math.floor(t / 60);
        const m = t % 60;
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return slots;
  };

  const isProfFreeAtTime = (
    prof: Professional,
    date: string,
    time: string,
    duration: number,
    bookedData: Record<string, string[]>
  ): boolean => {
    const dow = new Date(date).getDay();
    let startMin = 540;
    let endMin = 1200;
    let isWorking = dow >= 1 && dow <= 6;
    let breakStartMin = -1;
    let breakEndMin = -1;

    const schedules = profSchedules[prof.profile_id];
    if (schedules && schedules.length > 0) {
      const daySched = schedules.find(s => s.day_of_week === dow);
      isWorking = daySched?.is_working ?? false;
      if (isWorking) {
        if (daySched?.start_time) startMin = timeToMinutes(daySched.start_time.slice(0, 5));
        if (daySched?.end_time) endMin = timeToMinutes(daySched.end_time.slice(0, 5));
        if (daySched?.break_start && daySched?.break_end) {
          breakStartMin = timeToMinutes(daySched.break_start.slice(0, 5));
          breakEndMin = timeToMinutes(daySched.break_end.slice(0, 5));
        }
      }
    } else if (dow === 0) {
      isWorking = false;
    }

    if (!isWorking) return false;

    const t = timeToMinutes(time);
    const buffer = prof.buffer_minutes || 0;
    
    if (t < startMin || t + duration > endMin) return false;

    if (breakStartMin >= 0 && breakEndMin > breakStartMin) {
      const slotEnd = t + duration;
      if (t < breakEndMin && slotEnd > breakStartMin) return false;
    }

    const profIdKey = String(prof.profile_id).toLowerCase();
    const occupied = [...(bookedData[profIdKey] ?? []), ...(bookedData["any"] ?? [])];

    for (let check = t; check < t + duration + buffer; check += 15) {
      const ch = Math.floor(check / 60);
      const cm = check % 60;
      const checkStr = `${String(ch).padStart(2, "0")}:${String(cm).padStart(2, "0")}`;
      if (occupied.includes(checkStr)) {
        return false;
      }
    }

    return true;
  };

  const getClientsList = () => {
    const list = [{ id: "main", duration: totalMinutes }];
    companions.forEach(c => {
      const dur = c.services.reduce((sum, s) => sum + s.duration_minutes, 0);
      list.push({ id: c.id, duration: dur });
    });
    return list;
  };

  const findSimultaneousAssignment = (
    time: string,
    clients: { id: string; duration: number }[],
    clientIdx: number,
    date: string,
    bookedData: Record<string, string[]>,
    assignments: Record<string, string>,
    forMainProfId?: string
  ): boolean => {
    if (clientIdx === clients.length) return true;
    const client = clients[clientIdx];

    if (clientIdx === 0 && forMainProfId) {
      const prof = professionals.find(p => p.profile_id === forMainProfId);
      if (!prof) return false;
      const isFree = isProfFreeAtTime(prof, date, time, client.duration, bookedData);
      if (isFree) {
        assignments[client.id] = prof.profile_id;
        if (findSimultaneousAssignment(time, clients, clientIdx + 1, date, bookedData, assignments, forMainProfId)) {
          return true;
        }
        delete assignments[client.id];
      }
      return false;
    }

    for (const prof of professionals) {
      if (Object.values(assignments).includes(prof.profile_id)) continue;
      const isFree = isProfFreeAtTime(prof, date, time, client.duration, bookedData);
      if (isFree) {
        assignments[client.id] = prof.profile_id;
        if (findSimultaneousAssignment(time, clients, clientIdx + 1, date, bookedData, assignments, forMainProfId)) {
          return true;
        }
        delete assignments[client.id];
      }
    }
    return false;
  };

  const getSimultaneousSlotsOnDate = (
    date: string,
    bookedData: Record<string, string[]>,
    forMainProfId?: string
  ): { time: string; assignments: Record<string, string> }[] => {
    const clients = getClientsList();
    if (professionals.length < clients.length) return [];

    const candidateTimes: string[] = [];
    const dow = new Date(date).getDay();
    let startMin = 540;
    let endMin = 1200;
    let isWorking = dow >= 1 && dow <= 6;

    const mainProf = forMainProfId
      ? professionals.find(p => p.profile_id === forMainProfId)
      : professionals[0];

    if (mainProf) {
      const schedules = profSchedules[mainProf.profile_id];
      if (schedules && schedules.length > 0) {
        const daySched = schedules.find(s => s.day_of_week === dow);
        isWorking = daySched?.is_working ?? false;
        if (isWorking) {
          if (daySched?.start_time) startMin = timeToMinutes(daySched.start_time.slice(0, 5));
          if (daySched?.end_time) endMin = timeToMinutes(daySched.end_time.slice(0, 5));
        }
      } else if (dow === 0) {
        isWorking = false;
      }
    }

    if (!isWorking) return [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const nowMinutes = date === todayStr ? now.getHours() * 60 + now.getMinutes() : 0;

    for (let t = startMin; t < endMin; t += 15) {
      if (t < nowMinutes) continue;
      const h = Math.floor(t / 60);
      const m = t % 60;
      candidateTimes.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }

    const results: { time: string; assignments: Record<string, string> }[] = [];

    candidateTimes.forEach(time => {
      const assignments: Record<string, string> = {};
      if (findSimultaneousAssignment(time, clients, 0, date, bookedData, assignments, forMainProfId)) {
        results.push({ time, assignments });
      }
    });

    return results.sort((a, b) => a.time.localeCompare(b.time));
  };

  const hasAvailabilityOnDate = (date: string): boolean => {
    if (professionals.length === 0) return true;
    const dayOccupied = monthBookedSlots[date] ?? {};
    if (companions && companions.length > 0) {
      if (bookingMode === "simultaneous") {
        return getSimultaneousSlotsOnDate(date, dayOccupied).length > 0;
      } else {
        const companionDuration = companions.reduce((acc, c) => acc + c.services.reduce((sum, s) => sum + s.duration_minutes, 0), 0);
        return professionals.some(prof => getAvailableSlotsForProf(prof, date, dayOccupied, totalMinutes + companionDuration).length > 0);
      }
    }
    return professionals.some(prof => getAvailableSlotsForProf(prof, date, dayOccupied, totalMinutes).length > 0);
  };

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  let startDow = firstDayOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isDateDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const formatDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const displayDate = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
    : null;

  const availableProfsOnDate = selectedDate
    ? professionals.filter(p => {
        if (companions && companions.length > 0 && bookingMode === "simultaneous") {
          return getSimultaneousSlotsOnDate(selectedDate, bookedSlots, p.profile_id).length > 0;
        } else if (companions && companions.length > 0 && bookingMode === "consecutive") {
          const companionDuration = companions.reduce((acc, c) => acc + c.services.reduce((sum, s) => sum + s.duration_minutes, 0), 0);
          return getAvailableSlotsForProf(p, selectedDate, bookedSlots, totalMinutes + companionDuration).length > 0;
        } else {
          return getAvailableSlotsForProf(p, selectedDate, bookedSlots, totalMinutes).length > 0;
        }
      })
    : [];

  const selectedProf = professionals.find(p => p.profile_id === selectedProfessionalId);
  const slotsForSelectedProf = selectedDate && selectedProf
    ? (companions && companions.length > 0 && bookingMode === "simultaneous"
       ? getSimultaneousSlotsOnDate(selectedDate, bookedSlots, selectedProfessionalId)
           .map(slot => slot.time)
       : getAvailableSlotsForProf(selectedProf, selectedDate, bookedSlots, companions && companions.length > 0 && bookingMode === "consecutive" ? totalMinutes + companions.reduce((acc, c) => acc + c.services.reduce((sum, s) => sum + s.duration_minutes, 0), 0) : totalMinutes)
      )
    : [];

  return (
    <div className="space-y-8">
      {/* Companion Mode Selector */}
      {companions && companions.length > 0 && setBookingMode && bookingMode && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-rose-100/70 p-6 shadow-soft-sm space-y-4">
          <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <i className="ri-group-line text-base"></i>
            </span>
            ¿Cómo queréis organizar vuestra cita?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setBookingMode("simultaneous")}
              className={`flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer ${
                bookingMode === "simultaneous"
                  ? "border-rose-400 bg-gradient-to-br from-rose-50/80 to-white shadow-soft-sm scale-[1.01]"
                  : "border-rose-100/60 bg-white hover:border-rose-200 shadow-soft-xs"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                bookingMode === "simultaneous" ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-xs" : "bg-rose-50 text-rose-500"
              }`}>
                <i className="ri-flashlight-line text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">A la vez (Simultánea)</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Atención en paralelo por distintas estilistas. Ideal para optimizar tiempo.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookingMode("consecutive")}
              className={`flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer ${
                bookingMode === "consecutive"
                  ? "border-rose-400 bg-gradient-to-br from-rose-50/80 to-white shadow-soft-sm scale-[1.01]"
                  : "border-rose-100/60 bg-white hover:border-rose-200 shadow-soft-xs"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                bookingMode === "consecutive" ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-xs" : "bg-rose-50 text-rose-500"
              }`}>
                <i className="ri-time-line text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">Una tras otra (Consecutiva)</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  La misma estilista os atiende en bloque seguido. Ideal para disfrutar juntas.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Calendar & Professionals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-4xl border border-rose-100/70 p-6 sm:p-7 shadow-soft-sm">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-50/60 hover:bg-rose-100/80 text-rose-600 transition-all duration-300 cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-xl font-bold"></i>
            </button>
            <h3 className="font-bold text-gray-900 text-lg capitalize font-playfair">
              {MONTHS[viewMonth]} {viewYear}
            </h3>
            <button
              onClick={nextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-50/60 hover:bg-rose-100/80 text-rose-600 transition-all duration-300 cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-xl font-bold"></i>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-rose-400 py-1 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: startDow }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateStr(day);
              const isPast = isDateDisabled(day);
              const noAvailability = !isPast && !loadingMonth && !hasAvailabilityOnDate(dateStr);
              const disabled = isPast || noAvailability;
              const isSelected = dateStr === selectedDate;
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              
              return (
                <button
                  key={day}
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      onSelect(dateStr, "", selectedProfessionalId);
                    }
                  }}
                  className={`h-10 sm:h-11 w-full rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer flex flex-col items-center justify-center ${
                    isPast
                      ? "text-gray-300 cursor-not-allowed opacity-50"
                      : noAvailability
                      ? "text-gray-300 bg-gray-50/50 cursor-not-allowed line-through"
                      : isSelected
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-sm scale-105 font-bold"
                      : isToday
                      ? "border-2 border-rose-300 text-rose-700 bg-rose-50/40 font-bold hover:bg-rose-100/60"
                      : "text-gray-700 hover:bg-rose-50/70 hover:text-rose-600"
                  }`}
                >
                  <span>{day}</span>
                  {isSelected && (
                    <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-rose-400 mt-5 text-center font-medium">
            {selectedDate ? "✨ Día seleccionado correctamente" : "Elige un día con fecha destacada"}
          </p>
        </div>

        {/* Professionals Column */}
        <div>
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg">
              {displayDate ? `Profesionales disponibles` : "Selecciona primero un día"}
            </h3>
            {displayDate && (
              <p className="text-xs sm:text-sm text-rose-600/80 font-medium capitalize mt-1">
                {displayDate} · {companions && companions.length > 0 ? `Duración total: ${formatDuration(totalMinutes + companions.reduce((acc, c) => acc + c.services.reduce((sum, s) => sum + s.duration_minutes, 0), 0))}` : formatDuration(totalMinutes)}
              </p>
            )}
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-64 text-center bg-white/60 backdrop-blur-sm rounded-4xl border border-rose-100/50 p-6">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                <i className="ri-calendar-event-line text-2xl text-rose-400"></i>
              </div>
              <p className="text-sm font-semibold text-gray-700">Elige una fecha en el calendario</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                Te mostraremos las estilistas libres y sus horarios disponibles.
              </p>
            </div>
          ) : loadingProfs || loadingSlots ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-3xl bg-rose-50/50 animate-pulse" />
              ))}
            </div>
          ) : availableProfsOnDate.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center bg-white/90 backdrop-blur-sm rounded-4xl border border-rose-100/70 p-6 shadow-soft-xs">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                <i className="ri-calendar-close-line text-2xl text-rose-400"></i>
              </div>
              <p className="text-sm font-bold text-gray-900">Sin huecos disponibles en esta fecha</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
                Prueba seleccionando otro día en el calendario.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {availableProfsOnDate.map(prof => {
                const name = prof.display_name || prof.profile_name || "Profesional";
                const isSelected = selectedProfessionalId === prof.profile_id;
                let slotsCount = 0;
                if (companions && companions.length > 0) {
                  if (bookingMode === "simultaneous") {
                    slotsCount = getSimultaneousSlotsOnDate(selectedDate, bookedSlots).filter(s => s.assignments["main"] === prof.profile_id).length;
                  } else {
                    const companionDuration = companions.reduce((acc, c) => acc + c.services.reduce((sum, s) => sum + s.duration_minutes, 0), 0);
                    slotsCount = getAvailableSlotsForProf(prof, selectedDate, bookedSlots, totalMinutes + companionDuration).length;
                  }
                } else {
                  slotsCount = getAvailableSlotsForProf(prof, selectedDate, bookedSlots, totalMinutes).length;
                }

                return (
                  <div
                    key={prof.profile_id}
                    onClick={() => onSelect(selectedDate, "", prof.profile_id)}
                    className={`w-full text-left p-4 sm:p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "border-rose-400 bg-gradient-to-r from-rose-50/90 to-white shadow-soft-sm scale-[1.01]"
                        : "border-rose-100/60 bg-white/90 backdrop-blur-sm shadow-soft-xs hover:border-rose-200 hover:shadow-soft-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-rose-100/70 overflow-hidden flex-shrink-0 border border-rose-200/60 shadow-soft-xs flex items-center justify-center">
                        {prof.photo_url ? (
                          <img src={prof.photo_url} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-rose-600 font-bold text-base">{name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{name}</h4>
                        {prof.bio && <p className="text-xs text-gray-500 truncate mt-0.5">{prof.bio}</p>}
                        
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/60 px-2.5 py-0.5 rounded-full border border-rose-200/50">
                            {slotsCount} horarios disponibles
                          </span>
                          {prof.address && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                              <i className="ri-map-pin-line text-rose-400"></i> {prof.address}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? "border-rose-500 bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-xs" : "border-rose-200 bg-rose-50/30"
                      }`}>
                        {isSelected && <i className="ri-check-line text-white text-xs font-bold"></i>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Time Slots Section */}
      {selectedDate && selectedProfessionalId && (
        <div className="bg-white/90 backdrop-blur-sm rounded-4xl border border-rose-100/70 p-6 sm:p-7 shadow-soft-sm animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-soft-xs">
              <i className="ri-time-line text-lg"></i>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Horarios con {selectedProf?.display_name || selectedProf?.profile_name}
              </h3>
              <p className="text-xs text-rose-500 capitalize font-medium">{displayDate}</p>
            </div>
          </div>

          {slotsForSelectedProf.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6 italic bg-rose-50/30 rounded-2xl">
              No hay horarios disponibles para esta duración con la profesional elegida.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2.5">
                {slotsForSelectedProf.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      onSelect(selectedDate, slot, selectedProfessionalId);
                      if (companions && companions.length > 0 && onAssignProfessionals) {
                        if (bookingMode === "simultaneous") {
                          const simSlots = getSimultaneousSlotsOnDate(selectedDate, bookedSlots, selectedProfessionalId);
                          const match = simSlots.find(s => s.time === slot && s.assignments["main"] === selectedProfessionalId);
                          if (match) {
                            onAssignProfessionals(match.assignments);
                          }
                        } else if (bookingMode === "consecutive") {
                          const consecutiveAssignments: Record<string, string> = { main: selectedProfessionalId };
                          companions.forEach(c => {
                            consecutiveAssignments[c.id] = selectedProfessionalId;
                          });
                          onAssignProfessionals(consecutiveAssignments);
                        }
                      }
                    }}
                    className={`py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer text-center ${
                      selectedTime === slot
                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-sm scale-105"
                        : "bg-white border border-rose-100 text-gray-800 shadow-soft-xs hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/40 hover:-translate-y-0.5"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {selectedTime && companions && companions.length > 0 && (
                <div className="p-5 bg-teal-50/90 backdrop-blur-sm border border-teal-200/70 rounded-3xl flex items-start gap-3.5 text-teal-950 shadow-soft-xs animate-fadeIn">
                  <div className="w-9 h-9 rounded-2xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-soft-xs">
                    <i className="ri-user-star-line text-lg"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-teal-950">Distribución de profesionales confirmada ✨</p>
                    <div className="text-xs text-teal-800 mt-1.5 leading-relaxed space-y-1">
                      {bookingMode === "simultaneous" ? (
                        <>
                          <p>Tú serás atendida por <strong>{selectedProf?.display_name || selectedProf?.profile_name}</strong> a las <strong>{selectedTime}</strong>.</p>
                          {companions.map((c, idx) => {
                            const match = getSimultaneousSlotsOnDate(selectedDate, bookedSlots, selectedProfessionalId).find(s => s.time === selectedTime && s.assignments["main"] === selectedProfessionalId);
                            const pId = match?.assignments[c.id];
                            const assignedProf = professionals.find(p => p.profile_id === pId);
                            return (
                              <p key={c.id} className="mt-0.5">
                                Acompañante <strong>{c.name || `nº ${idx + 1}`}</strong> será atendido/a por <strong>{assignedProf?.display_name || assignedProf?.profile_name || "otra profesional"}</strong> a las <strong>{selectedTime}</strong>.
                              </p>
                            );
                          })}
                        </>
                      ) : (
                        <>
                          <p>Ambas/os seréis atendidas/os consecutivamente por <strong>{selectedProf?.display_name || selectedProf?.profile_name}</strong>.</p>
                          <p className="mt-0.5">
                            Bloque total: <strong>{formatDuration(totalMinutes + companions.reduce((sum, c) => sum + c.services.reduce((sSum, s) => sSum + s.duration_minutes, 0), 0))}</strong> comenzando a las <strong>{selectedTime}</strong>.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
