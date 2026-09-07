import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseCredentials = () => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

  const envUrl =
    metaEnv.VITE_SUPABASE_URL ||
    metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
    'https://lbnpirmqqoscawhpufuz.supabase.co';

  const envKey =
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_NbkwRsmPZqfemGZJibr_wQ_goBqbdQw';

  const localUrl = localStorage.getItem('supabase_custom_url') || '';
  const localKey = localStorage.getItem('supabase_custom_key') || '';

  const url = localUrl || envUrl;
  const key = localKey || envKey;

  return { url, key };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key || url.includes('your-supabase-project')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

export const resetSupabaseClient = () => {
  supabaseInstance = null;
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseClient() !== null;
};
