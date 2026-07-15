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
      // Send newsletter welcome email via Brevo
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

  const handleScroll = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-[#1A1A1A]">
      {/* Top CTA */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span className="text-rose-400 text-xs font-semibold tracking-widest uppercase mb-3 block">
                Únete a la Newsletter
              </span>
              <h2 className="font-playfair text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
                Descubre Promociones y
                <br />
                <span className="text-rose-400">Tips de Belleza</span>
              </h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-md">
                Suscríbete para recibir consejos de cuidado de uñas, promociones especiales del salón y novedades en nuestro catálogo de servicios.
              </p>
            </div>

            {/* Right - Newsletter */}
            <div>
              {submitted ? (
                <div className="bg-rose-900/30 border border-rose-700/30 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 flex items-center justify-center bg-rose-500/20 rounded-full mx-auto mb-3">
                    <i className="ri-check-line text-2xl text-rose-400"></i>
                  </div>
                  <p className="text-white font-semibold text-base mb-1">¡Suscripción exitosa!</p>
                  <p className="text-white/50 text-sm">Te enviaremos novedades y contenido exclusivo a tu correo.</p>
                </div>
              ) : (
                <form
                  id="newsletter-form"
                  data-readdy-form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-3"
                >
                  <label className="text-white/50 text-xs">Tu correo electrónico</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="ejemplo@correo.com"
                      className="flex-1 bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/30 rounded-full px-5 py-3 focus:outline-none focus:border-rose-400 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap text-sm"
                    >
                      {submitting ? (
                        <><i className="ri-loader-4-line animate-spin mr-1.5"></i>Enviando</>
                      ) : (
                        "Suscribirme"
                      )}
                    </button>
                  </div>
                  {error && <p className="text-rose-400 text-xs">{error}</p>}
                  <p className="text-white/30 text-xs">Sin spam. Puedes cancelar en cualquier momento.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            {/* CALUATNAILS Logo */}
            <div className="mb-4">
              <span className="font-playfair text-3xl font-bold tracking-widest text-white">
                <img src="/assets/caluatnails-logo.png" alt="Caluatnails" className="h-8 md:h-10 w-auto object-contain" />
              </span>
            </div>
            <p className="text-white/40 text-xs leading-relaxed mb-5">
              Salón premium de manicura y pedicura en el Eixample, Barcelona. Cuidado de lujo y precisión para tus uñas.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: "ri-instagram-line", href: "#" },
                { icon: "ri-facebook-circle-line", href: "#" },
                { icon: "ri-youtube-line", href: "#" },
                { icon: "ri-tiktok-line", href: "#" },
              ].map(({ icon, href }) => (
                <a
                  key={icon}
                  href={href}
                  rel="nofollow"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-rose-600 text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <i className={`${icon} text-sm`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5">Servicios</h4>
            <ul className="flex flex-col gap-3">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-white/40 hover:text-white/80 text-xs transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Mi Cuenta */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5">Mi Cuenta</h4>
            <ul className="flex flex-col gap-3">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-white/40 hover:text-white/80 text-xs transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5">Soporte</h4>
            <ul className="flex flex-col gap-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-white/40 hover:text-white/80 text-xs transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} CALUATNAILS — Salón Premium de Manicura y Pedicura. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/privacidad")}
              className="text-white/30 hover:text-white/60 text-xs transition-colors cursor-pointer"
            >
              Privacidad
            </button>
            <span className="text-white/20 text-xs">·</span>
            <button
              onClick={() => navigate("/terminos")}
              className="text-white/30 hover:text-white/60 text-xs transition-colors cursor-pointer"
            >
              Términos
            </button>
            <span className="text-white/20 text-xs">·</span>
            <div className="flex items-center gap-2">
              <i className="ri-shield-check-line text-rose-500 text-sm"></i>
              <span className="text-white/30 text-xs">Reserva 100% Segura</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
