import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";

const sections = [
  {
    title: "1. Aceptación de los términos",
    content: `Al acceder y usar la plataforma CALUATNAILS, aceptas quedar vinculado por estos Términos de Uso. Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestra plataforma.

Estos términos se aplican a todos los usuarios, incluyendo visitantes, clientes registrados y administradores.`,
  },
  {
    title: "2. Descripción del servicio",
    content: `CALUATNAILS es una plataforma de servicios de belleza y bienestar en línea que ofrece:

• Sistema de reservas para citas de manicura, pedicura y otros servicios de belleza en el salón
• Suscripciones mensuales de servicios estéticos premium
• Tarjetas de regalo físicas y digitales
• Canal de comunicación y soporte para clientes

El acceso y reserva de servicios requiere el registro y aceptación de las condiciones correspondientes.`,
  },
  {
    title: "3. Registro y cuenta de usuario",
    content: `Para realizar reservas y gestionar tus citas debes crear una cuenta con información veraz y actualizada. Eres responsable de:

• Mantener la confidencialidad de tu contraseña
• Todas las actividades que ocurran bajo tu cuenta
• Notificarnos inmediatamente si sospechas acceso no autorizado

No puedes compartir tu cuenta con otras personas. Cada licencia es personal e intransferible.`,
  },
  {
    title: "4. Pagos y reembolsos",
    content: `Los pagos se procesan de forma segura a través de Stripe. Al realizar una compra o reserva:

• El cargo se realiza de forma inmediata al confirmar la reserva o compra
• Recibirás un correo de confirmación con los detalles del servicio o producto
• La cita se registra automáticamente en nuestra agenda tras el pago exitoso del depósito

Política de cancelación: Ofrecemos reembolso completo del depósito de reserva si cancelas con al menos 24 horas de antelación. Para cancelaciones fuera de este plazo, el depósito no será reembolsable. Para cualquier consulta, contáctanos en hola@caluatnails.com.`,
  },
  {
    title: "5. Propiedad intelectual",
    content: `Todo el contenido de CALUATNAILS — incluyendo textos, imágenes, diseño y código — es propiedad exclusiva de CALUATNAILS y está protegido por leyes de derechos de autor.

Está estrictamente prohibido:
• Reproducir, distribuir o vender el contenido de la plataforma
• Compartir credenciales de acceso con terceros
• Usar el contenido con fines comerciales sin licencia expresa

El incumplimiento puede resultar en la cancelación inmediata de tu cuenta sin reembolso.`,
  },
  {
    title: "6. Conducta en el foro",
    content: `El canal de soporte y WhatsApp de CALUATNAILS es un espacio de comunicación. Al participar, te comprometes a:

• Mantener un trato respetuoso con nuestro personal
• No enviar contenido ofensivo, discriminatorio o spam
• No compartir información personal de terceros sin su consentimiento

CALUATNAILS se reserva el derecho de suspender cuentas que violen estas normas.`,
  },
  {
    title: "7. Limitación de responsabilidad",
    content: `CALUATNAILS proporciona los servicios estéticos de acuerdo a los más altos estándares profesionales.

La plataforma se ofrece "tal como está". No somos responsables de interrupciones temporales del servicio de reserva, pérdida de datos o daños indirectos derivados del uso de la plataforma.`,
  },
  {
    title: "8. Modificaciones",
    content: `CALUATNAILS se reserva el derecho de modificar estos Términos de Uso en cualquier momento. Los cambios significativos serán notificados por correo electrónico con al menos 15 días de anticipación. El uso continuado de la plataforma tras los cambios implica la aceptación de los nuevos términos.`,
  },
  {
    title: "9. Ley aplicable",
    content: `Estos términos se rigen por las leyes aplicables en la jurisdicción donde opera CALUATNAILS. Cualquier disputa será resuelta mediante negociación amistosa o, en su defecto, ante los tribunales competentes.`,
  },
];

export default function TerminosPage() {
  useSEO({
    title: "Términos y Condiciones",
    description: "Términos y condiciones de uso del salón y la plataforma CALUATNAILS.",
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
            Bienvenida a <strong>CALUATNAILS</strong>. Por favor, lee estos Términos de Uso detenidamente antes de usar nuestra plataforma. Al registrarte o realizar una reserva, confirmas que has leído, entendido y aceptado estos términos.
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
