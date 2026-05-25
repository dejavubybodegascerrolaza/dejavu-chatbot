import React from 'react'
import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { AppText } from '@/components/ui'
import { SessionForm } from '@/components/product'
import { spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useSessionStore } from '@/modules/sessions/session.store'
import type { CreateExposureSessionInput } from '@/modules/sessions/session.schema'

export default function SessionLogScreen() {
  const user = useAuthStore((s) => s.user)
  const { createSession, isSubmitting, error, clearError } = useSessionStore()

  const handleSave = async (input: CreateExposureSessionInput) => {
    if (!user) return
    clearError()
    const session = await createSession(user.id, input)
    if (session !== null) {
      router.replace('/(app)')
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
        <View style={styles.errorBanner}>
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        </View>
      ) : null}

      <SessionForm onSave={handleSave} onCancel={handleCancel} isSubmitting={isSubmitting} />
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
    backgroundColor: '#F6D6D2',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
})
