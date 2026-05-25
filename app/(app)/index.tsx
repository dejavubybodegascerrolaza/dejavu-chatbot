import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Screen, AppText, Button } from '@/components/ui'
import { spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useProfileStore } from '@/modules/profile/profile.store'

export default function AppPlaceholderScreen() {
  const { logout, isSubmitting } = useAuthStore()
  const profile = useProfileStore((s) => s.profile)

  return (
    <Screen padded>
      <View style={styles.container}>
        <View style={styles.content}>
          <AppText variant="title" align="center">
            Perfil completado
          </AppText>
          {profile?.alias ? (
            <AppText variant="heading" color="brand" align="center" style={styles.alias}>
              {profile.alias}
            </AppText>
          ) : null}
          <AppText variant="body" color="textMuted" align="center" style={styles.description}>
            Bronze IQ ya tiene la base de tu perfil. La Home, las sesiones y las recomendaciones se
            construirán en las siguientes fases.
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
  alias: {
    marginTop: spacing.xs,
  },
  description: {
    marginTop: spacing.sm,
  },
})
