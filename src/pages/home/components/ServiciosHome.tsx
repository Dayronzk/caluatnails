import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Heart, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TREATWELL_SERVICES, ServiceItem } from "@/data/servicesCatalog";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Destacados", "Manicura", "Pedicura", "Manos y pies", "Uñas de gel y acrílico", "Nail art", "Depilación con hilo", "Pestañas y cejas"];

export default function ServiciosHome() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceItem[]>(TREATWELL_SERVICES);
  const [selectedCat, setSelectedCat] = useState("Destacados");

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
        console.error("Error al obtener servicios en Home:", err);
      }
    })();
  }, []);

  const filtered = selectedCat === "Destacados"
    ? services.slice(0, 6)
    : services.filter(s => s.service_type.toLowerCase() === selectedCat.toLowerCase());

  return (
    <section id="servicios" className="py-24 bg-gradient-to-b from-organic-cream/40 via-white to-organic-blush/30 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 text-rose-600 text-xs font-bold tracking-widest uppercase bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100/70 shadow-soft-xs">
              <Sparkles className="w-3.5 h-3.5" /> Catálogo Oficial Caluatnails
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Servicios & Tratamientos <br />
              <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                Caluatnails Barcelona
              </span>
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium">
              Consulta las tarifas oficiales de nuestro salón en Calle Padilla 301. Reserva tu cita online de forma rápida y sencilla.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon="ri-calendar-check-line"
            onClick={() => navigate("/reservar")}
            className="shadow-lg shadow-rose-200 shrink-0"
          >
            Reservar Cita Online
          </Button>
        </div>

        {/* Category Selector Pills */}
        <div className="mb-10 flex flex-wrap gap-2 justify-start sm:justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCat === cat
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200 scale-105"
                  : "bg-white border border-rose-100/80 text-gray-600 hover:border-rose-300 hover:bg-rose-50/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((service) => (
            <Card
              key={service.id}
              variant="glass"
              padding="sm"
              className="group hover:-translate-y-1.5 cursor-pointer transition-all duration-500 border-rose-100/70 hover:border-rose-300 flex flex-col justify-between"
              onClick={() => navigate(`/reservar?servicio=${service.id}`)}
            >
              <div>
                {/* Image & Category Pill */}
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-5 bg-gray-100">
                  <img 
                    src={
                      service.service_type === "Pedicura"
                        ? "/assets/pedicure-luxury.jpg"
                        : service.service_type.includes("Pestañas") || service.service_type.includes("Depilación")
                        ? "/assets/extensions-premium.png"
                        : service.service_type.includes("gel")
                        ? "/assets/extensions-premium.png"
                        : "/assets/manicure-premium.png"
                    } 
                    alt={service.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/manicure-premium.png"; }}
                  />
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-rose-600 shadow-soft-xs border border-rose-100">
                    {service.service_type}
                  </span>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full text-rose-500 shadow-soft-xs group-hover:scale-110 transition-all">
                    <Heart className="w-3.5 h-3.5 fill-rose-100" />
                  </div>
                </div>

                {/* Details & Title */}
                <div className="p-2 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-playfair text-xl font-bold text-gray-900 leading-snug group-hover:text-rose-600 transition-colors">
                      {service.name}
                    </h3>
                    <span className="text-rose-600 font-extrabold text-base sm:text-lg shrink-0 bg-rose-50/80 px-3 py-1 rounded-full border border-rose-100/60">
                      {service.price % 1 === 0 ? `${service.price}€` : `${service.price.toFixed(2).replace('.', ',')}€`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      {service.duration_minutes} min
                    </span>
                    <span>•</span>
                    <span className="text-gray-500">{service.service_type}</span>
                  </div>

                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium line-clamp-3">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Card Bottom CTA */}
              <div className="p-2 pt-4 border-t border-gray-100/80 mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Reservar este servicio <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* View Full Catalog Link */}
        <div className="text-center pt-12">
          <Button
            variant="outline"
            size="lg"
            icon="ri-arrow-right-line"
            onClick={() => navigate("/servicios")}
            className="!rounded-full border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            Ver Todos los Servicios y Categorías ({services.length})
          </Button>
        </div>

      </div>
    </section>
  );
}
