import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  totalStudents: number;
  totalModules: number;
  totalLessons: number;
  totalPurchases: number;
  totalBookings: number;
  pendingBookings: number;
  completionRate: number;
  revenueTotal: number;
  professionalStats: ProfessionalStat[];
  availability: TeamAvailability;
}

export interface TeamAvailability {
  activeCount: number;
  totalCount: number;
  totalSlots: number;
  occupiedSlots: number;
  occupancyRate: number;
  professionalBreakdown: ProfAvailability[];
}

export interface ProfAvailability {
  id: string;
  name: string;
  slots: number;
  occupied: number;
  rate: number;
}

export interface ProfessionalStat {
  id: string;
  name: string;
  daily: number;
  monthly: number;
  yearly: number;
}

export interface RecentStudent {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
}

export interface RecentBooking {
  id: string;
  client_name: string;
  client_email: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_price: number;
  created_at: string;
}

export interface TopLesson {
  title: string;
  completions: number;
  module_title: string | null;
}

export interface DashboardData {
  stats: DashboardStats;
  recentStudents: RecentStudent[];
  recentBookings: RecentBooking[];
  topLessons: TopLesson[];
  loading: boolean;
  error: string | null;
}

const DEFAULT_STATS: DashboardStats = {
  totalStudents: 0,
  totalModules: 0,
  totalLessons: 0,
  totalPurchases: 0,
  totalBookings: 0,
  pendingBookings: 0,
  completionRate: 0,
  revenueTotal: 0,
  professionalStats: [],
  availability: {
    activeCount: 0,
    totalCount: 0,
    totalSlots: 0,
    occupiedSlots: 0,
    occupancyRate: 0,
    professionalBreakdown: [],
  },
};

export function useDashboardStats(selectedDateParam?: string): DashboardData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [topLessons, setTopLessons] = useState<TopLesson[]>([]);

  const selectedDate = selectedDateParam || new Date().toISOString().split('T')[0];

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('modules').select('id', { count: 'exact', head: true }),
          supabase.from('lessons').select('id', { count: 'exact', head: true }),
          supabase.from('purchases').select('amount_total').eq('status', 'completed'),
          supabase.from('bookings').select('id', { count: 'exact', head: true }),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('student_progress').select('completed', { count: 'exact', head: false }),
          supabase.from('profiles').select('id, name, email, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(5),
          supabase.from('bookings').select('id, client_name, client_email, booking_date, booking_time, status, total_price, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('lessons').select('title, module_id, modules(title), student_progress(id, completed)').limit(100),
          supabase.from('profiles').select('id, name, role, is_professional').or('role.eq.admin,is_professional.eq.true'),
          supabase.from('bookings').select('professional_id, total_price, booking_date, total_duration_minutes, status').neq('status', 'cancelled'),
          supabase.from('professional_schedules').select('profile_id, day_of_week, is_working, start_time, end_time'),
          supabase.from('professional_settings').select('profile_id, slot_duration_minutes'),
        ]);

        if (cancelled) return;

        const [
          studentsRes, modulesRes, lessonsRes, purchasesRes, bookingsRes,
          pendingBookingsRes, progressRes, recentStudentsRes, recentBookingsRes,
          topLessonsRes, professionalsRes, allBookingsRes, schedulesRes, settingsRes
        ] = results;

        // Compute completion rate
        const progressData = progressRes.data ?? [];
        const totalProgress = progressData.length;
        const completedProgress = progressData.filter((p) => p.completed).length;
        const completionRate = totalProgress > 0 ? Math.round((completedProgress / totalProgress) * 100) : 0;

        // Revenue from purchases
        const revenueTotal = (purchasesRes.data ?? []).reduce((acc, p) => acc + (p.amount_total ?? 0), 0) / 100;

        // Top lessons
        const topLessonsData: TopLesson[] = (topLessonsRes.data ?? [])
          .map((l: any) => ({
            title: l.title,
            module_title: l.modules?.title ?? null,
            completions: (l.student_progress ?? []).filter((p: any) => p.completed).length,
          }))
          .sort((a, b) => b.completions - a.completions)
          .slice(0, 5);

        // Dates
        const todayStr = selectedDate;
        const monthStr = todayStr.substring(0, 7);
        const yearStr = todayStr.substring(0, 4);
        
        // Correct DOW for selected date (taking care of UTC vs Local)
        const dateObj = new Date(selectedDate + 'T12:00:00');
        const dow = dateObj.getDay();

        // Calculate Availability
        const professionals = professionalsRes.data ?? [];
        const bookings = allBookingsRes.data ?? [];
        const schedules = schedulesRes.data ?? [];
        const settings = settingsRes.data ?? [];

        let totalActive = 0;
        let globalTotalSlots = 0;
        let globalOccupiedSlots = 0;
        const professionalBreakdown: ProfAvailability[] = [];

        professionals.forEach(pro => {
          const sched = schedules.find(s => s.profile_id === pro.id && s.day_of_week === dow);
          const setting = settings.find(s => s.profile_id === pro.id);
          const slotSize = setting?.slot_duration_minutes || 30;
          
          let profSlots = 0;
          if (sched?.is_working) {
            totalActive++;
            const start = sched.start_time.split(':').map(Number);
            const end = sched.end_time.split(':').map(Number);
            const totalMinutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
            profSlots = Math.floor(totalMinutes / slotSize);
          }

          const profBookings = bookings.filter(b => b.professional_id === pro.id && b.booking_date === todayStr);
          const totalOccupiedMinutes = profBookings.reduce((acc, b) => acc + (Number(b.total_duration_minutes) || slotSize), 0);
          const profOccupied = Math.ceil(totalOccupiedMinutes / slotSize);

          globalTotalSlots += profSlots;
          globalOccupiedSlots += profOccupied;

          professionalBreakdown.push({
            id: pro.id,
            name: pro.name || 'Profesional',
            slots: profSlots,
            occupied: profOccupied,
            rate: profSlots > 0 ? Math.round((profOccupied / profSlots) * 100) : 0
          });
        });

        // Professional Revenue Stats
        const statsMap: Record<string, ProfessionalStat> = {};
        professionals.forEach(pro => {
          statsMap[pro.id] = { id: pro.id, name: pro.name || 'Profesional', daily: 0, monthly: 0, yearly: 0 };
        });
        const CENTRO_ID = 'centro-unassigned';
        statsMap[CENTRO_ID] = { id: CENTRO_ID, name: 'Servicios Generales', daily: 0, monthly: 0, yearly: 0 };

        bookings.forEach(b => {
          const proId = b.professional_id || CENTRO_ID;
          if (!statsMap[proId]) statsMap[proId] = { id: proId, name: 'Otros', daily: 0, monthly: 0, yearly: 0 };
          const price = Number(b.total_price);
          if (b.booking_date === todayStr) statsMap[proId].daily += price;
          if (b.booking_date.startsWith(monthStr)) statsMap[proId].monthly += price;
          if (b.booking_date.startsWith(yearStr)) statsMap[proId].yearly += price;
        });

        const professionalStats = Object.values(statsMap)
          .filter(s => s.daily > 0 || s.monthly > 0 || s.yearly > 0)
          .sort((a, b) => b.monthly - a.monthly);

        professionalStats.push({
          id: 'global-total',
          name: 'TOTAL NAILOX',
          daily: professionalStats.reduce((acc, s) => acc + s.daily, 0),
          monthly: professionalStats.reduce((acc, s) => acc + s.monthly, 0),
          yearly: professionalStats.reduce((acc, s) => acc + s.yearly, 0),
        });

        setStats({
          totalStudents: studentsRes.count ?? 0,
          totalModules: modulesRes.count ?? 0,
          totalLessons: lessonsRes.count ?? 0,
          totalPurchases: purchasesRes.data?.length ?? 0,
          totalBookings: bookingsRes.count ?? 0,
          pendingBookings: pendingBookingsRes.count ?? 0,
          completionRate,
          revenueTotal,
          professionalStats,
          availability: {
            activeCount: totalActive,
            totalCount: professionals.length,
            totalSlots: globalTotalSlots,
            occupiedSlots: globalOccupiedSlots,
            occupancyRate: globalTotalSlots > 0 ? Math.round((globalOccupiedSlots / globalTotalSlots) * 100) : 0,
            professionalBreakdown
          }
        });

        setRecentStudents((recentStudentsRes.data ?? []) as RecentStudent[]);
        setRecentBookings((recentBookingsRes.data ?? []) as RecentBooking[]);
        setTopLessons(topLessonsData);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error cargando datos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [selectedDate]);

  return { stats, recentStudents, recentBookings, topLessons, loading, error };
}
