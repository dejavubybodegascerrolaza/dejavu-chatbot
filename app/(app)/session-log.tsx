import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { AppText } from '@/components/ui'
import { SessionForm } from '@/components/product'
import { colors, spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useSessionStore } from '@/modules/sessions/session.store'
import { parseSessionLogPrefillParams } from '@/modules/sessions/session.prefill'
import type { CreateExposureSessionInput } from '@/modules/sessions/session.schema'

export default function SessionLogScreen() {
  const user = useAuthStore((s) => s.user)
  const { createSession, isSubmitting, error, clearError } = useSessionStore()

  // Prefill carried from a finished live session via route params. Parsed in the
  // pure helper so malformed params are ignored safely and the logic stays tested.
  const params = useLocalSearchParams<{
    durationMinutes?: string
    protectionLevel?: string
    uvIndexManual?: string
  }>()
  const prefill = useMemo(() => parseSessionLogPrefillParams(params), [params])

  const handleSave = async (input: CreateExposureSessionInput) => {
    if (!user) return
    clearError()
    const session = await createSession(user.id, input)
    if (session !== null) {
      // Carry the logged skin response (and the saved id) so Home can show a calm
      // acknowledgement that can link back to the session detail.
      router.replace({
        pathname: '/(app)',
        params: { saved: input.sensationAfter, savedId: session.id },
      })
    }
  }

  const handleCancel = () => {
    router.replace('/(app)')
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText variant="heading">Registrar exposición</AppText>
      </View>

      {error ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <AppText variant="body" color="danger">
            {error}
          </AppText>
        </View>
      ) : null}

      <SessionForm
        onSave={handleSave}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        prefill={prefill}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
})
