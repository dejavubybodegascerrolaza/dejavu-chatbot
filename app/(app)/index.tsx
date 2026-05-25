import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Screen, AppText, Button } from '@/components/ui'
import { spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'

export default function ProtectedHomeScreen() {
  const { logout, isSubmitting, user } = useAuthStore()

  return (
    <Screen padded>
      <View style={styles.container}>
        <View style={styles.content}>
          <AppText variant="title" align="center">
            Sesión iniciada
          </AppText>
          {user?.email ? (
            <AppText variant="body" color="textSecondary" align="center" style={styles.email}>
              {user.email}
            </AppText>
          ) : null}
          <AppText variant="body" color="textMuted" align="center" style={styles.description}>
            La autenticación ya está funcionando. El onboarding y el perfil se construirán en la
            siguiente fase.
          </AppText>
        </View>

        <Button
          label="Cerrar sesión"
          variant="danger"
          size="lg"
          fullWidth
          loading={isSubmitting}
          onPress={() => void logout()}
          accessibilityLabel="Cerrar sesión"
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  email: {
    marginTop: spacing.xs,
  },
  description: {
    marginTop: spacing.sm,
  },
})
