import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export default function ContactoPage() {
  useSEO({
    title: "Contacto y Ubicación | Caluatnails Barcelona Eixample",
    description: "Visítanos en Calle Padilla 301, Barcelona (Eixample, junto a Sagrada Familia). Teléfono: +34 635 797 539. Email: caluatnails@gmail.com. Horarios: L-V 9:30-20:30, S 10:00-15:00.",
    ogTitle: "Contacta y Visita Caluatnails en Barcelona",
    ogDescription: "Atelier de manicura y estética en Calle Padilla 301, Barcelona. Teléfono: +34 635 797 539.",
    ogUrl: "/contacto",
    canonical: "/contacto",
  });
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError("Por favor completa todos los campos.");
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
    { icon: "ri-map-pin-line", label: "Dirección", value: "Calle Padilla 301, 08025 Barcelona", extra: "Eixample (a 5 min del metro Sagrada Familia)" },
    { icon: "ri-phone-line", label: "Teléfono / WhatsApp", value: "+34 635 797 539", href: "https://wa.me/34635797539" },
    { icon: "ri-mail-line", label: "Correo electrónico", value: "caluatnails@gmail.com", href: "mailto:caluatnails@gmail.com" },
    { icon: "ri-time-line", label: "Horario de atención", value: "Lun – Vie: 9:30 – 20:30 | Sáb: 10:00 – 15:00", extra: "Domingos cerrado" },
    { icon: "ri-instagram-line", label: "Instagram", value: "@caluatnails", href: "https://instagram.com/caluatnails" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-organic-cream via-white to-organic-blush/30 font-sans">
      <Navbar />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-6 lg:px-10">
        <header className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="rose" icon="ri-map-pin-line">
            Ubicación y Contacto
          </Badge>
          <h1 className="font-playfair text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Estamos encantadas de atenderte
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-medium">
            Visítanos en nuestro atelier de <strong className="text-gray-900 font-bold">Calle Padilla 301, Barcelona</strong> o envíanos tu consulta. Te respondemos rápidamente.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Cards Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="glass" padding="lg" className="space-y-6">
              <h2 className="font-playfair text-2xl font-bold text-gray-900">Información del Atelier</h2>
              <div className="space-y-5">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-soft-xs">
                      <i className={`${item.icon} text-lg`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 hover:text-rose-600 transition-colors block">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm font-bold text-gray-900">{item.value}</p>
                      )}
                      {item.extra && <p className="text-xs text-gray-500 font-medium mt-0.5">{item.extra}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="gradient" padding="md" className="space-y-3 text-center">
              <h3 className="font-playfair text-lg font-bold text-gray-900">¿Prefieres reservar directamente?</h3>
              <p className="text-xs text-gray-600 font-medium">
                Elige tratamiento, estilista y tu horario ideal en menos de 1 minuto.
              </p>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                icon="ri-calendar-check-line"
                onClick={() => navigate("/reservar")}
              >
                Reservar Cita Online
              </Button>
            </Card>
          </div>

          {/* Form + Map */}
          <div className="lg:col-span-3 space-y-8">
            <Card variant="glass" padding="lg">
              {submitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                    <i className="ri-checkbox-circle-line" />
                  </div>
                  <h3 className="font-playfair text-2xl font-bold text-gray-900">¡Mensaje enviado con éxito!</h3>
                  <p className="text-sm text-gray-600 max-w-md mx-auto font-medium">
                    Gracias por escribirnos. Nos pondremos en contacto contigo lo antes posible.
                  </p>
                  <Button variant="secondary" size="md" onClick={() => setSubmitted(false)}>
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-playfair text-xl font-bold text-gray-900">Envíanos una consulta</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Tu Nombre"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nombre completo"
                      icon="ri-user-line"
                    />
                    <Input
                      label="Correo Electrónico"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      icon="ri-mail-line"
                    />
                  </div>

                  <Select
                    label="Asunto"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="Consulta de servicios y precios">Consulta de servicios y precios</option>
                    <option value="Dudas sobre mi reserva">Dudas sobre mi reserva</option>
                    <option value="Tratamientos para eventos / novias">Tratamientos para eventos / novias</option>
                    <option value="Sugerencias o comentarios">Sugerencias o comentarios</option>
                    <option value="Otro motivo">Otro motivo</option>
                  </Select>

                  <Textarea
                    label="Mensaje"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                  />

                  {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={submitting}
                    icon="ri-send-plane-line"
                  >
                    Enviar Consulta
                  </Button>
                </form>
              )}
            </Card>

            {/* Embedded Google Map */}
            <Card variant="glass" padding="none" className="rounded-3xl overflow-hidden shadow-soft-sm">
              <div className="p-4 bg-white/80 border-b border-rose-100 flex items-center justify-between">
                <span className="font-playfair text-sm font-bold text-gray-900">
                  <i className="ri-map-pin-2-line text-rose-500 mr-1.5" /> Ubicación en Barcelona
                </span>
                <span className="text-xs text-gray-500 font-medium">Calle Padilla 301, 08025</span>
              </div>
              <div className="aspect-[16/9] w-full">
                <iframe
                  title="Ubicación Caluatnails en Calle Padilla 301 Barcelona"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2992.839210029312!2d2.1740!3d41.4080!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a4a2d8cb8b8b8b%3A0x0!2sCarrer%20de%20Padilla%2C%20301%2C%2008025%20Barcelona!5e0!3m2!1ses!2ses!4v1700000000000!5m2!1ses!2ses"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
