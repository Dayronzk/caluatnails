import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSEO } from "@/hooks/useSEO";

type Status = "loading" | "success" | "error";

export default function ConfirmarEmailPage() {
  useSEO({
    title: "Confirmar Email",
    description: "Confirmación de email.",
    ogUrl: "/confirmar-email",
    canonical: "/confirmar-email",
    noindex: true,
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [redirectType, setRedirectType] = useState<"signup" | "recovery">("signup");

  useEffect(() => {
    const confirm = async () => {
      // ── Strategy 1: token_hash in query params (new Supabase format)
      const tokenHash = searchParams.get("token_hash");
      const type = (searchParams.get("type") ?? "") as "signup" | "recovery" | "email_change" | string;

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (type as "signup" | "recovery" | "email_change") || "signup",
        });

        if (error) {
          setStatus("error");
          setErrorMsg("El enlace ha expirado o ya fue utilizado. Por favor regístrate de nuevo.");
          return;
        }

        const rType = type === "recovery" ? "recovery" : "signup";
        setRedirectType(rType);
        setStatus("success");
        setTimeout(() => navigate(rType === "recovery" ? "/nueva-contrasena" : "/mi-cuenta"), 2500);
        return;
      }

      // ── Strategy 2: access_token + refresh_token in URL hash (old format)
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const hashType = params.get("type") ?? "";

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setStatus("error");
            setErrorMsg("El enlace ha expirado o ya fue utilizado. Por favor regístrate de nuevo.");
            return;
          }

          const rType = hashType === "recovery" ? "recovery" : "signup";
          setRedirectType(rType);
          setStatus("success");
          setTimeout(() => navigate(rType === "recovery" ? "/nueva-contrasena" : "/mi-cuenta"), 2500);
          return;
        }
      }

      // ── Strategy 3: code in query params (PKCE flow)
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus("error");
          setErrorMsg("El enlace ha expirado o ya fue utilizado. Por favor regístrate de nuevo.");
          return;
        }
        setStatus("success");
        setTimeout(() => navigate("/mi-cuenta"), 2500);
        return;
      }

      // Nothing found
      setStatus("error");
      setErrorMsg("No se encontró un token de confirmación válido en el enlace. Verifica que hayas copiado el enlace completo.");
    };

    confirm();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-10">
          <a href="/">
            <span className="font-playfair text-3xl font-bold tracking-widest text-[#1A1A1A]">
              <img src="/assets/caluatnails-logo.png" alt="Caluatnails" className="h-8 md:h-10 w-auto object-contain" />
            </span>
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-10">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
                <i className="ri-loader-4-line text-3xl text-rose-400 animate-spin"></i>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Confirmando tu cuenta...</h2>
              <p className="text-sm text-gray-500">Por favor espera un momento.</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <i className="ri-check-line text-3xl text-emerald-500"></i>
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {redirectType === "recovery" ? "¡Enlace verificado!" : "¡Email confirmado!"}
              </h2>
              <p className="text-sm text-gray-500">
                {redirectType === "recovery"
                  ? "Redirigiendo para crear tu nueva contraseña..."
                  : "Tu cuenta ha sido activada correctamente. Redirigiendo a Mi cuenta..."}
              </p>
              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-1 mt-2 overflow-hidden">
                <div
                  className="bg-rose-400 h-1 rounded-full"
                  style={{ animation: "progressBar 2.5s linear forwards", width: "0%" }}
                />
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                <i className="ri-close-line text-3xl text-rose-500"></i>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Enlace inválido</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{errorMsg}</p>
              <div className="flex flex-col gap-2 w-full mt-2">
                <a
                  href="/registro"
                  className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap text-center"
                >
                  Volver al registro
                </a>
                <a
                  href="/login"
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap text-center"
                >
                  Iniciar sesión
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
