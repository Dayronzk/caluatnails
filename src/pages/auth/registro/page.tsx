import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader } from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function RegistroPage() {
  useSEO({
    title: "Crear Cuenta",
    description: "Crea tu cuenta CALUATNAILS para reservar citas y gestionar tus servicios.",
    ogUrl: "/registro",
    canonical: "/registro",
    noindex: true,
  });
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isPhoneValid = !form.phone || isValidPhoneNumber(form.phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.phone || !isValidPhoneNumber(form.phone)) {
      setError("Por favor, introduce un número de teléfono válido.");
      return;
    }
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (form.password !== form.confirm) { setError("Las contraseñas no coinciden."); return; }

    setLoading(true);

    const { error: authError } = await signUp(form.email, form.password, form.name, form.phone);
    setLoading(false);

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("already registered")) {
        setError("Este email ya tiene una cuenta. Inicia sesión en su lugar.");
      } else if (msg.includes("rate limit") || msg.includes("too many requests")) {
        setError("Demasiados intentos seguidos. Por favor, espera unos minutos antes de volver a intentarlo.");
      } else {
        setError(authError.message);
      }
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="font-playfair text-3xl font-bold tracking-widest text-[#1A1A1A]">
              <img src="/assets/caluatnails-logo.png" alt="Caluatnails" className="h-8 md:h-10 w-auto object-contain" />
            </span>
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Crear tu cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Únete y comienza tu formación profesional</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <i className="ri-mail-check-line text-3xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¡Revisa tu correo!</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Te hemos enviado un email a <strong className="text-gray-700">{form.email}</strong> con un enlace para confirmar tu cuenta.
              </p>
              <p className="text-gray-400 text-xs mt-3">
                Una vez confirmes tu email, podrás acceder a tu cuenta.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-6 w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Ir al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                  <i className="ri-error-warning-line text-base shrink-0"></i>{error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  placeholder="Ej: Ana García"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono móvil</label>
                <PhoneInput
                  international
                  defaultCountry="ES"
                  value={form.phone}
                  onChange={val => setForm({ ...form, phone: val || "" })}
                  placeholder="600 000 000"
                  className="w-full"
                />
                {!isPhoneValid && form.phone && (
                  <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i> Formato de teléfono incorrecto para este país
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
                <input type={showPass ? "text" : "password"} value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })} required
                  placeholder="Repite tu contraseña"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm" />
              </div>

              <button type="submit" disabled={loading || !isPhoneValid}
                className="w-full py-3.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-rose-200/50">
                {loading ? <><Loader className="w-4 h-4 animate-spin" />Creando cuenta...</> : "Crear mi cuenta"}
              </button>

              <p className="text-center text-sm text-gray-500">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="text-rose-600 font-medium hover:text-rose-700 cursor-pointer">Inicia sesión</Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Al registrarte aceptas nuestros términos y condiciones de uso.
        </p>
      </div>
    </div>
  );
}
