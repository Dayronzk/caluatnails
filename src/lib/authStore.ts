/**
 * Global singleton auth store.
 * Lives outside React so it survives component unmounts and tab switches.
 * The role is cached here once resolved and never reset to null unless
 * the user explicitly signs out.
 */

import type { User, Session } from '@supabase/supabase-js';
import type { UserRole } from '@/hooks/useAuth';

interface AuthStore {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  /** Last user ID for which the role was resolved */
  resolvedForUserId: string | null;
}

// Module-level singleton — persists across renders and tab switches.
// Hydrate role from localStorage so admin pages render instantly on reload,
// before the auth bootstrap completes.
function hydrateInitialRole(): { role: UserRole | null; resolvedForUserId: string | null } {
  try {
    const raw = localStorage.getItem('caluatnails_role_cache');
    if (!raw) return { role: null, resolvedForUserId: null };
    const parsed = JSON.parse(raw) as { userId: string; role: UserRole };
    return { role: parsed.role, resolvedForUserId: parsed.userId };
  } catch {
    return { role: null, resolvedForUserId: null };
  }
}

const initialRole = hydrateInitialRole();
let store: AuthStore = {
  user: null,
  session: null,
  role: initialRole.role,
  loading: true,
  resolvedForUserId: initialRole.resolvedForUserId,
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function getAuthStore(): AuthStore {
  return store;
}

export function setAuthStore(partial: Partial<AuthStore>) {
  store = { ...store, ...partial };
  listeners.forEach(fn => fn());
}

/**
 * Update role only if it's a real value (non-null) OR if the user signed out.
 * This prevents tab-switch flicker where role briefly becomes null.
 */
export function setRoleSafe(role: UserRole | null, userId: string | null) {
  if (role !== null) {
    // Real role resolved — always update with new object reference
    store = { 
      ...store, 
      role, 
      resolvedForUserId: userId 
    };
    listeners.forEach(fn => fn());
  } else if (userId === null) {
    // User signed out — clear everything
    store = { 
      ...store, 
      role: null, 
      resolvedForUserId: null 
    };
    listeners.forEach(fn => fn());
  }
}

export function subscribeAuthStore(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
