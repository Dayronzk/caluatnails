import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { ClientAccount } from "@/hooks/useClientAccount";

interface Props {
  clientAccount: ClientAccount;
}

export default function SecurityTab({ clientAccount }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(clientAccount.email ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(clientAccount.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hasAuth = !!clientAccount.auth_user_id;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setError("");
    setSaving(true);

    try {
      const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/register-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() || clientAccount.name || "Cliente" }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const msg = result.error || "Error al crear la cuenta";
        
        // Better error categorization
        if (msg.toLowerCase().includes("already registered") || 
            msg.toLowerCase().includes("already exists") || 
            msg.toLowerCase().includes("duplicate")) {
          setError("Este email ya está en uso. Si es tuyo, intenta iniciar sesión con él para vincular tus cuentas.");
        } else if (msg.toLowerCase().includes("password")) {
          setError("La contraseña no cumple con los requisitos de seguridad.");
        } else {
          setError(`No se pudo crear el acceso: ${msg}`);
        }
        setSaving(false);
        return;
      }

      await supabase
        .from("client_accounts")
        .update({
          auth_user_id: result.userId,
          email: email.trim(),
          name: name.trim() || clientAccount.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientAccount.id);

      setSuccess(true);
      setSaving(false);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setSaving(false);
    }
  };

  const handleDisablePhoneLogin = async () => {
    await supabase
      .from("client_accounts")
      .update({ phone_login_enabled: false, updated_at: new Date().toISOString() })
      .eq("id", clientAccount.id);

    sessionStorage.removeItem("caluatnails_client_phone");
    navigate("/login");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-6 text-white flex items-center gap-4">
        <div className="w-14 h-14 flex items-center justify-center bg-white/20 rounded-xl shrink-0">
          <i className="ri-shield-keyhole-line text-2xl"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold">Seguridad de la cuenta</h2>
          <p className="text-sm opacity-90">Configura email y contraseña para proteger tu cuenta</p>
        </div>
      </div>

      {/* Current access info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i className="ri-information-line text-rose-500"></i> Estado actual
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gray-50">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Acceso por teléfono</p>
            <p className="text-sm font-medium text-emerald-600 flex items-center gap-1">
              <i className="ri-checkbox-circle-line"></i> Activo — {clientAccount.phone}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Email y contraseña</p>
            <p className={`text-sm font-medium flex items-center gap-1 ${hasAuth ? "text-emerald-600" : "text-amber-600"}`}>
              {hasAuth
                ? <><i className="ri-checkbox-circle-line"></i> Configurado</>
                : <><i className="ri-error-warning-line"></i> No configurado</>
              }
            </p>
          </div>
        </div>
      </div>

      {/* Setup form */}
      {!hasAuth && !success && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <i className="ri-lock-password-line text-rose-500"></i> Crear acceso con email
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Añade un email y contraseña para poder iniciar sesión de forma más segura. Tu acceso por teléfono seguirá funcionando.
          </p>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 flex items-center gap-2 mb-4">
              <i className="ri-error-warning-line shrink-0"></i>{error}
            </div>
          )}

          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !email.trim() || !password.trim()}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {saving
                ? <><i className="ri-loader-4-line animate-spin"></i>Creando cuenta...</>
                : <><i className="ri-shield-check-line"></i>Crear acceso seguro</>
              }
            </button>
          </form>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <i className="ri-check-double-line text-3xl text-emerald-600"></i>
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">¡Cuenta creada!</h3>
          <p className="text-sm text-gray-500 mb-2">
            Ahora puedes iniciar sesión con <strong>{email}</strong> y tu contraseña.
          </p>
          <p className="text-xs text-gray-400">
            Revisa tu bandeja de entrada para confirmar tu email.
          </p>
        </div>
      )}

      {/* Disable phone login (only if auth is set up) */}
      {hasAuth && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <i className="ri-phone-lock-line text-amber-500"></i> Desactivar acceso por teléfono
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Si prefieres que solo se pueda acceder a tu cuenta con email y contraseña, puedes desactivar el acceso por número de teléfono.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
            <i className="ri-error-warning-line text-amber-500 mt-0.5 shrink-0"></i>
            <p className="text-xs text-amber-700">
              Una vez desactivado, solo podrás acceder con tu email y contraseña. Esta acción se puede revertir contactando con soporte.
            </p>
          </div>
          <button
            onClick={handleDisablePhoneLogin}
            className="px-6 py-2.5 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2"
          >
            <i className="ri-phone-lock-line"></i> Desactivar acceso por teléfono
          </button>
        </div>
      )}
    </div>
  );
}
