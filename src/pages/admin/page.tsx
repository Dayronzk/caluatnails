import { useState } from "react";
import { Users, TrendingUp, Calendar, Clock, Bell, BellRing, Loader2 } from "lucide-react";
import { AdminSidebar } from "./components/AdminSidebar";
import { StatsCard } from "./components/StatsCard";
import { useDashboardStats } from "./hooks/useDashboardStats";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ProfessionalBookingsModal } from "./components/ProfessionalBookingsModal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";

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

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: "amber" | "emerald" | "rose" | "slate" }> = {
    pending: { label: "Pendiente", variant: "amber" },
    confirmed: { label: "Confirmada", variant: "emerald" },
    cancelled: { label: "Cancelada", variant: "rose" },
    completed: { label: "Completada", variant: "slate" },
  };
  const config = map[status] ?? { label: status, variant: "slate" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function SkeletonCard() {
  return (
    <Card variant="glass" padding="md" className="animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-2xl bg-rose-50" />
        <div className="w-12 h-4 rounded-full bg-rose-50" />
      </div>
      <div className="w-24 h-7 rounded-2xl bg-rose-50" />
      <div className="w-32 h-3 rounded-full bg-rose-50" />
    </Card>
  );
}

export default function AdminDashboard() {
  useSEO({
    title: "Panel Admin — CALUATNAILS",
    description: "Panel de administración del salón CALUATNAILS.",
    canonical: "/admin",
    noindex: true,
  });
  const { user } = useAuth();
  const { isSubscribed, permission, loading: pushLoading, subscribe } = usePushNotifications({ profileId: user?.id });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { stats, recentStudents, recentBookings, loading, error } = useDashboardStats(selectedDate);
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
    <div className="min-h-screen bg-gradient-to-br from-organic-cream via-white to-organic-blush/30 flex">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              CALUATNAILS · Administración
            </span>
            <h1 className="font-playfair text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">Dashboard Principal</h1>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Resumen general y métricas en tiempo real</p>
          </div>
          
          {/* Global Date Filter */}
          <Card variant="glass" padding="sm" className="inline-flex items-center gap-2 self-start md:self-auto">
            <button 
              type="button"
              onClick={handlePrevDay}
              className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-lg" />
            </button>
            
            <div className="px-3 text-center min-w-[140px]">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest leading-tight">Métricas del</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900 capitalize">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>

            <button 
              type="button"
              onClick={handleNextDay}
              className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
            
            {!isToday && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              >
                Hoy
              </Button>
            )}
          </Card>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-3xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2">
            <i className="ri-error-warning-line text-lg" /> {error}
          </div>
        )}

        {/* Push Notification Banner */}
        {!isSubscribed && permission !== 'denied' && (
          <Card variant="gradient" padding="md" className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Notificaciones instantáneas activas</p>
                <p className="text-xs text-gray-600 font-medium">Recibe alertas en tu dispositivo de nuevas reservas y cambios de cita.</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              isLoading={pushLoading}
              icon="ri-notification-3-line"
              onClick={() => subscribe()}
            >
              Activar Notificaciones
            </Button>
          </Card>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatsCard
                title="Clientes"
                value={stats.totalStudents.toLocaleString("es-ES")}
                icon={<Users className="w-5 h-5" />}
                color="rose"
              />
              <StatsCard
                title="Ingresos Totales"
                value={`${stats.revenueTotal.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                icon={<TrendingUp className="w-5 h-5" />}
                color="green"
              />
              <StatsCard
                title="Reservas Totales"
                value={stats.totalBookings}
                icon={<Calendar className="w-5 h-5" />}
                color="rose"
              />
              <StatsCard
                title="Reservas Pendientes"
                value={stats.pendingBookings}
                icon={<Clock className="w-5 h-5" />}
                color="amber"
              />
            </>
          )}
        </div>

        {/* Team Availability Status */}
        <Card variant="glass" padding="lg" className="mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-rose-100/60 pb-4">
            <div>
              <h2 className="font-playfair text-xl font-bold text-gray-900">Disponibilidad del equipo hoy</h2>
              <p className="text-xs text-gray-500 font-medium capitalize mt-0.5">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <Badge variant="emerald" icon="ri-checkbox-circle-line">
              En tiempo real
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white/80 p-5 rounded-3xl border border-rose-100/80 shadow-soft-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estilistas Activas</p>
              <h3 className="font-playfair text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.availability.activeCount} / {stats.availability.totalCount}</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">Trabajando en el salón</p>
            </div>

            <div className="bg-white/80 p-5 rounded-3xl border border-rose-100/80 shadow-soft-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tasa de Ocupación</p>
              <h3 className="font-playfair text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.availability.occupancyRate}%</h3>
              <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${stats.availability.occupancyRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white/80 p-5 rounded-3xl border border-rose-100/80 shadow-soft-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Capacidad Total</p>
              <h3 className="font-playfair text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.availability.totalSlots} citas</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">Capacidad diaria máxima</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {stats.availability.professionalBreakdown.map(prof => (
              <div 
                key={prof.id} 
                onClick={() => setSelectedProfForModal({ id: prof.id, name: prof.name })}
                className="bg-white p-4 rounded-3xl border border-rose-100/80 hover:border-rose-300 transition-all cursor-pointer shadow-soft-xs hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {prof.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{prof.name}</span>
                  </div>
                  <Badge variant={prof.slots > 0 ? "rose" : "slate"}>
                    {prof.slots > 0 ? 'En Servicio' : 'Libre'}
                  </Badge>
                </div>
                {prof.slots > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-medium text-gray-500">
                      <span>{prof.occupied} de {prof.slots} slots reservadas</span>
                      <span className="font-bold text-rose-600">{prof.rate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-rose-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-1000"
                        style={{ width: `${prof.rate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Professional Profit breakdown table */}
        <Card variant="glass" padding="lg" className="mb-8 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-100/60 pb-4">
            <h2 className="font-playfair text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Ingresos por Estilista y Servicio
            </h2>
          </div>

          <ResponsiveTable
            isLoading={loading}
            emptyMessage="No se registran datos de facturación todavía."
            data={stats.professionalStats}
            keyExtractor={(row) => row.id}
            columns={[
              {
                header: "Profesional",
                cell: (row) => (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {row.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-gray-900">{row.name}</span>
                  </div>
                )
              },
              {
                header: "Facturación Hoy",
                cell: (row) => (
                  <span className="font-bold text-emerald-600">{row.daily.toFixed(2)} €</span>
                )
              },
              {
                header: "Facturación Mensual",
                cell: (row) => (
                  <span className="font-bold text-gray-900">{row.monthly.toFixed(2)} €</span>
                )
              },
              {
                header: "Facturación Anual",
                cell: (row) => (
                  <span className="font-bold text-rose-600">{row.yearly.toFixed(2)} €</span>
                )
              }
            ]}
          />
        </Card>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Clients */}
          <Card variant="glass" padding="lg" className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100/60 pb-3">
              <h2 className="font-playfair text-lg font-bold text-gray-900">Últimos Clientes Registrados</h2>
              <Users className="w-5 h-5 text-rose-400" />
            </div>

            {recentStudents.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No hay nuevos registros de clientes.</p>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/80 border border-rose-100/60 shadow-soft-xs">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {(student.name ?? student.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{student.name ?? "Sin nombre"}</p>
                      <p className="text-[11px] text-gray-500 truncate">{student.email}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {formatTimeAgo(student.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>


          {/* Recent Bookings Table */}
          <Card variant="glass" padding="lg" className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100/60 pb-3">
              <h2 className="font-playfair text-lg font-bold text-gray-900">Últimas Reservas de Cita</h2>
              <Calendar className="w-5 h-5 text-rose-500" />
            </div>

            <ResponsiveTable
              isLoading={loading}
              emptyMessage="Aún no hay reservas registradas en el sistema."
              data={recentBookings}
              keyExtractor={(b) => b.id}
              columns={[
                {
                  header: "Cliente",
                  cell: (b) => (
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-gray-900">{b.client_name}</p>
                      <p className="text-[11px] text-gray-400">{b.client_email}</p>
                    </div>
                  )
                },
                {
                  header: "Fecha Cita",
                  cell: (b) => <span className="text-xs font-semibold text-gray-700">{formatDate(b.booking_date)}</span>
                },
                {
                  header: "Hora",
                  cell: (b) => <span className="text-xs font-bold text-rose-600">{b.booking_time}</span>
                },
                {
                  header: "Total",
                  cell: (b) => <span className="text-xs font-extrabold text-gray-900">{Number(b.total_price).toFixed(2)} €</span>
                },
                {
                  header: "Estado",
                  cell: (b) => getStatusBadge(b.status)
                },
                {
                  header: "Registrado",
                  cell: (b) => <span className="text-[11px] text-gray-400 font-medium">{formatTimeAgo(b.created_at)}</span>
                }
              ]}
            />
          </Card>
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
