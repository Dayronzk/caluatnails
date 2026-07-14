import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";

const sections = [
  {
    title: "1. Información que recopilamos",
    content: `Al registrarte en CALUATNAILS, recopilamos la siguiente información personal:
    
• Nombre completo y dirección de correo electrónico
• Contraseña (almacenada de forma encriptada, nunca en texto plano)
• Información de pago procesada de forma segura por Stripe (no almacenamos datos de tarjetas)
• Progreso dentro del curso y actividad en el foro
• Datos de reservas de citas (nombre, correo, servicio seleccionado, fecha y hora)

Esta información es necesaria para brindarte acceso al curso, gestionar tu cuenta y mejorar tu experiencia en la plataforma.`,
  },
  {
    title: "2. Cómo usamos tu información",
    content: `Utilizamos tu información personal para:

• Crear y gestionar tu cuenta de usuario
• Procesar pagos y emitir confirmaciones de compra
• Enviarte actualizaciones del curso y comunicaciones relevantes (solo si te suscribiste)
• Gestionar reservas de citas y enviarte recordatorios
• Mejorar el contenido y la experiencia de la plataforma
• Cumplir con obligaciones legales y fiscales

Nunca vendemos, alquilamos ni compartimos tu información personal con terceros con fines comerciales.`,
  },
  {
    title: "3. Cookies y tecnologías de seguimiento",
    content: `CALUATNAILS utiliza cookies esenciales para el funcionamiento de la plataforma (sesión de usuario, preferencias). También podemos usar cookies analíticas para entender cómo se usa el sitio y mejorar la experiencia.

Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades del sitio.`,
  },
  {
    title: "4. Seguridad de los datos",
    content: `Tomamos la seguridad de tu información muy en serio. Implementamos medidas técnicas y organizativas para proteger tus datos:

• Conexiones cifradas mediante HTTPS/TLS
• Contraseñas almacenadas con hash seguro (bcrypt)
• Pagos procesados por Stripe, certificado PCI DSS
• Acceso restringido a datos personales solo para personal autorizado
• Copias de seguridad regulares de la base de datos`,
  },
  {
    title: "5. Tus derechos",
    content: `Como usuario de CALUATNAILS, tienes los siguientes derechos sobre tus datos personales:

• Acceso: Puedes solicitar una copia de los datos que tenemos sobre ti
• Rectificación: Puedes corregir información incorrecta desde tu perfil
• Eliminación: Puedes solicitar la eliminación de tu cuenta y datos asociados
• Portabilidad: Puedes solicitar tus datos en formato exportable
• Oposición: Puedes cancelar la suscripción al newsletter en cualquier momento

Para ejercer cualquiera de estos derechos, contáctanos en hola@caluatnails.com.`,
  },
  {
    title: "6. Retención de datos",
    content: `Conservamos tu información personal mientras tu cuenta esté activa o sea necesaria para prestarte el servicio. Si solicitas la eliminación de tu cuenta, eliminaremos tus datos personales en un plazo de 30 días, excepto aquellos que debamos conservar por obligaciones legales o fiscales.`,
  },
  {
    title: "7. Cambios en esta política",
    content: `Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos por correo electrónico sobre cambios significativos. La fecha de última actualización siempre estará visible al inicio de este documento.`,
  },
  {
    title: "8. Contacto",
    content: `Si tienes preguntas sobre esta política o sobre cómo manejamos tus datos, puedes contactarnos en:

Correo: hola@caluatnails.com
Plataforma: CALUATNAILS — Curso Profesional de Manicura y Pedicura`,
  },
];

export default function PrivacidadPage() {
  useSEO({
    title: "Política de Privacidad",
    description: "Política de privacidad de CALUATNAILS: qué datos recopilamos, cómo los usamos y tus derechos.",
    ogUrl: "/privacidad",
    canonical: "/privacidad",
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
            Política de Privacidad
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
            En <strong>CALUATNAILS</strong> nos comprometemos a proteger tu privacidad. Esta política explica qué información recopilamos, cómo la usamos y cuáles son tus derechos. Al usar nuestra plataforma, aceptas las prácticas descritas en este documento.
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
            onClick={() => navigate("/terminos")}
            className="border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-200 text-sm font-semibold px-6 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
          >
            Ver Términos de Uso
          </button>
        </div>
      </div>
    </div>
  );
}
