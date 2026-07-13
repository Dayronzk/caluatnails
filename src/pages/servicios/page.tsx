import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DBService } from "@/lib/types";
import { ArrowRight, Clock, ChevronLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

function toSlug(name: string) {
  return name.toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AllServicesPage() {
  const [services, setServices] = useState<DBService[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("service_type")
        .order("name");
      setServices(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const categories = [...new Set(services.map(s => s.service_type))];

  return (
    <div className="min-h-screen bg-white font-inter">
      <Helmet>
        <title>Servicios de Manicura y Pedicura en Barcelona | NAILOX Eixample</title>
        <meta name="description" content="Catálogo completo de servicios de manicura y pedicura en Barcelona: manicura rusa con nivelación, esmaltado semipermanente, uñas en gel, pedicura spa y más. Reserva online en el Eixample." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href="https://www.nailox.com/servicios" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.nailox.com/servicios" />
        <meta property="og:title" content="Servicios de Manicura y Pedicura en Barcelona | NAILOX Eixample" />
        <meta property="og:description" content="Manicura rusa, semipermanente, uñas en gel, pedicura spa y más. Reserva online tu cita en el Eixample, Barcelona." />
        <meta property="og:image" content="https://www.nailox.com/og-home.jpg" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:site_name" content="NAILOX" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Servicios de Manicura y Pedicura en Barcelona | NAILOX" />
        <meta name="twitter:description" content="Catálogo completo de manicura y pedicura en el Eixample, Barcelona." />
        <meta name="twitter:image" content="https://www.nailox.com/og-home.jpg" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.nailox.com/" },
                  { "@type": "ListItem", "position": 2, "name": "Servicios", "item": "https://www.nailox.com/servicios" }
                ]
              },
              {
                "@type": "CollectionPage",
                "name": "Servicios de manicura y pedicura en Barcelona",
                "description": "Catálogo completo de servicios de uñas en el salón NAILOX, Eixample, Barcelona.",
                "url": "https://www.nailox.com/servicios",
                "inLanguage": "es",
                "isPartOf": { "@id": "https://www.nailox.com/#website" },
                "mainEntity": {
                  "@type": "ItemList",
                  "numberOfItems": services.length,
                  "itemListElement": services.map((s, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "url": `https://www.nailox.com/servicios/${toSlug(s.name)}`,
                    "name": s.name
                  }))
                }
              }
            ]
          })}
        </script>
      </Helmet>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver</span>
          </button>
          <span className="font-playfair text-xl font-bold tracking-widest text-gray-900">
            NAIL<span className="text-rose-400">OX</span>
          </span>
          <button
            onClick={() => navigate("/reservar")}
            className="bg-rose-500 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
          >
            RESERVAR
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        <header className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <span className="inline-block px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold mb-4 uppercase tracking-widest">
            Salón de Uñas · Eixample Barcelona
          </span>
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 uppercase tracking-tight">
            Servicios de Manicura y Pedicura en Barcelona
          </h1>
          <p className="text-gray-500 max-w-3xl mx-auto text-base lg:text-lg leading-relaxed">
            Catálogo completo de servicios profesionales de uñas: <strong>manicura rusa con nivelación</strong>, <strong>esmaltado semipermanente</strong>, <strong>uñas en gel</strong>, <strong>pedicura spa</strong>, packs combinados y más. En pleno corazón del Eixample.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {categories.map(category => (
              <section key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-base font-black text-gray-900 uppercase tracking-tighter">{category}</h2>
                  <div className="h-px flex-1 bg-gray-100"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {services
                    .filter(s => s.service_type === category)
                    .map(service => (
                      <button
                        key={service.id}
                        onClick={() => navigate(`/servicios/${toSlug(service.name)}`)}
                        className="group bg-white rounded-2xl p-4 border border-gray-100 hover:border-rose-200 hover:shadow-md hover:shadow-rose-100/30 transition-all duration-200 text-left flex flex-col"
                      >
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 flex-1">{service.name}</h3>
                          <span className="text-lg font-black text-rose-500 shrink-0">{service.price}€</span>
                        </div>
                        <p className="text-gray-500 text-xs leading-snug mb-3 line-clamp-2">
                          {service.description || "Servicio profesional para resaltar tu belleza natural."}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                            <Clock className="w-3 h-3" />
                            {service.duration_minutes} min
                          </div>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500 group-hover:gap-2 transition-all">
                            VER MÁS <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* SEO Content: about the salon and services */}
        <section className="max-w-4xl mx-auto px-6 mt-20 prose prose-rose">
          <h2 className="text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight">El mejor salón de uñas en Barcelona</h2>
          <p className="text-lg text-gray-600 mb-6">
            En <strong>NAILOX</strong> llevamos años perfeccionando cada técnica de manicura y pedicura para ofrecerte un servicio profesional, seguro y de larga duración. Nuestro salón está en <strong>Carrer del Rosselló 497</strong>, en pleno <strong>Eixample de Barcelona</strong>, a apenas 5 minutos andando de la Sagrada Familia y muy cerca de Gràcia, El Born, Sant Andreu y Sant Martí.
          </p>
          <p className="text-lg text-gray-600 mb-10">
            Trabajamos con marcas profesionales, técnicas avanzadas como la <strong>manicura rusa con torno</strong> y <strong>nivelación con gel constructor</strong>, y nuestras profesionales están certificadas por la <strong>Academia NAILOX</strong>, donde se forman cada año más de 3.200 manicuristas en toda España.
          </p>

          <h2 className="text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight">Tipos de manicura y pedicura disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
              <h3 className="font-bold text-rose-900 mb-2">Manicura tradicional</h3>
              <p className="text-sm text-rose-800">Manicura clásica con esmalte normal. Ideal para uñas naturales y eventos puntuales.</p>
            </div>
            <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
              <h3 className="font-bold text-rose-900 mb-2">Esmaltado semipermanente</h3>
              <p className="text-sm text-rose-800">Duración de hasta 4 semanas con brillo intacto. La opción más popular en Barcelona.</p>
            </div>
            <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
              <h3 className="font-bold text-rose-900 mb-2">Manicura rusa con nivelación</h3>
              <p className="text-sm text-rose-800">Técnica avanzada con torno y gel constructor. Acabado espejo y duración prolongada.</p>
            </div>
            <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
              <h3 className="font-bold text-rose-900 mb-2">Uñas en gel y extensiones</h3>
              <p className="text-sm text-rose-800">Esculpido profesional para uñas largas, resistentes y con diseño personalizado.</p>
            </div>
            <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
              <h3 className="font-bold text-rose-900 mb-2">Pedicura spa y semipermanente</h3>
              <p className="text-sm text-rose-800">Tratamiento integral de pies con exfoliación, durezas, masaje e hidratación.</p>
            </div>
            <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
              <h3 className="font-bold text-rose-900 mb-2">Packs manicura + pedicura</h3>
              <p className="text-sm text-rose-800">Combinados al mejor precio. Cuidado integral de manos y pies en una sola sesión.</p>
            </div>
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight">¿Por qué elegir NAILOX?</h2>
          <ul className="space-y-3 text-lg text-gray-600 mb-10">
            <li>✓ <strong>Profesionales certificadas</strong> con formación continua en técnicas internacionales.</li>
            <li>✓ <strong>Productos de marca premium</strong>: gel hipoalergénico, esmaltes profesionales y materiales de primera.</li>
            <li>✓ <strong>Reserva online</strong> en menos de 30 segundos, elige tu profesional y tu horario.</li>
            <li>✓ <strong>Ubicación céntrica</strong> en el Eixample, con metro Sagrada Familia y Verdaguer a 5 minutos.</li>
            <li>✓ <strong>Horario flexible</strong>: lunes a viernes de 9:00 a 19:00.</li>
            <li>✓ <strong>Pago seguro online</strong> con confirmación inmediata por email y WhatsApp.</li>
          </ul>

          <h2 className="text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight">¿En qué barrios atendemos?</h2>
          <p className="text-lg text-gray-600 mb-10">
            Aunque estamos físicamente en el <strong>Eixample (Sagrada Familia)</strong>, recibimos clientas de toda Barcelona: <strong>Gràcia</strong>, <strong>El Born</strong>, <strong>El Raval</strong>, <strong>Sants</strong>, <strong>Sant Andreu</strong>, <strong>Sant Martí</strong>, <strong>Poblenou</strong>, <strong>Sarrià</strong>, <strong>Les Corts</strong>, <strong>Pedralbes</strong> y barrios cercanos. También trabajamos con clientas de <strong>L'Hospitalet</strong>, <strong>Badalona</strong> y <strong>Sant Adrià de Besòs</strong>.
          </p>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-6 mt-16">
          <div className="bg-gray-900 rounded-[3rem] p-12 text-center text-white">
            <h2 className="text-3xl font-black mb-6">¿Lista para tu momento de belleza?</h2>
            <p className="text-gray-400 mb-10 max-w-xl mx-auto">Reserva tu cita de manicura o pedicura ahora y asegura tu plaza con nuestras especialistas.</p>
            <button
              onClick={() => navigate("/reservar")}
              className="bg-rose-500 hover:bg-rose-600 text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-rose-900/20"
            >
              Reservar Mi Cita Online
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
