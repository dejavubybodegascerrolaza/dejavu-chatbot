import React, { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '@/modules/auth/auth.store'

export default function RootLayout() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth)
  const status = useAuthStore((s) => s.status)
  const segments = useSegments()
  const router = useRouter()

  // Subscribe to Supabase auth state once on mount. The INITIAL_SESSION event
  // fires immediately and transitions status out of 'loading'.
  useEffect(() => {
    return initializeAuth()
  }, [initializeAuth])

  // Redirect based on auth state whenever status or location changes.
  useEffect(() => {
    if (status === 'loading') return

    const inAuthGroup = segments[0] === '(auth)'
    const inAppGroup = segments[0] === '(app)'

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/welcome')
    } else if (status === 'authenticated' && !inAppGroup) {
      router.replace('/(app)')
    }
  }, [status, segments, router])

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}
