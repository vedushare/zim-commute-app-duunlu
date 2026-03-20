/**
 * Centralized Supabase client for ZimCommute.
 *
 * This is the single source of truth for the Supabase connection.
 * All utils and screens should import `supabase` from here (or from
 * @/app/integrations/supabase/client which re-exports the same instance).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://sbayoiscitldgmfwueld.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiYXlvaXNjaXRsZGdtZnd1ZWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Mzc2MjksImV4cCI6MjA4NjExMzYyOX0.RspgJLYEbUzaRLh65Kqynbjmfsz-Po-sbLbFt6jf6IM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
