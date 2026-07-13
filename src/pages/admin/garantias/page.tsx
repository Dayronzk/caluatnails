import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "../components/AdminSidebar";
import { useSEO } from "@/hooks/useSEO";
import { 
  ShieldAlert, 
  Wrench, 
  Percent, 
  Award, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  ArrowLeft,
  Loader2,
  FileText
} from "lucide-react";

interface GuaranteeBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  client_phone: string;
  guarantee_reason: string | null;
  notes: string | null;
  professional_id: string | null;
  guarantee_original_booking_id: string | null;
  guarantee_original_professional_id: string | null;
}

interface ProfessionalStat {
  professional_id: string;
  professional_name: string;
  total_bookings_done: number;
  total_guarantees_caused: number;
  guarantee_rate: number;
}

export default function AdminGarantiasPage() {
  useSEO({
    title: "Garantías y Reparaciones",
    description: "Análisis y registro de garantías en CALUATNAILS",
    noindex: true,
  });

  const [loading, setLoading] = useState(true);
  const [guarantees, setGuarantees] = useState<GuaranteeBooking[]>([]);
  const [profStats, setProfStats] = useState<ProfessionalStat[]>([]);
  const [profNames, setProfNames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // KPI Metrics
  const [metrics, setMetrics] = useState({
    totalGuarantees: 0,
    guaranteeRate: 0,
    topOffender: "Ninguno",
    guaranteesThisMonth: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load profiles to build a mapping of names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name");
      
      const namesMap = (profiles || []).reduce(
        (acc, curr) => ({ ...acc, [curr.id]: curr.name }),
        {} as Record<string, string>
      );
      setProfNames(namesMap);

      // 2. Load guarantee bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          id, booking_date, booking_time, client_name, client_phone, 
          guarantee_reason, notes, professional_id,
          guarantee_original_booking_id, guarantee_original_professional_id
        `)
        .eq("is_guarantee", true)
        .order("booking_date", { ascending: false });

      const bookings = (bookingsData || []) as GuaranteeBooking[];
      setGuarantees(bookings);

      // 3. Load professional analytics from the view
      const { data: stats } = await supabase
        .from("guarantees_analytics")
        .select("*")
        .order("total_guarantees_caused", { ascending: false });
      
      setProfStats((stats || []) as ProfessionalStat[]);

      // 4. Calculate overall stats
      const totalGuar = bookings.length;
      
      // Calculate total original bookings to find overall guarantee rate
      const { count: totalOriginalBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("is_guarantee", false)
        .in("status", ["completed", "confirmed"]);

      const rate = totalOriginalBookings && totalOriginalBookings > 0 
        ? parseFloat(((totalGuar / totalOriginalBookings) * 100).toFixed(2))
        : 0;

      // Find top offender
      let topOffenderName = "Ninguno";
      if (stats && stats.length > 0 && stats[0].total_guarantees_caused > 0) {
        topOffenderName = stats[0].professional_name;
      }

      // Guarantees this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);
      const guarThisMonth = bookings.filter(b => b.booking_date >= startOfMonthStr).length;

      setMetrics({
        totalGuarantees: totalGuar,
        guaranteeRate: rate,
        topOffender: topOffenderName,
        guaranteesThisMonth: guarThisMonth,
      });

    } catch (e) {
      console.error("Error loading guarantees stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGuarantees = guarantees.filter(g => {
    const query = searchQuery.toLowerCase();
    return (
      g.client_name.toLowerCase().includes(query) ||
      g.client_phone.includes(query) ||
      (g.guarantee_reason && g.guarantee_reason.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-rose-500" />
              Garantías y Reparaciones
            </h1>
            <p className="text-gray-500 mt-1">Control de calidad e historial de incidencias en servicios</p>
          </div>
          <button 
            onClick={loadData}
            className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            Actualizar datos
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-4" />
            <p className="text-sm font-medium">Cargando panel de garantías...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { 
                  title: "Total Garantías", 
                  value: metrics.totalGuarantees, 
                  desc: "Reparaciones acumuladas", 
                  icon: <Wrench className="w-5 h-5 text-rose-500" />,
                  color: "border-rose-100 bg-white"
                },
                { 
                  title: "Tasa de Garantía", 
                  value: `${metrics.guaranteeRate}%`, 
                  desc: "Sobre citas totales de uñas", 
                  icon: <Percent className="w-5 h-5 text-amber-500" />,
                  color: "border-amber-100 bg-white"
                },
                { 
                  title: "Responsable Principal", 
                  value: metrics.topOffender, 
                  desc: "Más incidencias acumuladas", 
                  icon: <Award className="w-5 h-5 text-red-500" />,
                  color: "border-red-100 bg-white"
                },
                { 
                  title: "Garantías este Mes", 
                  value: metrics.guaranteesThisMonth, 
                  desc: "Incidencias registradas este mes", 
                  icon: <Calendar className="w-5 h-5 text-teal-500" />,
                  color: "border-teal-100 bg-white"
                },
              ].map((card, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border ${card.color} shadow-sm`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.title}</span>
                    <div className="p-2 rounded-xl bg-gray-50">{card.icon}</div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">{card.value}</h3>
                  <p className="text-xs text-gray-400">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Content Split: Stats & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Professional Ranking */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Garantías por Profesional
                </h2>
                <p className="text-xs text-gray-400 mb-6">Métrica basada en quién realizó el servicio original defectuoso</p>
                
                {profStats.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 flex-1 flex flex-col items-center justify-center">
                    <Award className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-xs">No hay datos de profesionales.</p>
                  </div>
                ) : (
                  <div className="space-y-6 flex-1">
                    {profStats.map((stat, index) => (
                      <div key={stat.professional_id} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-700">{index + 1}. {stat.professional_name}</span>
                          <span className="text-rose-600">{stat.total_guarantees_caused} garantías ({stat.guarantee_rate}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              index === 0 ? 'bg-rose-500' : index === 1 ? 'bg-amber-400' : 'bg-rose-300'
                            }`}
                            style={{ 
                              width: `${
                                Math.max(5, Math.min(100, (stat.total_guarantees_caused / (metrics.totalGuarantees || 1)) * 100))
                              }%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>{stat.total_bookings_done} citas originales</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Columns: Detailed History */}
              <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Historial de Garantías</h2>
                    <p className="text-xs text-gray-400 mt-1">Registros de reparaciones gratuitas realizadas</p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar cliente, teléfono, motivo..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all bg-gray-50/50"
                    />
                  </div>
                </div>

                {filteredGuarantees.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-500" />
                    <p className="font-semibold text-gray-700">No se encontraron garantías</p>
                    <p className="text-xs text-gray-400 mt-1">Aún no se ha registrado ninguna garantía que coincida.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100 pb-3 bg-gray-50/50 rounded-xl">
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Fecha Reparación</th>
                          <th className="px-4 py-3">Responsable Original</th>
                          <th className="px-4 py-3">Reparador</th>
                          <th className="px-4 py-3">Motivo de Garantía</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredGuarantees.map(g => (
                          <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-4">
                              <p className="font-bold text-gray-900">{g.client_name}</p>
                              <p className="text-[10px] text-gray-400">{g.client_phone}</p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-semibold text-gray-800">{g.booking_date}</p>
                              <p className="text-[10px] text-gray-400">{g.booking_time} hs</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg font-bold text-[10px] tracking-wide inline-block">
                                {g.guarantee_original_professional_id ? profNames[g.guarantee_original_professional_id] || "Desconocido" : "No asignado"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg font-bold text-[10px] tracking-wide inline-block">
                                {g.professional_id ? profNames[g.professional_id] || "Desconocido" : "No asignado"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-gray-700 line-clamp-2" title={g.guarantee_reason || g.notes || ""}>
                                {g.guarantee_reason || g.notes || "Garantía de reparación estándar"}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
