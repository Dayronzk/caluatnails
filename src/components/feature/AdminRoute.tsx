import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, fetchRole } from "@/hooks/useAuth";
import { setRoleSafe } from "@/lib/authStore";
import { Loader, ShieldOff } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  // If we have a user but role is null after auth loaded, retry the role fetch.
  // This recovers from a hung fetchRole on reload.
  useEffect(() => {
    if (loading || !user || role !== null) return;
    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      if (cancelled) return;
      try {
        const fetched = await fetchRole(user.id);
        if (!cancelled) setRoleSafe(fetched, user.id);
      } catch {
        // If retry also fails, default to student to unblock UI
        if (!cancelled) setRoleSafe('student', user.id);
      }
    }, 1500);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [loading, user, role]);

  // Initial load
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader className="w-10 h-10 text-rose-400 animate-spin" />
        <div className="text-center">
          <p className="text-gray-900 font-medium">Verificando acceso...</p>
          <p className="text-gray-400 text-xs mt-1">Paso 1: Iniciando conexión</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // User is authenticated but role not resolved yet
  if (role === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader className="w-10 h-10 text-rose-400 animate-spin" />
        <div className="text-center">
          <p className="text-gray-900 font-medium">Verificando permisos...</p>
          <p className="text-gray-400 text-xs mt-1">Paso 2: Comprobando rol de administrador</p>
          <button 
            onClick={() => {
              localStorage.clear();
              navigate("/login", { replace: true });
              window.location.reload();
            }}
            className="mt-6 text-xs text-rose-500 underline cursor-pointer"
          >
            Si tardas demasiado, haz clic aquí para reiniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // Confirmed non-admin
  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 px-6">
        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-rose-50">
          <ShieldOff className="w-10 h-10 text-rose-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso restringido</h1>
          <p className="text-gray-500 text-sm max-w-sm">
            Esta sección es exclusiva para administradores. Si crees que esto es un error, contacta al soporte.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-home-line"></i>
          Volver al inicio
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
