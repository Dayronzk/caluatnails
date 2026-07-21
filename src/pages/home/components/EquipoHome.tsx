import { useNavigate } from "react-router-dom";
import { Sparkles, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";

const TEAM_MEMBERS = [
  {
    id: "prof-karol",
    name: "Karol",
    role: "Fundadora & Master Stylist",
    experience: "+10 Años de Experiencia",
    bio: "Pionera en técnicas avanzadas de estética ungueal en Barcelona. Karol destaca en manicura semipermanente completa, aplicación y relleno de uñas de gel/acrílico y refuerzo con suplemento de fibra niveladora. Su toque refinado garantiza máxima elegancia y durabilidad.",
    specialties: ["Manicura Semipermanente", "Uñas de Gel / Acrílico", "Suplemento Fibra Niveladora", "Reconstrucción"],
    image: "/assets/manicure-premium.png",
    badge: "Master Specialist",
  },
  {
    id: "prof-eidy",
    name: "Eidy",
    role: "Especialista Técnica & Nail Art",
    experience: "+6 Años de Experiencia",
    bio: "Con un pulso extraordinario y una gran sensibilidad artística, Eidy es nuestra referente en manicura y pedicura semipermanente completa, pedicura spa y creaciones de nail art (francesa, baby boomer, efecto glazed espejo). Cada diseño es una joya personalizada.",
    specialties: ["Semipermanente Completa", "Pedicura Spa", "Suplemento Francesa", "Glazed Espejo"],
    image: "/assets/manicure-pastel.jpg",
    badge: "Nail Art Expert",
  },
  {
    id: "prof-maryuri",
    name: "Maryuri",
    role: "Estilista de la Mirada & Piel",
    experience: "+5 Años de Experiencia",
    bio: "Especialista apasionada en realzar la belleza del rostro mediante la curvatura y densidad natural. Experta certificada en lifting y laminación de pestañas con baño de queratina, tinte y depilación facial precisa mediante hilo orgánico.",
    specialties: ["Lifting y Tinte Pestañas", "Laminación Pestañas", "Depilación Facial Hilo", "Piel Sensible"],
    image: "/assets/extensions-premium.png",
    badge: "Lash & Brow Artist",
  },
];

export default function EquipoHome() {
  const navigate = useNavigate();

  return (
    <section id="equipo" className="py-24 bg-gradient-to-b from-white via-organic-blush/20 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 text-rose-600 text-xs font-bold tracking-widest uppercase bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100/70 shadow-soft-xs">
            <Sparkles className="w-3.5 h-3.5" /> Estilistas Certificadas
          </span>
          <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
            Manos expertas apasionadas por tu <br />
            <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              bienestar y estilo
            </span>
          </h2>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-medium">
            En Caluatnails cada tratamiento es ejecutado por profesionales de alta maestría que escuchan tus deseos y cuidan cada detalle con delicadeza absoluta.
          </p>
        </div>

        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="group bg-white rounded-[2.5rem] p-6 border border-rose-100/80 shadow-soft-sm hover:shadow-soft-lg hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Photo & Badge */}
                <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 bg-gray-100">
                  <img
                    src={member.image}
                    alt={`${member.name} - ${member.role} en Caluatnails Barcelona`}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-rose-600 shadow-soft-xs border border-rose-100">
                    {member.badge}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-gray-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-soft-xs flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    {member.experience}
                  </div>
                </div>

                {/* Info & Literary Bio */}
                <div className="space-y-3 mb-6">
                  <div>
                    <h3 className="font-playfair text-2xl font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-rose-500 font-semibold text-xs tracking-wide uppercase">
                      {member.role}
                    </p>
                  </div>

                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium">
                    {member.bio}
                  </p>

                  {/* Specialties Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {member.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="text-[10px] font-bold bg-rose-50/80 text-rose-700 px-2.5 py-1 rounded-full border border-rose-100/60"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Individual Booking Button */}
              <div className="pt-4 border-t border-gray-100">
                <Button
                  variant="primary"
                  size="md"
                  icon="ri-calendar-event-line"
                  onClick={() => navigate(`/reservar?profesional=${member.id.replace('prof-', '')}`)}
                  className="w-full justify-center !py-2.5 text-xs shadow-md shadow-rose-200"
                >
                  Reservar Cita con {member.name}
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
