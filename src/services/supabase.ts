import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔧 [Supabase] Inicializando cliente...');
console.log('🌐 [Supabase] URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ NO CONFIGURADA');
console.log('🔑 [Supabase] Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ NO CONFIGURADA');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [Supabase] URL o Anon Key faltante. Verifica tu archivo .env');
    console.error('❌ [Supabase] Se esperan: EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY');
} else {
    console.log('✅ [Supabase] Cliente configurado correctamente');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
