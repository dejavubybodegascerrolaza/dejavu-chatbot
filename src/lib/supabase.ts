// react-native-url-polyfill is NOT required for React Native 0.73+.
// RN 0.85 (used by this project) includes a native URL implementation.
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import type { Database } from '@/types/database.types'
import { env } from './env'

// expo-secure-store adapter for Supabase Auth session persistence.
// SecureStore is OBLIGATORIO per engineering-decisions.md — tokens must
// never be stored in AsyncStorage (unencrypted).
const SecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      // Must be false in React Native — no URL-based OAuth redirects
      detectSessionInUrl: false,
    },
  }
)
