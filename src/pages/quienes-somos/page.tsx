import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const TEAM = [
  {
    name: "Karol",
    role: "Fundadora & Master Stylist",
    exp: "+10 años de experiencia",
    specialty: "Manicura Rusa con Nivelación, Uñas Esculpidas de Gel y Arquitectura Ungueal",
    bio: "Karol fundó Caluatnails con una visión clara: elevar el cuidado de las uñas a una experiencia artesanal y personalizada en Barcelona. Apasionada de la anatomía de la uña y las técnicas de torno avanzadas, lidera el equipo garantizando los máximos estándares de calidad e higiene.",
    image: "/assets/manicure-premium.png",
    icon: "ri-vip-crown-line",
  },
  {
    name: "Eidy",
    role: "Especialista Técnica & Nail Art",
    exp: "+6 años de experiencia",
    specialty: "Esmaltado Semipermanente de alta precisión, Pedicura Spa integral y Nail Art",
    bio: "Eidy destaca por su destreza impecable en el esmaltado bajo cutícula y su delicadeza en el tratamiento de pies. Experta en crear diseños minimalistas y de tendencia que duran intactos por semanas.",
    image: "/assets/manicure-pastel.jpg",
    icon: "ri-magic-line",
  },
  {
    name: "Maryuri",
    role: "Estilista de la Mirada & Piel",
    exp: "+5 años de experiencia",
    specialty: "Lifting de Pestañas con Queratina, Diseño de Cejas y Depilación con Hilo",
    bio: "Maryuri aporta precisión y sutileza al diseño facial. Su técnica de depilación con hilo orgánico resalta las facciones naturales sin irritar la piel, mientras que sus tratamientos de pestañas abren la mirada de forma natural.",
    image: "/assets/extensions-premium.png",
    icon: "ri-eye-line",
  },
];

export default function QuienesSomosPage() {
  useSEO({
    title: "Quiénes Somos y Nuestro Equipo | Caluatnails Barcelona",
    description: "Conoce la historia del atelier Caluatnails en Calle Padilla 301, Barcelona y a nuestras estilistas: Karol, Eidy y Maryuri. Especialistas en manicura rusa, gel, pedicura y mirada.",
    canonical: "/quienes-somos",
    ogTitle: "Quiénes Somos y Nuestro Equipo | Caluatnails Barcelona",
    ogDescription: "Conoce a Karol, Eidy y Maryuri: estilistas apasionadas por realzar tu belleza natural en Calle Padilla 301, Barcelona.",
  });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-organic-cream via-white to-organic-blush/30 font-sans">
      <Navbar />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header Hero */}
        <section className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="rose" icon="ri-sparkles-line">
            El Atelier Caluatnails
          </Badge>
          <h1 className="font-playfair text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Pasión por la arquitectura de la uña y la estética de la mirada
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-medium">
            En Caluatnails creemos que el cuidado personal no debe ser una prisa, sino un refugio de relax y bienestar en pleno <strong className="text-gray-900 font-bold">Eixample de Barcelona (Calle Padilla 301)</strong>.
          </p>
        </section>

        {/* Story Section */}
        <section className="mb-20">
          <Card variant="gradient" padding="lg" className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-rose-600 text-xs font-bold uppercase tracking-widest">Nuestra Filosofía</span>
              <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-gray-900">
                La armonía entre técnica de atelier y calidez humana
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium">
                Cada tratamiento en nuestro salón combina un diagnóstico personalizado, materiales de primera calidad hipoalergénicos y técnicas avanzadas como la manicura rusa con nivelación. Nos enfocamos en la salud a largo plazo de tus uñas naturales.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5 bg-white/80 px-3.5 py-1.5 rounded-full border border-rose-100 shadow-soft-xs">
                  <i className="ri-shield-check-line text-rose-500" /> Esterilización Autoclave
                </span>
                <span className="flex items-center gap-1.5 bg-white/80 px-3.5 py-1.5 rounded-full border border-rose-100 shadow-soft-xs">
                  <i className="ri-heart-line text-rose-500" /> Trato Cercano
                </span>
                <span className="flex items-center gap-1.5 bg-white/80 px-3.5 py-1.5 rounded-full border border-rose-100 shadow-soft-xs">
                  <i className="ri-map-pin-line text-rose-500" /> Eixample Barcelona
                </span>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-soft-md">
              <img
                src="/assets/manicure-premium.png"
                alt="Ambiente en atelier Caluatnails Barcelona"
                className="w-full h-full object-cover"
              />
            </div>
          </Card>
        </section>

        {/* Team Section */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="pink" icon="ri-team-line">
              Nuestro Equipo
            </Badge>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-gray-900">
              Manos expertas comprometidas con tu bienestar
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm font-medium">
              Conoce a las estilistas tituladas que cuidarán de ti en cada visita.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TEAM.map((member) => (
              <Card
                key={member.name}
                variant="glass"
                padding="md"
                className="flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all duration-300 border-rose-100/80"
              >
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-soft-xs">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full text-rose-600 shadow-soft-xs">
                      <i className={`${member.icon} text-base`} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-playfair text-2xl font-bold text-gray-900">{member.name}</h3>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                        {member.exp}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mt-0.5">
                      {member.role}
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100/60 text-xs space-y-1">
                    <strong className="text-gray-900 block font-bold">Especialidad técnica:</strong>
                    <p className="text-gray-600 font-medium">{member.specialty}</p>
                  </div>

                  <p className="text-gray-600 text-xs leading-relaxed font-medium">
                    {member.bio}
                  </p>
                </div>

                <div className="pt-2 border-t border-rose-50">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    icon="ri-calendar-check-line"
                    onClick={() => navigate(`/reservar?profesional=${member.name.toLowerCase()}`)}
                  >
                    Reservar Cita con {member.name}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Bottom */}
        <section className="mt-20">
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 rounded-4xl p-8 sm:p-12 text-center text-white shadow-soft-lg space-y-4">
            <h2 className="font-playfair text-2xl sm:text-3xl font-extrabold">¿Quieres conocernos en persona?</h2>
            <p className="text-white/90 text-sm max-w-xl mx-auto font-medium">
              Te esperamos en Calle Padilla 301, Barcelona. Reserva tu cita online o consúltanos cualquier duda por WhatsApp.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Button
                variant="gold"
                size="lg"
                icon="ri-calendar-check-line"
                onClick={() => navigate("/reservar")}
              >
                Reservar Cita Online
              </Button>
              <a
                href="https://wa.me/34635797539"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition-all"
              >
                <i className="ri-whatsapp-line text-lg" /> Contactar por WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
