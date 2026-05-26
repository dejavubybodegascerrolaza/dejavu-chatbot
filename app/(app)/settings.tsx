import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { LoadingState, ErrorState } from '@/components/feedback'
import { ProfileSummaryCard, SettingsRow } from '@/components/product'
import { colors, spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useProfileStore } from '@/modules/profile/profile.store'
import {
  MAIN_GOAL_LABELS,
  SUN_SENSITIVITY_LABELS,
  getSkinTypeLabel,
} from '@/modules/profile/profile.labels'

export default function SettingsScreen() {
  const { logout, isSubmitting: isLoggingOut } = useAuthStore()
  const profile = useProfileStore((s) => s.profile)
  const profileStatus = useProfileStore((s) => s.status)

  if (profileStatus === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Cargando ajustes…" />
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState
          message="No se ha podido cargar tu perfil. Inténtalo de nuevo."
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="title">Ajustes</AppText>
          <AppText variant="body" color="textSecondary" style={styles.subtitle}>
            Gestiona tu perfil, privacidad y cuenta.
          </AppText>
        </View>

        {/* Profile section */}
        <View style={styles.section}>
          <AppText variant="label" color="textMuted" style={styles.sectionTitle}>
            PERFIL
          </AppText>
          <ProfileSummaryCard
            alias={profile.alias}
            goalLabel={MAIN_GOAL_LABELS[profile.mainGoal]}
            sensitivityLabel={SUN_SENSITIVITY_LABELS[profile.sunSensitivity]}
            skinTypeLabel={getSkinTypeLabel(profile.skinType)}
          />
          <SettingsRow title="Editar perfil" onPress={() => router.push('/(app)/edit-profile')} />
        </View>

        {/* Legal section */}
        <View style={styles.section}>
          <AppText variant="label" color="textMuted" style={styles.sectionTitle}>
            SEGURIDAD Y RESPONSABILIDAD
          </AppText>
          <SettingsRow
            title="Leer disclaimer"
            description="Límites y alcance de Bronze IQ"
            onPress={() => router.push('/(app)/disclaimer')}
          />
        </View>

        {/* Privacy section */}
        <View style={styles.section}>
          <AppText variant="label" color="textMuted" style={styles.sectionTitle}>
            PRIVACIDAD
          </AppText>
          <SettingsRow
            title="Solicitar eliminación de datos"
            description="Registra una solicitud para eliminar tu cuenta y datos"
            onPress={() => router.push('/(app)/deletion-request')}
            variant="danger"
          />
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <AppText variant="label" color="textMuted" style={styles.sectionTitle}>
            CUENTA
          </AppText>
          <Button
            label="Cerrar sesión"
            variant="ghost"
            size="md"
            fullWidth
            loading={isLoggingOut}
            onPress={() => void logout()}
            accessibilityLabel="Cerrar sesión"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
})
