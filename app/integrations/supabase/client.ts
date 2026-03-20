
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

// Read Supabase configuration from app.json extra section (never hardcode keys in source)
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || '';
const SUPABASE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || '';

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

// Default export to satisfy Expo Router (this file is not a route)
export default function SupabaseClient() {
  return null;
}
