import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazily-created Supabase client.
 *
 * Imported only from the admin chunk, and the module itself is imported
 * dynamically, so neither the SDK nor this file reaches a visitor who just
 * came to look at the venue.
 */

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once the project's URL and anon key have been supplied at build time. */
export const isConfigured = Boolean(URL && ANON_KEY);

let client: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient> {
  if (!isConfigured) {
    throw new Error('Supabase is not configured');
  }
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(URL!, ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

export const STORAGE_BUCKET = 'site';
export const PUBLISHED_OBJECT = 'content.json';
