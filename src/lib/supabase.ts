import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Diagnostic logging for deployment debugging
console.log('[Supabase Init] URL configured:', supabaseUrl ? '✓ URL is set' : '✗ URL is missing');
console.log('[Supabase Init] Anon Key configured:', supabaseAnonKey ? '✓ Key is set' : '✗ Key is missing');

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
