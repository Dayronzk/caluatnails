import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const TARGET = "/nueva-contrasena";

/**
 * Supabase password-recovery emails redirect to Site URL with a hash
 * (#access_token...&type=recovery). Detect it from any route and forward to
 * the dedicated password-set form, preserving the hash so Supabase's client
 * can consume it there.
 */
export default function RecoveryRedirect() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname === TARGET) return;

    // Path A: hash still present.
    const hash = window.location.hash;
    if (hash && hash.includes("access_token") && hash.includes("type=recovery")) {
      navigate(`${TARGET}${hash}`, { replace: true });
      return;
    }

    // Path B: Supabase already consumed the hash; listen for the event.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate(TARGET, { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [pathname, navigate]);

  return null;
}
