import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

type PageState = "loading" | "form" | "success" | "invalid";

export default function NuevaContrasenaPage() {
  useSEO({
    title: "Nueva Contraseña",
    description: "Establece tu nueva contraseña.",
    ogUrl: "/nueva-contrasena",
    canonical: "/nueva-contrasena",
    noindex: true,
  });
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Supabase may already have consumed the recovery hash before we mounted
    // (detectSessionInUrl: true). Check for an existing session first.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setPageState("form");
        return;
      }
      // No session yet — listen for the PASSWORD_RECOVERY event in case the
      // client is still processing the hash.
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          setPageState("form");
        }
      });
      // Fallback: mark invalid after 2s if nothing arrived.
      const t = setTimeout(() => {
        setPageState((prev) => (prev === "loading" ? "invalid" : prev));
      }, 2000);
      return () => {
        sub.subscription.unsubscribe();
        clearTimeout(t);
      };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      const raw = updateError.message || "";
      console.error("[nueva-contrasena] updateUser failed:", updateError);
      if (/same.*password|new password should be different/i.test(raw)) {
        setError("La nueva contraseña no puede ser la misma que la anterior.");
      } else if (/expired|invalid|jwt|session/i.test(raw)) {
        setError("El enlace ha expirado o ya fue usado. Solicita uno nuevo desde /recuperar.");
      } else {
        setError(`No se pudo actualizar la contraseña: ${raw}`);
      }
      return;
    }

    setPageState("success");
    setTimeout(() => navigate("/login"), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="font-playfair text-3xl font-bold tracking-widest text-[#1A1A1A]">
              <img src="/assets/caluatnails-logo.png" alt="Caluatnails" className="h-8 md:h-10 w-auto object-contain" />
            </span>
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Nueva contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">Elige una contraseña segura para tu cuenta</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          {pageState === "loading" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader className="w-8 h-8 text-rose-400 animate-spin" />
              <p className="text-sm text-gray-500">Verificando enlace...</p>
            </div>
          )}

          {pageState === "invalid" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-5">
                <i className="ri-error-warning-line text-rose-500 text-2xl"></i>
              </div>
              <h3 className="font-playfair text-xl font-bold text-[#1A1A1A] mb-2">
                Enlace inválido o expirado
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Este enlace de recuperación ya no es válido. Los enlaces expiran después de 1 hora por seguridad.
              </p>
              <Link
                to="/recuperar"
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line"></i>
                Solicitar nuevo enlace
              </Link>
            </div>
          )}

          {pageState === "success" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <i className="ri-shield-check-line text-emerald-500 text-2xl"></i>
              </div>
              <h3 className="font-playfair text-xl font-bold text-[#1A1A1A] mb-2">
                ¡Contraseña actualizada!
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Tu contraseña ha sido cambiada exitosamente. Redirigiendo al inicio de sesión...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 font-medium cursor-pointer transition-colors"
              >
                <i className="ri-arrow-left-line"></i>
                Ir al inicio de sesión
              </Link>
            </div>
          )}

          {pageState === "form" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                  <i className="ri-error-warning-line text-base shrink-0"></i>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repite tu nueva contraseña"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm"
                />
              </div>

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          password.length >= level * 3
                            ? password.length >= 10
                              ? "bg-emerald-400"
                              : password.length >= 7
                              ? "bg-amber-400"
                              : "bg-rose-400"
                            : "bg-gray-100"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {password.length < 6
                      ? "Muy corta"
                      : password.length < 8
                      ? "Débil"
                      : password.length < 10
                      ? "Aceptable"
                      : "Segura"}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Guardando...</>
                ) : (
                  <><i className="ri-lock-password-line"></i> Guardar nueva contraseña</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
