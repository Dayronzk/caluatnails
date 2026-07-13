import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";

const sections = [
  {
    title: "1. Aceptación de los términos",
    content: `Al acceder y usar la plataforma NAILOX, aceptas quedar vinculado por estos Términos de Uso. Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestra plataforma.

Estos términos se aplican a todos los usuarios, incluyendo visitantes, estudiantes registrados y administradores.`,
  },
  {
    title: "2. Descripción del servicio",
    content: `NAILOX es una plataforma educativa en línea que ofrece:

• Curso de manicura y pedicura profesional con módulos de video y texto
• Recursos descargables (fichas técnicas, guías, plantillas)
• Evaluaciones automáticas y certificado digital de finalización
• Foro de discusión para la comunidad de estudiantes
• Sistema de reservas para citas de consultoría y práctica guiada

El acceso al curso completo requiere la adquisición del producto. Algunos recursos son gratuitos y están disponibles sin registro.`,
  },
  {
    title: "3. Registro y cuenta de usuario",
    content: `Para acceder al curso debes crear una cuenta con información veraz y actualizada. Eres responsable de:

• Mantener la confidencialidad de tu contraseña
• Todas las actividades que ocurran bajo tu cuenta
• Notificarnos inmediatamente si sospechas acceso no autorizado

No puedes compartir tu cuenta con otras personas. Cada licencia es personal e intransferible.`,
  },
  {
    title: "4. Pagos y reembolsos",
    content: `Los pagos se procesan de forma segura a través de Stripe. Al realizar una compra:

• El cargo se realiza de forma inmediata al confirmar el pago
• Recibirás un correo de confirmación con los detalles de tu compra
• El acceso al curso se activa automáticamente tras el pago exitoso

Política de reembolso: Ofrecemos reembolso completo dentro de los primeros 7 días naturales desde la compra, siempre que no hayas completado más del 20% del contenido del curso. Para solicitar un reembolso, contáctanos en hola@nailox.com.`,
  },
  {
    title: "5. Propiedad intelectual",
    content: `Todo el contenido de NAILOX — incluyendo videos, textos, imágenes, recursos descargables, diseño y código — es propiedad exclusiva de NAILOX y está protegido por leyes de derechos de autor.

Está estrictamente prohibido:
• Reproducir, distribuir o vender el contenido del curso
• Compartir credenciales de acceso con terceros
• Grabar o capturar el contenido de video sin autorización
• Usar el contenido con fines comerciales sin licencia expresa

El incumplimiento puede resultar en la cancelación inmediata de tu acceso sin reembolso.`,
  },
  {
    title: "6. Conducta en el foro",
    content: `El foro de NAILOX es un espacio de aprendizaje y comunidad. Al participar, te comprometes a:

• Mantener un trato respetuoso con otros estudiantes
• No publicar contenido ofensivo, discriminatorio o spam
• No compartir información personal de terceros sin su consentimiento
• No promocionar productos o servicios externos sin autorización

NAILOX se reserva el derecho de eliminar contenido inapropiado y suspender cuentas que violen estas normas.`,
  },
  {
    title: "7. Limitación de responsabilidad",
    content: `NAILOX proporciona el contenido educativo con fines informativos y formativos. No garantizamos resultados económicos específicos derivados del uso del curso.

La plataforma se ofrece "tal como está". No somos responsables de interrupciones del servicio, pérdida de datos o daños indirectos derivados del uso de la plataforma.`,
  },
  {
    title: "8. Modificaciones",
    content: `NAILOX se reserva el derecho de modificar estos Términos de Uso en cualquier momento. Los cambios significativos serán notificados por correo electrónico con al menos 15 días de anticipación. El uso continuado de la plataforma tras los cambios implica la aceptación de los nuevos términos.`,
  },
  {
    title: "9. Ley aplicable",
    content: `Estos términos se rigen por las leyes aplicables en la jurisdicción donde opera NAILOX. Cualquier disputa será resuelta mediante negociación amistosa o, en su defecto, ante los tribunales competentes.`,
  },
];

export default function TerminosPage() {
  useSEO({
    title: "Términos y Condiciones",
    description: "Términos y condiciones de uso del salón y la plataforma NAILOX.",
    ogUrl: "/terminos",
    canonical: "/terminos",
  });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-[#1A1A1A] pt-16 pb-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <a href="/" className="inline-block mb-8">
            <span className="font-playfair text-2xl font-bold tracking-widest text-white">
              NAIL<span className="text-rose-400">OX</span>
            </span>
          </a>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-8 transition-colors cursor-pointer mx-auto"
          >
            <i className="ri-arrow-left-line"></i> Volver al inicio
          </button>
          <span className="text-rose-400 text-xs font-semibold tracking-widest uppercase mb-3 block">
            Legal
          </span>
          <h1 className="font-playfair text-4xl font-bold text-white mb-4">
            Términos de Uso
          </h1>
          <p className="text-white/50 text-sm">
            Última actualización: 2 de abril de 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 mb-10">
          <p className="text-sm text-gray-600 leading-relaxed">
            Bienvenida a <strong>NAILOX</strong>. Por favor, lee estos Términos de Uso detenidamente antes de usar nuestra plataforma. Al registrarte o acceder al contenido, confirmas que has leído, entendido y aceptado estos términos.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-playfair text-lg font-bold text-[#1A1A1A] mb-3">{section.title}</h2>
              <div className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{section.content}</div>
              <div className="mt-6 border-b border-gray-100"></div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/contacto")}
            className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
          >
            Contactar soporte
          </button>
          <button
            onClick={() => navigate("/privacidad")}
            className="border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-200 text-sm font-semibold px-6 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
          >
            Ver Política de Privacidad
          </button>
        </div>
      </div>
    </div>
  );
}
