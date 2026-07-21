import { useState } from "react";
import { Sparkles, MapPin, ChevronDown, Award, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "¿Qué incluye la Manicura Semipermanente Completa?",
    a: "Incluye retirada del esmalte anterior, corte y limado de uñas según la forma deseada, tratamiento profundo de cutículas, masaje con hidratación y aplicación de esmaltado semipermanente de alta adherencia con acabado brillo espejo (en color o francesa).",
  },
  {
    q: "¿Quiénes son las profesionales que atienden en Caluatnails Barcelona?",
    a: "Nuestro equipo está formado por tres estilistas altamente cualificadas: Karol (Fundadora y Master Stylist especializada en Manicura y Uñas de Gel/Acrílico), Eidy (Especialista Técnica en Esmaltado Semipermanente, Pedicura Spa y Nail Art) y Maryuri (Estilista de la Mirada especializada en Lifting de Pestañas con Queratina, Laminación y Depilación Facial con Hilo Orgánico).",
  },
  {
    q: "¿Dónde se encuentra ubicado el salón Caluatnails en Barcelona?",
    a: "Estamos situados en el distrito del Eixample, en la Calle Padilla 301, 08025 Barcelona. A solo 5 minutos a pie de la Sagrada Familia y a 3 minutos del Hospital de Sant Pau. Acceso mediante metro por Sagrada Família (L2/L5) y Sant Pau | Dos de Maig (L5).",
  },
  {
    q: "¿Cuál es la diferencia entre esmaltado tradicional y semipermanente?",
    a: "El esmaltado tradicional se seca al aire y ofrece una durabilidad de 3 a 5 días, ideal para ocasiones puntuales. El esmaltado semipermanente se cura bajo lámpara LED/UV de última generación, garantizando secado inmediato y brillo impecable durante más de 3 semanas sin desconcharse.",
  },
  {
    q: "¿Por qué utilizar hilo para la depilación facial?",
    a: "La depilación facial con hilo es la técnica más limpia, precisa e hipoalergénica. A diferencia de la cera, no aplica calor sobre la piel ni estira los tejidos sensibles del rostro, evitando irritaciones y previniendo la flacidez.",
  },
];

export default function SeoContentHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section className="py-24 bg-gradient-to-b from-organic-cream/30 via-white to-organic-blush/20 border-t border-rose-100/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-20">
        
        {/* Section 1: Literary SEO Text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-flex items-center gap-2 text-rose-600 text-xs font-bold tracking-widest uppercase bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100/70 shadow-soft-xs">
              <Award className="w-3.5 h-3.5" /> Centro de Referencia en Barcelona
            </span>

            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Tu salón de manicura, pedicura y estética <br />
              <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                de confianza en Eixample
              </span>
            </h2>

            <div className="space-y-4 text-gray-600 text-sm sm:text-base leading-relaxed font-medium">
              <p>
                En <strong className="text-gray-900 font-bold">Caluatnails</strong> cuidamos de tus manos, pies y mirada con el máximo esmero. Ubicadas en la <strong className="text-gray-900 font-bold">Calle Padilla 301 (Barcelona)</strong>, brindamos a nuestras clientas un espacio de confort donde relajarse y disfrutar de tratamientos estéticos de alta calidad.
              </p>
              <p>
                Entre nuestras especialidades más solicitadas destacan la <strong className="text-rose-600 font-bold">Manicura semipermanente completa</strong>, la <strong className="text-rose-600 font-bold">Pedicura semipermanente completa</strong>, la aplicación y relleno de uñas de gel/acrílico, el lifting y tinte de pestañas y la depilación facial con hilo.
              </p>
              <p>
                Todo nuestro equipo trabaja con instrumental esterilizado de grado clínico y productos de primera línea para garantizar la salud e integridad de tus uñas y piel.
              </p>
            </div>
          </div>

          {/* Section 2: Neighborhood Location Card */}
          <div className="lg:col-span-6 bg-white rounded-[2.5rem] p-8 border border-rose-100 shadow-soft-md space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-playfair text-xl font-bold text-gray-900">Visítanos en Calle Padilla 301</h3>
                <p className="text-gray-500 text-xs font-semibold">Barcelona · Eixample / Sagrada Família</p>
              </div>
            </div>

            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium">
              Nuestro salón se sitúa en Calle Padilla 301 (cerca de Avinguda Gaudí), un entorno agradable y muy bien comunicado. Ideal para regalarte una pausa de bienestar durante tu día.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Horario Laboral</p>
                <p className="text-xs font-bold text-gray-800">Lunes a Viernes: 9:30–20:30</p>
                <p className="text-xs font-bold text-gray-800">Sábados: 10:00–15:00</p>
              </div>
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contacto Directo</p>
                <p className="text-xs font-bold text-rose-600">+34 635 797 539</p>
                <p className="text-xs font-medium text-gray-500 truncate">caluatnails@gmail.com</p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://maps.google.com/?q=Calle+Padilla+301+Barcelona"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md"
              >
                <MapPin className="w-4 h-4 text-rose-400" />
                Cómo llegar en Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Section 3: FAQ Accordion */}
        <div className="max-w-4xl mx-auto space-y-8 pt-6">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 text-rose-600 text-xs font-bold tracking-widest uppercase bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100/70 shadow-soft-xs">
              <HelpCircle className="w-3.5 h-3.5" /> Resuelve tus dudas
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-gray-900">
              Preguntas Frecuentes sobre Nuestros Servicios
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-rose-100/80 shadow-soft-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-gray-900 text-sm sm:text-base cursor-pointer hover:text-rose-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-rose-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-gray-600 text-xs sm:text-sm leading-relaxed font-medium border-t border-gray-50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
