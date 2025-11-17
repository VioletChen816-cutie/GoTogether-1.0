import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwnurezltovvmsgqlmki.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bnVyZXpsdG92dm1zZ3FsbWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODA5NDgsImV4cCI6MjA3NTM1Njk0OH0.oBM8b-oldgMwMDZ9jqj0ta1tcZIaHodxzCtQizRr__8';

let supabase: SupabaseClient | null = null;

// The app will guide the user through setup if the schema is missing,
// but credentials are now hardcoded.
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Failed to create Supabase client with the provided credentials.", e);
  supabase = null;
}

/**
 * This function is deprecated as credentials are now hardcoded.
 * It is kept for compatibility but will log a warning if called.
 * @param url The Supabase project URL.
 * @param key The Supabase anon public key.
 */
export const updateSupabaseCredentials = (url: string, key: string) => {
    console.warn("Supabase credentials are now hardcoded in lib/supabaseClient.ts and cannot be updated at runtime.");
};


export { supabase };