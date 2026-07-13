import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

export default function RecuperarPage() {
  useSEO({
    title: "Recuperar Contraseña",
    description: "Recupera tu contraseña de NAILOX.",
    ogUrl: "/recuperar",
    canonical: "/recuperar",
    noindex: true,
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Generate the real Supabase password reset link via the resend-email edge function
      // The edge function uses the Admin API to generate the link and sends it via Resend
      const siteUrl = window.location.origin;
      const redirectTo = `${siteUrl}/nueva-contrasena`;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/resend-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          type: "password_reset",
          to: { email: email.trim() },
          data: { email: email.trim(), redirectTo },
        }),
      });

      const result = await res.json() as { success: boolean; error?: string };

      setLoading(false);

      if (!result.success) {
        if (result.error === "USER_NOT_FOUND") {
          setError("USER_NOT_FOUND");
          return;
        }
        console.warn("Password reset email result:", result.error);
      }

      // Show success if not a specific user error
      setSent(true);
    } catch (err) {
      setLoading(false);
      console.error("Password reset error:", err);
      // Fallback for unexpected errors
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="font-playfair text-3xl font-bold tracking-widest text-[#1A1A1A]">
              NAIL<span className="text-rose-400">OX</span>
            </span>
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Recuperar contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-5">
                <i className="ri-mail-check-line text-rose-500 text-2xl"></i>
              </div>
              <h3 className="font-playfair text-xl font-bold text-[#1A1A1A] mb-2">
                ¡Correo enviado!
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                Hemos enviado un enlace de recuperación a
              </p>
              <p className="text-sm font-semibold text-[#1A1A1A] mb-6">{email}</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-8">
                Revisa tu bandeja de entrada y también la carpeta de spam. El enlace expira en 1 hora.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 font-medium cursor-pointer transition-colors"
              >
                <i className="ri-arrow-left-line"></i>
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
               {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <i className="ri-error-warning-line text-base shrink-0"></i>
                    {error === "USER_NOT_FOUND" ? "No existe ninguna cuenta con este correo." : error}
                  </div>
                  {error === "USER_NOT_FOUND" && (
                    <Link 
                      to="/registro" 
                      className="bg-rose-600 text-white text-center py-2.5 rounded-lg font-bold hover:bg-rose-700 transition-colors shadow-sm"
                    >
                      Crear una cuenta gratis
                    </Link>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Ingresa el email con el que te registraste en NAILOX.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><i className="ri-send-plane-line"></i> Enviar enlace de recuperación</>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                ¿Recordaste tu contraseña?{" "}
                <Link
                  to="/login"
                  className="text-rose-600 font-medium hover:text-rose-700 cursor-pointer"
                >
                  Iniciar sesión
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
