import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureClientAccount } from "@/hooks/useClientAccount";
import { Eye, EyeOff, Loader } from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function LoginPage() {
  useSEO({
    title: "Iniciar Sesión",
    description: "Accede a tu cuenta CALUATNAILS.",
    ogUrl: "/login",
    canonical: "/login",
    noindex: true,
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const { signIn } = useAuth();

  const [loginMode, setLoginMode] = useState<"email" | "phone">(
    searchParams.get("mode") === "email" ? "email" : "phone"
  );
  const [form, setForm] = useState({ email: "", password: "" });
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await signIn(form.email, form.password);
    setLoading(false);

    if (authError) {
      if (authError.message.includes("Invalid login")) {
        setError("Email o contraseña incorrectos.");
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.");
      } else {
        setError(authError.message);
      }
      return;
    }

    // Fetch role fresh from DB after login
    const { data: { user: loggedUser } } = await supabase.auth.getUser();
    if (loggedUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', loggedUser.id)
        .maybeSingle();
      if (profile?.role === 'admin') {
        navigate('/admin');
        return;
      }
    }
    navigate(redirectTo);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || !isValidPhoneNumber(phoneInput)) {
      setPhoneError("Por favor, introduce un número de teléfono válido.");
      setPhoneLoading(false);
      return;
    }
    setPhoneError("");
    setPhoneLoading(true);
    const digits = phoneInput.replace(/\D/g, "");
    const last9 = digits.slice(-9);
    const elasticPattern = `%${last9.split("").join("%")}%`;

    // Check if phone login is disabled for this account
    const { data: account } = await supabase
      .from("client_accounts")
      .select("id, phone, name, phone_login_enabled, auth_user_id")
      .filter("phone", "ilike", elasticPattern)
      .maybeSingle();

    if (account && !account.phone_login_enabled) {
      setPhoneError("El acceso por teléfono está desactivado para esta cuenta. Inicia sesión con email y contraseña.");
      setPhoneLoading(false);
      return;
    }

    // Check bookings exist using flexible match (ignoring spaces/formatting)
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, client_name, client_phone")
      .filter("client_phone", "ilike", elasticPattern)
      .limit(1);

    if ((!bookings || bookings.length === 0) && !account) {
      setPhoneError("No encontramos citas ni suscripciones con este número. ¿Quieres reservar una?");
      setPhoneLoading(false);
      return;
    }

    // Store the linked profile ID so the account page can load unified data
    if (account?.auth_user_id) {
      sessionStorage.setItem("caluatnails_linked_profile_id", account.auth_user_id);
    } else {
      sessionStorage.removeItem("caluatnails_linked_profile_id");
    }

    // Ensure client_accounts record exists
    const finalPhone = account?.phone || bookings?.[0]?.client_phone || digits;
    const clientName = account?.name || bookings?.[0]?.client_name || "Cliente";
    await ensureClientAccount(finalPhone, clientName);

    sessionStorage.setItem("caluatnails_client_phone", finalPhone);
    setPhoneLoading(false);
    navigate(redirectTo !== "/" ? redirectTo : "/mi-cuenta");
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
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Bienvenida de vuelta</h1>
          <p className="text-gray-500 text-sm mt-1">Inicia sesión para continuar tu formación</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => { setLoginMode("phone"); setError(""); setPhoneError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              loginMode === "phone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className="ri-phone-line"></i> Soy cliente
          </button>
          <button
            onClick={() => { setLoginMode("email"); setError(""); setPhoneError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              loginMode === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className="ri-mail-line"></i> Email y contraseña
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          {loginMode === "phone" ? (
            <form onSubmit={handlePhoneLogin} className="space-y-5">
              {phoneError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                  <i className="ri-error-warning-line text-base shrink-0"></i>
                  <div>
                    <p>{phoneError}</p>
                    {phoneError.includes("reservar") && (
                      <button 
                        type="button" 
                        onClick={() => {
                          if (phoneInput) sessionStorage.setItem("caluatnails_client_phone", phoneInput);
                          navigate("/reservar");
                        }}
                        className="text-rose-600 font-semibold underline mt-1 cursor-pointer block"
                      >
                        Reservar ahora
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de teléfono</label>
                <PhoneInput
                  international
                  defaultCountry="ES"
                  value={phoneInput}
                  onChange={val => setPhoneInput(val || "")}
                  placeholder="600 000 000"
                  className="w-full"
                  autoFocus
                />
                <p className="text-[10px] text-gray-400 mt-2 italic">Introduce el teléfono con el que hiciste tu reserva</p>
              </div>

              <button type="submit" disabled={phoneLoading || !phoneInput || !isValidPhoneNumber(phoneInput)}
                className="w-full py-3.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-40 disabled:grayscale shadow-lg shadow-rose-200/50">
                {phoneLoading ? <><Loader className="w-4 h-4 animate-spin" />Buscando citas...</> : "Ver mis citas"}
              </button>

              <p className="text-center text-sm text-gray-500">
                ¿Aún no tienes cita?{" "}
                <button 
                  onClick={() => {
                    if (phoneInput) sessionStorage.setItem("caluatnails_client_phone", phoneInput);
                    navigate("/reservar");
                  }}
                  className="text-rose-600 font-medium hover:text-rose-700 cursor-pointer underline decoration-rose-200 underline-offset-4"
                >
                  Reserva ahora
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                  <i className="ri-error-warning-line text-base shrink-0"></i>{error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <button type="button" onClick={() => navigate("/recuperar")}
                    className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required
                    placeholder="Tu contraseña"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? <><Loader className="w-4 h-4 animate-spin" />Iniciando sesión...</> : "Iniciar sesión"}
              </button>

              <p className="text-center text-sm text-gray-500">
                ¿No tienes cuenta?{" "}
                <Link to="/registro" className="text-rose-600 font-medium hover:text-rose-700 cursor-pointer">Regístrate gratis</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
