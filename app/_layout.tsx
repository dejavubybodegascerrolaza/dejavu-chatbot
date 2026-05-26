import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Stack, useRouter, useSegments, router as expoRouter } from 'expo-router'
import type { ErrorBoundaryProps } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useProfileStore } from '@/modules/profile/profile.store'
import { ErrorState } from '@/components/feedback'
import { colors } from '@/design'

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorContainer}>
      <ErrorState
        title="Algo salió mal"
        message="La app ha encontrado un problema inesperado."
        onRetry={() => {
          void retry()
          expoRouter.replace('/')
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
})

export default function RootLayout() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth)
  const authStatus = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)

  const profileStatus = useProfileStore((s) => s.status)
  const loadProfile = useProfileStore((s) => s.loadProfile)
  const clearProfile = useProfileStore((s) => s.clearProfile)

  const segments = useSegments()
  const router = useRouter()

  // Subscribe to Supabase auth state once on mount.
  // INITIAL_SESSION fires immediately and resolves authStatus out of 'loading'.
  useEffect(() => {
    return initializeAuth()
  }, [initializeAuth])

  // Load profile when auth becomes available; clear when logged out.
  // profileStatus === 'idle' guard prevents duplicate loads (incl. StrictMode).
  useEffect(() => {
    if (authStatus === 'authenticated' && user !== null && profileStatus === 'idle') {
      void loadProfile(user.id)
    }
    if (authStatus === 'unauthenticated' && profileStatus !== 'idle') {
      clearProfile()
    }
  }, [authStatus, user, profileStatus, loadProfile, clearProfile])

  // Route based on combined auth + profile state.
  // Wait for both to resolve before redirecting.
  useEffect(() => {
    if (authStatus === 'loading' || profileStatus === 'loading') return
    // profileStatus 'idle' means profile load hasn't started yet — wait
    if (authStatus === 'authenticated' && profileStatus === 'idle') return

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboardingGroup = segments[0] === '(onboarding)'
    const inAppGroup = segments[0] === '(app)'

    if (authStatus === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/welcome')
    } else if (authStatus === 'authenticated') {
      if ((profileStatus === 'missing' || profileStatus === 'error') && !inOnboardingGroup) {
        router.replace('/(onboarding)')
      } else if (profileStatus === 'ready' && !inAppGroup) {
        router.replace('/(app)')
      }
    }
  }, [authStatus, profileStatus, segments, router])

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}
