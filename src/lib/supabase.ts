import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Validates that a string is a real, well-formed HTTP/HTTPS URL.
 */
function isValidHttpUrl(string: string): boolean {
  if (!string || typeof string !== 'string') return false;
  try {
    const parsed = new URL(string);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.includes('.') &&
      !string.includes('placeholder') &&
      !string.includes('your-project') &&
      !string.includes('MY_') &&
      !string.includes('example.com')
    );
  } catch {
    return false;
  }
}

function isValidAnonKey(key: string): boolean {
  return (
    Boolean(key) &&
    key.length > 20 &&
    !key.includes('your-anon') &&
    !key.includes('placeholder') &&
    !key.includes('MY_')
  );
}

export const isSupabaseConfigured = isValidHttpUrl(rawUrl) && isValidAnonKey(rawKey);

const fallbackUrl = 'https://placeholder-school.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock-key-for-preview';

const effectiveUrl = isSupabaseConfigured ? rawUrl : fallbackUrl;
const effectiveKey = isSupabaseConfigured ? rawKey : fallbackKey;

let clientInstance: any;

try {
  clientInstance = createClient<any>(effectiveUrl, effectiveKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} catch (err) {
  console.warn('Failed to initialize Supabase client, falling back to mock client:', err);
  // Safe mock client fallback to prevent app crashing
  clientInstance = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
          order: async () => ({ data: [], error: null }),
        }),
        order: async () => ({ data: [], error: null }),
      }),
      insert: async () => ({ error: null }),
      update: () => ({ eq: async () => ({ error: null }) }),
      upsert: async () => ({ error: null }),
      delete: () => ({ eq: async () => ({ error: null }) }),
    }),
  };
}

export const supabase = clientInstance;
