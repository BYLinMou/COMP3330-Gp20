import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

// Try to get from Constants first (for builds), then fallback to process.env (for dev)
const url = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  '';

const anon = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  '';

// Validate environment variables
if (!url || !anon) {
  console.error('❌ Supabase configuration error:');
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('Please check your .env file or app.config.js');
  throw new Error('Supabase environment variables are not configured');
}

console.log('Supabase URL:', url);
console.log('Supabase Key:', anon);

// Create a storage adapter that works across platforms
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    return {
      getItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    };
  } else {
    // Use AsyncStorage for React Native
    return AsyncStorage;
  }
};

export const supabase = createClient(url, anon, {
  auth: { 
    persistSession: true, 
    storage: createStorageAdapter() as any 
  },
});
