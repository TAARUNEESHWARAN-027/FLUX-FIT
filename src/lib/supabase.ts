import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '[FluxFit] Missing Supabase environment variables.\n' +
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n' +
        'Auth will not work without valid credentials.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
