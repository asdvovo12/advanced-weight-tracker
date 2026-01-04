import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// استبدل هذه القيم بالقيم الخاصة بمشروعك في Supabase
const supabaseUrl = 'https://otfljetgslswkbrdsikt.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZmxqZXRnc2xzd2ticmRzaWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzcwMjYsImV4cCI6MjA3NDc1MzAyNn0.abo0p0vGK3-BQTwN3KOctiERfVhgx1EUFW9I3QmGGJ4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});