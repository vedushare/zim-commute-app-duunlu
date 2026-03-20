
import type { Database } from './types';
import { supabase as _supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/supabase';

// Re-export the singleton from the centralized utils/supabase.ts
// Import the supabase client like this:
// import { supabase } from "@/app/integrations/supabase/client";
export const supabase = _supabase as ReturnType<typeof import('@supabase/supabase-js').createClient<Database>>;

export { SUPABASE_URL, SUPABASE_ANON_KEY };

// Default export to satisfy Expo Router (this file is not a route)
export default function SupabaseClient() {
  return null;
}
