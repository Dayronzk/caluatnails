import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";

export default function ContactoPage() {
  useSEO({
    title: "Contacto — Soporte CALUATNAILS",
    description: "¿Tienes dudas o necesitas ayuda? Escríbenos y te respondemos en menos de 24 horas. Soporte por email, WhatsApp e Instagram.",
    ogTitle: "Contacta con CALUATNAILS — Estamos aquí para ti",
    ogDescription: "Nuestro equipo responde en menos de 24 horas. Escríbenos por email, WhatsApp o Instagram.",
    ogUrl: "/contacto",
    canonical: "/contacto",
  });
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "message") {
      if (value.length > 500) return;
      setCharCount(value.length);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (formData.message.length > 500) {
      setError("El mensaje no puede superar los 500 caracteres.");
      return;
    }
    setError("");
    setSubmitting(true);
    const body = new URLSearchParams();
    body.append("name", formData.name);
    body.append("email", formData.email);
    body.append("subject", formData.subject);
    body.append("message", formData.message);
    try {
      await fetch("https://readdy.ai/api/form/d77832abj7ht1ofp4fpg", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: "ri-mail-line", label: "Correo electrónico", value: "hola@caluatnails.com" },
    { icon: "ri-time-line", label: "Horario de atención", value: "Lun – Vie, 9:00 – 18:00" },
    { icon: "ri-instagram-line", label: "Instagram", value: "@caluatnails.oficial" },
    { icon: "ri-whatsapp-line", label: "WhatsApp", value: "+1 (555) 000-0000" },
  ];

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
            Estamos aquí para ti
          </span>
          <h1 className="font-playfair text-4xl font-bold text-white mb-4">
            Contacto
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            ¿Tienes alguna duda, sugerencia o necesitas ayuda? Escríbenos y te respondemos en menos de 24 horas.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <h2 className="font-playfair text-xl font-bold text-[#1A1A1A] mb-2">Información de contacto</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Puedes escribirnos por cualquiera de estos canales. Nuestro equipo de soporte está listo para ayudarte.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-rose-50 rounded-xl flex-shrink-0">
                    <i className={`${item.icon} text-rose-500 text-base`}></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 mt-2">
              <p className="text-xs font-semibold text-rose-600 mb-1">Tiempo de respuesta</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Respondemos todos los mensajes en un plazo máximo de <strong>24 horas hábiles</strong>. Para urgencias, usa WhatsApp.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 flex items-center justify-center bg-rose-100 rounded-full mx-auto mb-5">
                    <i className="ri-check-double-line text-rose-500 text-2xl"></i>
                  </div>
                  <h3 className="font-playfair text-xl font-bold text-[#1A1A1A] mb-2">¡Mensaje enviado!</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Gracias por escribirnos. Te responderemos a <strong>{formData.email}</strong> en menos de 24 horas.
                  </p>
                  <button
                    onClick={() => navigate("/")}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Volver al inicio
                  </button>
                </div>
              ) : (
                <form id="contacto-form" data-readdy-form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <h3 className="font-playfair text-lg font-bold text-[#1A1A1A]">Envíanos un mensaje</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500">Nombre completo</label>
                      <input
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-rose-400 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500">Correo electrónico</label>
                      <input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@correo.com"
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-rose-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500">Asunto</label>
                    <select
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-rose-400 transition-colors bg-white cursor-pointer"
                    >
                      <option value="">Selecciona un asunto</option>
                      <option value="Consulta sobre el curso">Consulta sobre el curso</option>
                      <option value="Problema de acceso">Problema de acceso</option>
                      <option value="Pagos y facturación">Pagos y facturación</option>
                      <option value="Reserva de cita">Reserva de cita</option>
                      <option value="Sugerencia o feedback">Sugerencia o feedback</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500">Mensaje</label>
                    <textarea
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                      rows={5}
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-rose-400 transition-colors resize-none"
                    />
                    <p className={`text-xs text-right ${charCount >= 500 ? "text-rose-500" : "text-gray-400"}`}>
                      {charCount}/500
                    </p>
                  </div>

                  {error && (
                    <p className="text-rose-500 text-xs flex items-center gap-1.5">
                      <i className="ri-error-warning-line"></i> {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><i className="ri-loader-4-line animate-spin"></i> Enviando...</>
                    ) : (
                      <><i className="ri-send-plane-line"></i> Enviar mensaje</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
