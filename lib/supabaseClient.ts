import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwnurezltovvmsgqlmki.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bnVyZXpsdG92dm1zZ3FsbWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODA5NDgsImV4cCI6MjA3NTM1Njk0OH0.oBM8b-oldgMwMDZ9jqj0ta1tcZIaHodxzCtQizRr__8';

let supabase: SupabaseClient | null = null;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Failed to create Supabase client. Please check your URL and Key.", e);
  supabase = null;
}

export { supabase };
