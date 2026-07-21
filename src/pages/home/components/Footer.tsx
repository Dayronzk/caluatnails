import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendBrevoEmail } from "@/lib/brevo";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) { setError("Por favor ingresa tu correo electrónico."); return; }
    setError("");
    setSubmitting(true);
    const body = new URLSearchParams();
    body.append("email", email);
    try {
      await fetch("https://readdy.ai/api/form/d76ll8kbmgf2o8mm7a90", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      sendBrevoEmail({
        type: "newsletter_welcome",
        to: { email },
        data: { email },
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const serviceLinks = [
    { label: "Manicura con Nivelación", path: "/servicios/manicura-con-nivelacion" },
    { label: "Uñas en Gel", path: "/servicios/unas-en-gel" },
    { label: "Pedicura Semipermanente", path: "/servicios/pedicura-semipermanente" },
    { label: "Suscripciones Mensuales", path: "/suscripciones" },
  ];

  const accountLinks = [
    { label: "Iniciar sesión", path: "/login" },
    { label: "Crear cuenta", path: "/registro" },
    { label: "Mi cuenta", path: "/mi-cuenta" },
    { label: "Reservar cita", path: "/reservar" },
  ];

  const supportLinks = [
    { label: "Preguntas Frecuentes", path: "/faq" },
    { label: "Contacto", path: "/contacto" },
    { label: "Política de Privacidad", path: "/privacidad" },
    { label: "Términos de Uso", path: "/terminos" },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-900 to-rose-950 text-white pt-16 pb-12 relative overflow-hidden">
      {/* Background soft blur blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
        {/* Newsletter Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-4xl p-8 lg:p-10 border border-white/15 shadow-soft-lg mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-rose-300 text-xs font-bold tracking-widest uppercase mb-2 block flex items-center gap-1.5">
                <i className="ri-sparkles-line" /> Newsletter Caluatnails
              </span>
              <h2 className="font-playfair text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-3">
                Promociones exclusivas y <span className="text-rose-300">Tips de Belleza</span>
              </h2>
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed max-w-md font-medium">
                Recibe consejos de cuidado de uñas, ofertas especiales del salón en Barcelona y novedades mensuales.
              </p>
            </div>

            <div>
              {submitted ? (
                <div className="bg-rose-950/60 border border-rose-500/40 rounded-3xl p-5 text-center shadow-soft-xs">
                  <div className="w-10 h-10 flex items-center justify-center bg-rose-500/30 rounded-full mx-auto mb-2 text-rose-300">
                    <i className="ri-check-line text-xl" />
                  </div>
                  <p className="text-white font-bold text-sm mb-1">¡Te has suscrito con éxito!</p>
                  <p className="text-white/60 text-xs font-medium">Revisa tu bandeja de entrada para ver el mensaje de bienvenida.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="tu@email.com"
                      className="flex-1 bg-white/15 border border-white/20 text-white text-xs sm:text-sm placeholder:text-white/40 rounded-full px-5 py-3.5 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-400/20 transition-all font-medium"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full transition-all cursor-pointer whitespace-nowrap shadow-soft-xs"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-1.5"><i className="ri-loader-4-line animate-spin" /> Enviando</span>
                      ) : (
                        "Suscribirme"
                      )}
                    </button>
                  </div>
                  {error && <p className="text-rose-300 text-xs font-medium">{error}</p>}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main Links Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 border-b border-white/10 pb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-soft-xs">
                <i className="ri-sparkles-line text-base" />
              </div>
              <span className="font-playfair text-2xl font-extrabold tracking-widest text-white">
                CALUATNAILS
              </span>
            </div>
            <p className="text-white/60 text-xs leading-relaxed max-w-sm font-medium">
              Atelier especializado de manicura, pedicura, uñas en gel, mirada y estética en el Eixample, Barcelona. Cuidado artesanal, higiene rigurosa y acabado impecable.
            </p>
            <div className="space-y-1.5 text-xs text-white/70 font-medium pt-1">
              <div className="flex items-center gap-2">
                <i className="ri-map-pin-line text-rose-400" />
                <span>Calle Padilla 301, 08025 Barcelona (Eixample)</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-phone-line text-rose-400" />
                <a href="https://wa.me/34635797539" target="_blank" rel="noopener noreferrer" className="hover:text-rose-300">
                  +34 635 797 539
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: "ri-instagram-line", href: "https://instagram.com/caluatnails" },
                { icon: "ri-whatsapp-line", href: "https://wa.me/34635797539" },
              ].map(({ icon, href }) => (
                <a
                  key={icon}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-rose-500 text-white/70 hover:text-white transition-all cursor-pointer shadow-soft-xs"
                >
                  <i className={`${icon} text-base`} />
                </a>
              ))}
            </div>
          </div>

          {/* Servicios */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider font-playfair">Servicios</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="text-white/60 hover:text-rose-300 transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Mi Cuenta */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider font-playfair">Mi Cuenta</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="text-white/60 hover:text-rose-300 transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider font-playfair">Soporte</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="text-white/60 hover:text-rose-300 transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50 font-medium">
          <p>&copy; {new Date().getFullYear()} CALUATNAILS — Salón Premium de Manicura y Pedicura.</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate("/privacidad")} className="hover:text-rose-300 transition-colors">
              Privacidad
            </button>
            <span>·</span>
            <button type="button" onClick={() => navigate("/terminos")} className="hover:text-rose-300 transition-colors">
              Términos
            </button>
            <span>·</span>
            <span className="flex items-center gap-1 text-rose-300">
              <i className="ri-shield-check-line" /> Reserva Segura
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
