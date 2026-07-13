import { useState } from "react";
import { BookOpen, Users, GraduationCap, TrendingUp, Calendar, ShoppingBag, Award, Clock, Bell, BellRing, Loader2 } from "lucide-react";
import { AdminSidebar } from "./components/AdminSidebar";
import { StatsCard } from "./components/StatsCard";
import { useDashboardStats } from "./hooks/useDashboardStats";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ProfessionalBookingsModal } from "./components/ProfessionalBookingsModal";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days !== 1 ? "s" : ""}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-700" },
    confirmed: { label: "Confirmada", cls: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "Cancelada", cls: "bg-rose-100 text-rose-700" },
    completed: { label: "Completada", cls: "bg-gray-100 text-gray-600" },
  };
  return map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100" />
        <div className="w-12 h-4 rounded bg-gray-100" />
      </div>
      <div className="w-20 h-7 rounded bg-gray-100 mb-2" />
      <div className="w-32 h-4 rounded bg-gray-100" />
    </div>
  );
}

export default function AdminDashboard() {
  useSEO({
    title: "Panel Admin",
    description: "Panel de administración NAILOX.",
    canonical: "/admin",
    noindex: true,
  });
  const { user } = useAuth();
  const { isSubscribed, permission, loading: pushLoading, subscribe } = usePushNotifications({ profileId: user?.id });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { stats, recentStudents, recentBookings, topLessons, loading, error } = useDashboardStats(selectedDate);
  const [selectedProfForModal, setSelectedProfForModal] = useState<{id: string, name: string} | null>(null);

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Resumen general en tiempo real</p>
          </div>
          
          {/* Global Date Filter */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            <button 
              onClick={handlePrevDay}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors text-gray-400 hover:text-rose-500"
            >
              <i className="ri-arrow-left-s-line text-xl"></i>
            </button>
            
            <div className="px-4 py-2 text-center min-w-[160px]">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Viendo datos de</p>
              <p className="text-sm font-bold text-gray-900 capitalize">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>

            <button 
              onClick={handleNextDay}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors text-gray-400 hover:text-rose-500"
            >
              <i className="ri-arrow-right-s-line text-xl"></i>
            </button>
            
            {!isToday && (
              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="ml-2 px-3 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold hover:bg-rose-100 transition-colors uppercase tracking-tight"
              >
                Volver a Hoy
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
            <i className="ri-error-warning-line"></i> {error}
          </div>
        )}

        {/* Push notification subscription banner for admin */}
        {!isSubscribed && permission !== 'denied' && (
          <div className="mb-6 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/60 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Activa las notificaciones push</p>
                <p className="text-xs text-gray-500">Recibe alertas de nuevas reservas, mensajes de WhatsApp y escalaciones del bot.</p>
              </div>
            </div>
            <button
              onClick={() => subscribe()}
              disabled={pushLoading}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors disabled:opacity-50 active:scale-95"
            >
              {pushLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BellRing className="w-4 h-4" />
              )}
              Activar
            </button>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatsCard
                title="Estudiantes registrados"
                value={stats.totalStudents.toLocaleString("es-ES")}
                icon={<Users className="w-6 h-6" />}
                color="rose"
              />
              <StatsCard
                title="Ingresos totales"
                value={`${stats.revenueTotal.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                icon={<TrendingUp className="w-6 h-6" />}
                color="green"
              />
              <StatsCard
                title="Reservas totales"
                value={stats.totalBookings}
                icon={<Calendar className="w-6 h-6" />}
                color="rose"
              />
              <StatsCard
                title="Reservas pendientes"
                value={stats.pendingBookings}
                icon={<Clock className="w-6 h-6" />}
                color="amber"
              />
            </>
          )}
        </div>

        {/* Team Availability Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Estado de disponibilidad del equipo</h2>
              <p className="text-sm text-gray-500 mt-1 capitalize">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ACTUALIZADO HOY
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Users className="w-24 h-24" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Activos</p>
              <h3 className="text-3xl font-black text-gray-900">{stats.availability.activeCount} / {stats.availability.totalCount}</h3>
              <p className="text-xs text-gray-500 mt-2 font-medium">Profesionales trabajando hoy</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="w-24 h-24" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ocupación</p>
              <h3 className="text-3xl font-black text-emerald-600">{stats.availability.occupancyRate}%</h3>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${stats.availability.occupancyRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-24 h-24" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Capacidad</p>
              <h3 className="text-3xl font-black text-gray-900">{stats.availability.totalSlots} slots</h3>
              <p className="text-xs text-gray-500 mt-2 font-medium">Total de huecos disponibles hoy</p>
            </div>
          </div>

          {/* Individual Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.availability.professionalBreakdown.map(prof => (
              <div 
                key={prof.id} 
                onClick={() => setSelectedProfForModal({ id: prof.id, name: prof.name })}
                className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 hover:border-rose-200 transition-colors cursor-pointer hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-bold text-rose-600">
                      {prof.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{prof.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${prof.slots > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
                    {prof.slots > 0 ? 'EN SERVICIO' : 'NO DISPONIBLE'}
                  </span>
                </div>
                {prof.slots > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-medium text-gray-500">
                      <span>{prof.occupied} de {prof.slots} citas ocupadas</span>
                      <span>{prof.rate}%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${prof.rate > 80 ? 'bg-rose-500' : 'bg-rose-400'}`}
                        style={{ width: `${prof.rate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Professional Stats Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Beneficios por Profesional y Centro
            </h2>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center">
                <i className="ri-loader-4-line animate-spin text-3xl text-rose-500 mb-2 block"></i>
                <p className="text-gray-400">Calculando beneficios...</p>
              </div>
            ) : stats.professionalStats.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No hay datos de beneficios registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50/50">
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider">Profesional / Origen</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Hoy</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Este Mes</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Este Año</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.professionalStats.map((pro) => {
                      const isTotal = pro.id === 'global-total';
                      const isUnassigned = pro.id === 'centro-unassigned';
                      
                      return (
                        <tr 
                          key={pro.id} 
                          className={`hover:bg-gray-50/60 transition-colors ${isTotal ? 'bg-rose-50/30 font-bold' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {!isTotal && (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${isUnassigned ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                  {pro.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className={isTotal ? 'text-rose-600' : 'text-gray-900'}>
                                {pro.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-emerald-600 font-bold">
                            {pro.daily.toFixed(2)} €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                            {pro.monthly.toFixed(2)} €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-rose-500">
                            {pro.yearly.toFixed(2)} €
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent students */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Últimos estudiantes registrados</h2>
              <Users className="w-5 h-5 text-rose-400" />
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-50 animate-pulse" />
                ))}
              </div>
            ) : recentStudents.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aún no hay estudiantes registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-rose-50/40 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-semibold text-sm flex-shrink-0">
                      {(student.name ?? student.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {student.name ?? "Sin nombre"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{student.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(student.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top lessons */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Lecciones más completadas</h2>
              <Award className="w-5 h-5 text-amber-500" />
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-gray-50 animate-pulse" />
                ))}
              </div>
            ) : topLessons.length === 0 || topLessons.every(l => l.completions === 0) ? (
              <div className="text-center py-10 text-gray-400">
                <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aún no hay lecciones completadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topLessons.map((lesson, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                      {lesson.module_title && (
                        <p className="text-xs text-gray-400 truncate">{lesson.module_title}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-emerald-600 font-medium">
                          {lesson.completions} completadas
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent bookings */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Últimas reservas</h2>
              <Calendar className="w-5 h-5 text-rose-400" />
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-gray-50 animate-pulse" />
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aún no hay reservas registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-3 font-medium">Cliente</th>
                      <th className="pb-3 font-medium">Fecha de cita</th>
                      <th className="pb-3 font-medium">Hora</th>
                      <th className="pb-3 font-medium">Total</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium">Registrada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentBookings.map((booking) => {
                      const { label, cls } = getStatusLabel(booking.status);
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-gray-900">{booking.client_name}</p>
                            <p className="text-xs text-gray-400">{booking.client_email}</p>
                          </td>
                          <td className="py-3 pr-4 text-gray-700">{formatDate(booking.booking_date)}</td>
                          <td className="py-3 pr-4 text-gray-700">{booking.booking_time}</td>
                          <td className="py-3 pr-4 font-semibold text-gray-900">
                            {Number(booking.total_price).toFixed(2)} €
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                              {label}
                            </span>
                          </td>
                          <td className="py-3 text-gray-400 text-xs">{formatTimeAgo(booking.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedProfForModal && (
        <ProfessionalBookingsModal
          professionalId={selectedProfForModal.id}
          professionalName={selectedProfForModal.name}
          date={selectedDate}
          onClose={() => setSelectedProfForModal(null)}
        />
      )}
    </div>
  );
}
