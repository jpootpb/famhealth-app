import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const getSupabaseConfig = (): { url: string; anonKey: string } => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? (localStorage.getItem('famhealth_supabase_url') || '') : '';
  const localKey = typeof window !== 'undefined' ? (localStorage.getItem('famhealth_supabase_anon_key') || '') : '';

  return {
    url: (envUrl || localUrl).trim(),
    anonKey: (envKey || localKey).trim()
  };
};

export const setSupabaseConfig = (url: string, anonKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('famhealth_supabase_url', url.trim());
    localStorage.setItem('famhealth_supabase_anon_key', anonKey.trim());
  }
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    anonKey.length > 20
  );
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const { url, anonKey } = getSupabaseConfig();
  if (!cachedClient) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return cachedClient;
};

export const supabase = getSupabaseClient();

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Falta la URL o la Anon Key de Supabase.' };
  }

  try {
    const { data, error } = await client.from('family_sync_snapshots').select('family_id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return { success: false, message: 'Conectó a Supabase pero falta crear la tabla "family_sync_snapshots" en SQL Editor.' };
      }
      return { success: false, message: `Error de Supabase: ${error.message}` };
    }
    return { success: true, message: '¡Conexión exitosa con la base de datos de Supabase!' };
  } catch (err: any) {
    return { success: false, message: `Error de red: ${err?.message || 'No se pudo conectar a Supabase'}` };
  }
};
