import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import { sendBrevoEmail } from '@/lib/brevo';
import {
  getAuthStore,
  setAuthStore,
  setRoleSafe,
  subscribeAuthStore,
} from '@/lib/authStore';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'student' | 'admin';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
}

// Cache the role in localStorage so reloads are instant
const ROLE_CACHE_KEY = 'caluatnails_role_cache';
type RoleCache = { userId: string; role: UserRole; ts: number };

function getCachedRole(userId: string): UserRole | null {
  try {
    const raw = localStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoleCache;
    if (parsed.userId !== userId) return null;
    return parsed.role;
  } catch {
    return null;
  }
}

function setCachedRole(userId: string, role: UserRole) {
  try {
    localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ userId, role, ts: Date.now() }));
  } catch { /* ignore */ }
}

export async function fetchRole(userId: string): Promise<UserRole> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    const role = (data?.role as UserRole) ?? 'student';
    setCachedRole(userId, role);
    return role;
  } catch {
    return 'student';
  }
}

// ── Bootstrap: run once at module load, not per-component ────────────────────
// This ensures the auth state is initialized even before any component mounts.
let bootstrapped = false;

function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;

  supabase.auth.getSession().then(async ({ data: { session }, error }) => {
    if (error) {
      setAuthStore({ user: null, session: null, loading: false });
      setRoleSafe(null, null);
      return;
    }

    // Validate that the session has a valid refresh token before using it
    if (session && !session.refresh_token) {
      setAuthStore({ user: null, session: null, loading: false });
      setRoleSafe(null, null);
      return;
    }

    if (session?.user) {
      // Use cached role for instant render
      const cached = getCachedRole(session.user.id);
      if (cached) {
        setRoleSafe(cached, session.user.id);
      }
      
      // SET LOADING FALSE IMMEDIATELY - cache or bootstrap will handle the UI
      setAuthStore({ user: session.user, session, loading: false });

      // Refresh role in background - faster timeout (1.5s)
      const roleTimeout = new Promise<UserRole>(resolve =>
        setTimeout(() => resolve(cached || 'student'), 1500)
      );
      try {
        const role = await Promise.race([fetchRole(session.user.id), roleTimeout]);
        setRoleSafe(role, session.user.id);
      } catch { /* keep cached */ }
    } else {
      setAuthStore({ user: null, session: null, loading: false });
      setRoleSafe(null, null);
    }
  }).catch(async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    setAuthStore({ user: null, session: null, loading: false });
    setRoleSafe(null, null);
  });

  // Fallback: force loading=false after 2s
  setTimeout(() => {
    const s = getAuthStore();
    if (s.loading) setAuthStore({ loading: false });
  }, 2000);

  // Auth state changes (tab focus, token refresh, sign in/out)
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED' && !session) {
      setAuthStore({ user: null, session: null, loading: false });
      setRoleSafe(null, null);
      return;
    }

    if (event === 'SIGNED_OUT') {
      setAuthStore({ user: null, session: null, loading: false });
      setRoleSafe(null, null);
      return;
    }

    if (session?.user) {
      // Update user/session immediately — but DON'T touch role yet
      // setRoleSafe will only update if we get a real value back
      setAuthStore({ user: session.user, session, loading: false });

      // If we already have the role cached for this user, skip re-fetch
      const current = getAuthStore();
      if (current.resolvedForUserId === session.user.id && current.role !== null) {
        return;
      }

      // Fetch role in background — setRoleSafe won't clear it if fetch is slow
      try {
        const roleTimeout = new Promise<UserRole>(resolve =>
          setTimeout(() => resolve('student'), 4000)
        );
        const role = await Promise.race([fetchRole(session.user.id), roleTimeout]);
        setRoleSafe(role, session.user.id);
      } catch {
        // Keep existing role on error
      }
    }
  });
}

// Run bootstrap immediately when module loads
bootstrap();

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  // Subscribe to the global store — re-renders only when store changes
  const storeState = useSyncExternalStore(
    subscribeAuthStore,
    getAuthStore,
    getAuthStore,
  );

  const signUp = useCallback(async (email: string, password: string, name: string, phone?: string) => {
    // Try the register-user edge function first (sends branded confirmation email).
    const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

    const fallbackToNative = async (reason: string) => {
      console.warn(`signUp: falling back to native auth.signUp (${reason})`);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone } },
      });
      if (error) {
        if (error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('already exists') ||
            error.message.toLowerCase().includes('user already')) {
          return { data: null, error: { message: 'already registered' } };
        }
        return { data: null, error: { message: error.message } };
      }
      return { data, error: null };
    };

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/register-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ email, password, name, phone }),
      });

      // Gateway-level rejection
      if (res.status === 401 || res.status === 403) {
        const txt = await res.text().catch(() => '');
        return fallbackToNative(`gateway ${res.status}: ${txt.slice(0, 120)}`);
      }

      const result = await res.json().catch(() => ({} as { error?: string; success?: boolean; userId?: string }));

      if (!res.ok || !result.success) {
        const msg: string = result.error || `Registration failed (HTTP ${res.status})`;
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
          return { data: null, error: { message: 'already registered' } };
        }
        return fallbackToNative(`server: ${msg.slice(0, 120)}`);
      }

      return { data: { user: { id: result.userId }, session: null }, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      return fallbackToNative(`fetch error: ${message}`);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signOut = useCallback(async () => {
    try { localStorage.removeItem(ROLE_CACHE_KEY); } catch { /* ignore */ }
    await supabase.auth.signOut();
  }, []);

  const isAdmin = storeState.role === 'admin';

  return {
    user: storeState.user,
    session: storeState.session,
    loading: storeState.loading,
    role: storeState.role,
    isAdmin,
    signUp,
    signIn,
    signOut,
  };
}
