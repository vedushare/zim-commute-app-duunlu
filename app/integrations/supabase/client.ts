import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://sbayoiscitldgmfwueld.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiYXlvaXNjaXRsZGdtZnd1ZWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Mzc2MjksImV4cCI6MjA4NjExMzYyOX0.RspgJLYEbUzaRLh65Kqynbjmfsz-Po-sbLbFt6jf6IM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
