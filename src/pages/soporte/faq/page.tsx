import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useSEO } from "@/hooks/useSEO";

const faqs = [
  {
    category: "Sobre el Curso",
    items: [
      {
        q: "¿Qué incluye el curso de CALUATNAILS?",
        a: "El curso incluye módulos de teoría y práctica, recursos descargables (fichas técnicas, guías de colores, plantillas), evaluaciones automáticas, acceso al foro de discusión y un certificado digital al completar el programa. Todo con acceso de por vida.",
      },
      {
        q: "¿Necesito experiencia previa en manicura?",
        a: "No. El curso está diseñado para todos los niveles, desde principiantes absolutos hasta profesionales que quieren perfeccionar técnicas avanzadas como acrílico, gel y nail art.",
      },
      {
        q: "¿Cuánto tiempo tengo para completar el curso?",
        a: "Tienes acceso de por vida. Puedes avanzar a tu propio ritmo, sin fechas límite ni presión. El contenido siempre estará disponible para ti.",
      },
      {
        q: "¿El certificado tiene validez oficial?",
        a: "El certificado de CALUATNAILS es un certificado de finalización digital que acredita tu formación. Es ampliamente reconocido en el sector de la belleza y puede ser compartido en redes profesionales como LinkedIn.",
      },
    ],
  },
  {
    category: "Pagos y Acceso",
    items: [
      {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express) a través de Stripe, una plataforma de pagos segura y encriptada.",
      },
      {
        q: "¿Puedo pagar en cuotas?",
        a: "Actualmente ofrecemos el pago en un solo cobro. Si necesitas una opción de financiamiento, contáctanos y evaluaremos tu caso.",
      },
      {
        q: "¿Qué pasa si no quedo satisfecha con el curso?",
        a: "Ofrecemos garantía de satisfacción. Si en los primeros 7 días sientes que el curso no es para ti, contáctanos y gestionamos el reembolso sin preguntas.",
      },
      {
        q: "¿Puedo acceder desde varios dispositivos?",
        a: "Sí. Tu cuenta CALUATNAILS funciona en computadora, tablet y móvil. Solo necesitas iniciar sesión con tu correo y contraseña.",
      },
    ],
  },
  {
    category: "Reservas y Citas",
    items: [
      {
        q: "¿Cómo funciona el sistema de reservas?",
        a: "Puedes reservar una cita de consultoría o práctica guiada directamente desde la sección 'Reservar cita'. Elige el servicio, selecciona fecha y hora disponible, y completa el pago del depósito.",
      },
      {
        q: "¿Puedo cancelar o reprogramar mi cita?",
        a: "Sí. Puedes cancelar o reprogramar con al menos 24 horas de anticipación sin costo adicional. Para cambios con menos tiempo, contáctanos directamente.",
      },
      {
        q: "¿Las citas son presenciales o virtuales?",
        a: "Ofrecemos ambas modalidades. Al reservar puedes elegir si prefieres una sesión virtual por videollamada o presencial (según disponibilidad de ubicación).",
      },
    ],
  },
  {
    category: "Soporte Técnico",
    items: [
      {
        q: "No puedo acceder a mi cuenta, ¿qué hago?",
        a: "Ve a la página de inicio de sesión y usa la opción 'Olvidé mi contraseña'. Recibirás un correo con instrucciones para restablecerla. Si el problema persiste, escríbenos a soporte.",
      },
      {
        q: "Los videos no cargan correctamente",
        a: "Verifica tu conexión a internet. Si el problema continúa, intenta limpiar el caché del navegador o usa otro navegador (Chrome o Firefox recomendados). También puedes contactarnos con el nombre de la lección afectada.",
      },
      {
        q: "¿Cómo descargo los recursos del curso?",
        a: "En la sección 'Recursos Descargables' de la página principal encontrarás los materiales gratuitos. Los recursos completos están disponibles dentro de cada módulo del curso una vez que hayas adquirido el acceso.",
      },
    ],
  },
];

export default function FaqPage() {
  useSEO({
    title: "Preguntas Frecuentes — CALUATNAILS Barcelona",
    description: "Resuelve tus dudas sobre reservas, servicios, precios, ubicación y cancelaciones del salón CALUATNAILS en Barcelona.",
    ogTitle: "FAQ CALUATNAILS — Preguntas Frecuentes",
    ogDescription: "Todo sobre reservas, servicios y precios del salón CALUATNAILS en el Eixample, Barcelona.",
    ogUrl: "/faq",
    canonical: "/faq",
  });
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const navigate = useNavigate();

  const toggle = (key: string) => setOpenIndex(openIndex === key ? null : key);

  const allItems = faqs.flatMap(s => s.items);

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.caluatnails.com/" },
                  { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://www.caluatnails.com/faq" },
                ],
              },
              {
                "@type": "FAQPage",
                "@id": "https://www.caluatnails.com/faq#faq",
                "inLanguage": "es",
                "url": "https://www.caluatnails.com/faq",
                "name": "Preguntas frecuentes — CALUATNAILS",
                "publisher": { "@id": "https://www.caluatnails.com/#organization" },
                "mainEntity": allItems.map(({ q, a }) => ({
                  "@type": "Question",
                  "name": q,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": a,
                  },
                })),
              },
            ],
          })}
        </script>
      </Helmet>
      {/* Header */}
      <div className="bg-[#1A1A1A] pt-16 pb-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <a href="/" className="inline-block mb-8">
            <span className="font-playfair text-2xl font-bold tracking-widest text-white">
              <img src="/assets/caluatnails-logo.png" alt="Caluatnails" className="h-8 md:h-10 w-auto object-contain" />
            </span>
          </a>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-8 transition-colors cursor-pointer mx-auto"
          >
            <i className="ri-arrow-left-line"></i> Volver al inicio
          </button>
          <span className="text-rose-400 text-xs font-semibold tracking-widest uppercase mb-3 block">
            Centro de Ayuda
          </span>
          <h1 className="font-playfair text-4xl font-bold text-white mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Encuentra respuestas rápidas a las dudas más comunes sobre CALUATNAILS, el curso, pagos y soporte técnico.
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        {faqs.map((section) => (
          <div key={section.category} className="mb-12">
            <h2 className="font-playfair text-xl font-bold text-[#1A1A1A] mb-6 flex items-center gap-3">
              <span className="w-8 h-0.5 bg-rose-400 inline-block"></span>
              {section.category}
            </h2>
            <div className="flex flex-col gap-3">
              {section.items.map((item, i) => {
                const key = `${section.category}-${i}`;
                const isOpen = openIndex === key;
                return (
                  <div
                    key={key}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer group"
                    >
                      <span className="text-sm font-semibold text-[#1A1A1A] group-hover:text-rose-600 transition-colors pr-4">
                        {item.q}
                      </span>
                      <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <i className={`text-rose-400 text-base transition-transform duration-200 ${isOpen ? "ri-subtract-line" : "ri-add-line"}`}></i>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 border-t border-gray-50">
                        <p className="text-sm text-gray-500 leading-relaxed pt-4">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 text-center mt-4">
          <div className="w-12 h-12 flex items-center justify-center bg-rose-100 rounded-full mx-auto mb-4">
            <i className="ri-customer-service-2-line text-rose-500 text-xl"></i>
          </div>
          <h3 className="font-playfair text-lg font-bold text-[#1A1A1A] mb-2">
            ¿No encontraste tu respuesta?
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Nuestro equipo está disponible para ayudarte con cualquier duda.
          </p>
          <button
            onClick={() => navigate("/contacto")}
            className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
          >
            Contactar soporte
          </button>
        </div>
      </div>
    </div>
  );
}
