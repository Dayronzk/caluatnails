import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

function clearAuthStorage() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'nailox-auth-token',
  },
});

// Removed redundant onAuthStateChange listener to prevent race conditions with useAuth.ts
// Supabase handles session persistence and token refresh automatically.

// Intercept unhandled refresh token errors globally
const originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;
if (typeof window !== 'undefined') {
  window.fetch = async (...args) => {
    try {
      const response = await (originalFetch as typeof fetch)(...args);
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Listen for unhandled promise rejections related to refresh token
  window.addEventListener('unhandledrejection', (event) => {
    const message = event?.reason?.message ?? '';
    if (
      message.includes('Refresh Token Not Found') ||
      message.includes('Invalid Refresh Token')
    ) {
      // Don't clear everything immediately, let the auth state change handle it
      event.preventDefault();
      supabase.auth.signOut().catch(() => {});
    }
  });
}
