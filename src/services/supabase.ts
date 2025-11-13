import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Get Supabase credentials
const url = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  '';

const anon = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  '';

// Validate credentials
if (!url || !anon || url.includes('your-project-id') || anon.includes('your-anon-key')) {
  console.warn('⚠️  Supabase not configured - using demo mode');
  console.warn('To enable authentication, set up your Supabase credentials in .env:');
  console.warn('EXPO_PUBLIC_SUPABASE_URL=your-actual-supabase-url');
  console.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key');
  throw new Error('Supabase credentials not configured');
}

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
