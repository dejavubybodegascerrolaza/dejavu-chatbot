import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { LoadingState } from '@/components/feedback'

// Briefly visible during auth initialization before the guard redirects
// to /(auth)/welcome or /(app).
export default function Index() {
  return (
    <SafeAreaProvider>
      <LoadingState message="Cargando…" />
    </SafeAreaProvider>
  )
}
