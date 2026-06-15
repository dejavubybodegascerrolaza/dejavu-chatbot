import React, { useEffect } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { LoadingState, ErrorState } from '@/components/feedback'
import { NotificationToggleRow, ProfileSummaryCard, SettingsRow } from '@/components/product'
import { colors, spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useProfileStore } from '@/modules/profile/profile.store'
import {
  MAIN_GOAL_LABELS,
  SUN_SENSITIVITY_LABELS,
  getSkinTypeLabel,
} from '@/modules/profile/profile.labels'
import { buildCalibrationProfile } from '@/modules/calibration'
import { useNotificationStore } from '@/modules/notifications/notifications.store'

export default function SettingsScreen() {
  const { logout, isSubmitting: isLoggingOut } = useAuthStore()
  const profile = useProfileStore((s) => s.profile)
  const profileStatus = useProfileStore((s) => s.status)

  const notificationPermission = useNotificationStore((s) => s.permission)
  const notificationPrefs = useNotificationStore((s) => s.preferences)
  const refreshPermission = useNotificationStore((s) => s.refreshPermission)
  const requestPermission = useNotificationStore((s) => s.requestPermission)
  const setPreference = useNotificationStore((s) => s.setPreference)

  useEffect(() => {
    void refreshPermission()
  }, [refreshPermission])

  const notificationsGranted = notificationPermission === 'granted'

  if (profileStatus === 'loading') {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <LoadingState message="Cargando ajustes…" />
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <ErrorState
          message="No se ha podido cargar tu perfil. Inténtalo de nuevo."
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
            calibrationSummary={buildCalibrationProfile(profile).summary}
          />
          <SettingsRow title="Editar perfil" onPress={() => router.push('/(app)/edit-profile')} />
        </View>

        {/* Notifications section */}
        <View style={styles.section}>
          <AppText variant="label" color="textMuted" style={styles.sectionTitle}>
            NOTIFICACIONES
          </AppText>
          {notificationPermission === 'denied' ? (
            <AppText variant="caption" color="textMuted">
              Los permisos de notificación están desactivados. Actívalos en los ajustes del sistema
              para recibir alertas de Bronze IQ.
            </AppText>
          ) : null}
          {notificationPermission === 'unknown' ? (
            <Button
              label="Activar notificaciones"
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => void requestPermission()}
              accessibilityLabel="Solicitar permiso de notificaciones"
            />
          ) : null}
          <NotificationToggleRow
            title="Alertas de pico UV"
            description="Aviso 30 min antes de que llegue el UV alto"
            value={notificationPrefs.uvAlertsEnabled}
            onValueChange={(v) => setPreference('uvAlertsEnabled', v)}
            disabled={!notificationsGranted}
          />
          <NotificationToggleRow
            title="Recordatorio de sesión"
            description="Aviso diario cuando tienes un plan activo"
            value={notificationPrefs.sessionRemindersEnabled}
            onValueChange={(v) => setPreference('sessionRemindersEnabled', v)}
            disabled={!notificationsGranted}
          />
          <NotificationToggleRow
            title="Protección de racha"
            description="Recordatorio a las 17h para no romper tu racha"
            value={notificationPrefs.streakRemindersEnabled}
            onValueChange={(v) => setPreference('streakRemindersEnabled', v)}
            disabled={!notificationsGranted}
          />
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
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
})
