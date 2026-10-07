import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('seu-projeto')) {
  console.warn(
    'Supabase URL ou Anon Key não configurados corretamente no arquivo .env!\n' +
    'Por favor, configure as chaves reais para habilitar o login e a sincronização.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
