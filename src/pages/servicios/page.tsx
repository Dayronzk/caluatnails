import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TREATWELL_SERVICES, ServiceItem } from "@/data/servicesCatalog";
import { supabase } from "@/lib/supabase";

interface CategoryGroup {
  id: string;
  title: string;
  icon: string;
  description: string;
  serviceType: string;
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "manicura",
    title: "Manicura",
    icon: "ri-hand-sanitizer-line",
    description: "Tratamientos completos de higiene, limado, cutículas, hidratación y esmaltado de manos.",
    serviceType: "Manicura",
  },
  {
    id: "pedicura",
    title: "Pedicura",
    icon: "ri-footprint-line",
    description: "Cuidado integral de pies, tratamiento de cutículas, durezas y esmaltado duradero.",
    serviceType: "Pedicura",
  },
  {
    id: "manos-pies",
    title: "Manos y pies",
    icon: "ri-sparkles-line",
    description: "Tratamientos combinados de manicura y pedicura en una sola sesión.",
    serviceType: "Manos y pies",
  },
  {
    id: "gel-acrilico",
    title: "Uñas de gel y acrílico",
    icon: "ri-vip-diamond-line",
    description: "Aplicación, relleno y retirada profesional de uñas de gel y acrílico.",
    serviceType: "Uñas de gel y acrílico",
  },
  {
    id: "nail-art",
    title: "Nail art",
    icon: "ri-brush-line",
    description: "Suplemento de fibra niveladora, francesa, baby boomer, glazed y decoraciones.",
    serviceType: "Nail art",
  },
  {
    id: "depilacion-hilo",
    title: "Depilación con hilo",
    icon: "ri-scissors-cut-line",
    description: "Depilación facial limpia, ecológica e hipoalergénica con hilo de algodón orgánico.",
    serviceType: "Depilación con hilo",
  },
  {
    id: "pestanas-cejas",
    title: "Pestañas y cejas",
    icon: "ri-eye-line",
    description: "Lifting y laminación de pestañas con nutrición de queratina y tinte.",
    serviceType: "Pestañas y cejas",
  },
];

export default function AllServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceItem[]>(TREATWELL_SERVICES);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("active", true)
          .order("order_index", { ascending: true });

        if (!error && data && data.length > 0) {
          setServices(data as ServiceItem[]);
        }
      } catch (err) {
        console.error("Error al cargar servicios desde Supabase:", err);
      }
    })();
  }, []);

  const visibleGroups = selectedCatId
    ? CATEGORY_GROUPS.filter(g => g.id === selectedCatId)
    : CATEGORY_GROUPS;

  return (
    <div className="min-h-screen bg-gradient-to-b from-organic-cream via-white to-organic-blush/30 font-sans">
      <Helmet>
        <title>Catálogo de Servicios | Caluatnails Barcelona Eixample</title>
        <meta name="description" content="Consulta las tarifas y tratamientos oficiales de manicura, pedicura, manos y pies, uñas de gel y acrílico, nail art, depilación con hilo y pestañas." />
        <link rel="canonical" href="https://www.caluatnails.com/servicios" />
      </Helmet>

      <Navbar />

      {/* Header Banner */}
      <section className="relative pt-32 pb-16 bg-gradient-to-br from-gray-950 via-rose-950 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src="/assets/salon-interior.jpg"
            alt="Interior Caluatnails Barcelona"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 text-center space-y-4">
          <Badge variant="rose" icon="ri-sparkles-line">
            Catálogo Registrado · 7 Categorías
          </Badge>
          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Servicios & Categorías <br />
            <span className="bg-gradient-to-r from-rose-300 via-pink-200 to-rose-400 bg-clip-text text-transparent">
              Caluatnails Barcelona
            </span>
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Precios y tiempos de tratamiento oficiales. Reserva online en menos de 1 minuto seleccionando a tu estilista preferida.
          </p>
          <div className="pt-4">
            <Button
              variant="primary"
              size="lg"
              icon="ri-calendar-check-line"
              onClick={() => navigate("/reservar")}
              className="shadow-xl shadow-rose-900/50"
            >
              Reservar Cita Ahora
            </Button>
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <section className="py-8 bg-white border-b border-rose-100/60 sticky top-20 z-30 shadow-soft-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCatId(null)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCatId === null
                ? "bg-rose-500 text-white shadow-md shadow-rose-200 scale-105"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-rose-300"
            }`}
          >
            Todas las Categorías ({services.length})
          </button>
          {CATEGORY_GROUPS.map((group) => {
            const count = services.filter(s => s.service_type.toLowerCase() === group.serviceType.toLowerCase()).length;
            const isSelected = selectedCatId === group.id;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedCatId(isSelected ? null : group.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200 scale-105"
                    : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-rose-300"
                }`}
              >
                {group.title} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Services List by Group */}
      <section className="py-16 max-w-7xl mx-auto px-6 lg:px-10 space-y-16">
        {visibleGroups.map((group) => {
          const groupServices = services.filter(s => s.service_type.toLowerCase() === group.serviceType.toLowerCase());
          if (groupServices.length === 0) return null;

          return (
            <div key={group.id} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <i className={`${group.icon} text-xl`} />
                </div>
                <div>
                  <h2 className="font-playfair text-2xl sm:text-3xl font-extrabold text-gray-900">
                    {group.title}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">{group.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupServices.map((service) => (
                  <Card
                    key={service.id}
                    variant="glass"
                    padding="md"
                    className="group hover:border-rose-300 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-playfair text-lg font-bold text-gray-900 leading-snug group-hover:text-rose-600 transition-colors">
                          {service.name}
                        </h3>
                        <span className="text-rose-600 font-extrabold text-lg shrink-0 bg-rose-50/80 px-3 py-1 rounded-full border border-rose-100">
                          {service.price % 1 === 0 ? `${service.price}€` : `${service.price.toFixed(2).replace('.', ',')}€`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                        <span>{service.duration_minutes} min</span>
                      </div>

                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium">
                        {service.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
                      <button
                        onClick={() => navigate(`/reservar?servicio=${service.id}`)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Reservar cita</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                        {service.service_type}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Booking CTA Footer Bar */}
      <section className="py-16 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold">
            ¿Lista para lucir unas uñas y mirada espectaculares?
          </h2>
          <p className="text-white/90 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Reserva tu cita en nuestro atelier de Calle Padilla 301 (Barcelona). Elige tu fecha, hora y estilista preferida.
          </p>
          <Button
            variant="secondary"
            size="lg"
            icon="ri-calendar-check-line"
            onClick={() => navigate("/reservar")}
            className="!bg-white !text-rose-600 hover:!bg-rose-50 shadow-xl"
          >
            Reservar Cita Online
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
