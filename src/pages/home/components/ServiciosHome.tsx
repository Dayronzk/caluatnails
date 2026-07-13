import { useNavigate } from "react-router-dom";
import { Sparkles, Calendar, ArrowRight, Heart } from "lucide-react";

const TOP_SERVICES = [
  {
    title: "Manicura con Nivelación",
    desc: "Refuerzo de uña natural con base niveladora para un crecimiento fuerte y estético.",
    price: "38€",
    image: "/assets/manicure-pastel.jpg",
    slug: "manicura-con-nivelacion-refuerzo"
  },
  {
    title: "Manicura y Pedicura Semipermanente",
    desc: "El combo perfecto: cuidado integral de manos y pies con esmaltado de larga duración.",
    price: "60€",
    image: "/assets/manicure-exotic.jpg",
    slug: "manicura-y-pedicura-semipermanente"
  },
  {
    title: "Pedicura Semipermanente",
    desc: "Limpieza profunda y esmaltado duradero para unos pies impecables por semanas.",
    price: "38€",
    image: "/assets/pedicure-luxury.jpg",
    slug: "pedicura-semipermanente"
  }
];

export default function ServiciosHome() {
  const navigate = useNavigate();

  return (
    <section id="servicios" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-rose-600 text-sm font-bold tracking-widest uppercase mb-4">
              <Sparkles className="w-4 h-4" /> Servicios Premium
            </span>
            <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Diseño y Cuidado Profesional <br />
              <span className="text-rose-600 text-3xl lg:text-4xl">Para Tus Manos y Pies</span>
            </h2>
          </div>
          <button 
            onClick={() => navigate("/reservar")}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-rose-200"
          >
            Reservar Cita <Calendar className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TOP_SERVICES.map((service) => (
            <div 
              key={service.slug}
              className="group bg-gray-50 rounded-[2.5rem] p-4 border border-gray-100 hover:border-rose-200 hover:bg-white hover:shadow-2xl hover:shadow-rose-100/50 transition-all duration-500 cursor-pointer"
              onClick={() => navigate(`/servicios/${service.slug}`)}
            >
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-6">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="w-5 h-5" />
                </div>
              </div>
              
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-playfair text-2xl font-bold text-gray-900">{service.title}</h3>
                  <span className="text-rose-600 font-black text-xl">{service.price}</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                  {service.desc}
                </p>
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  Ver detalles <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm mb-6 italic">¿Buscas algo diferente? Explora nuestro catálogo completo de servicios.</p>
          <button 
            onClick={() => navigate("/servicios")}
            className="inline-flex items-center gap-2 text-gray-900 font-bold border-b-2 border-rose-300 pb-1 hover:text-rose-600 hover:border-rose-600 transition-all"
          >
            Ver Todos los Servicios <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
