import React, { useEffect } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { DisclaimerBox, EmptyState, LoadingState, ErrorState } from '@/components/feedback'
import { SessionCard } from '@/components/product'
import { colors, spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useSessionStore } from '@/modules/sessions/session.store'

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const { logout, isSubmitting: isLoggingOut } = useAuthStore()

  const { status, todaySessions, error, loadTodaySessions, clearSessions } = useSessionStore()

  useEffect(() => {
    if (!user) return
    const today = getTodayString()
    void loadTodaySessions(user.id, today)
    return () => {
      clearSessions()
    }
  }, [user, loadTodaySessions, clearSessions])

  const handleRegister = () => {
    router.push('/(app)/session-log')
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="title">Bronze IQ</AppText>
          <AppText variant="body" color="textSecondary" style={styles.subtitle}>
            Menos improvisación. Más control.
          </AppText>
        </View>

        {/* CTA */}
        <Button
          label="Registrar exposición"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleRegister}
          accessibilityLabel="Registrar una sesión de exposición solar"
        />

        {/* Sessions today */}
        <View style={styles.section}>
          <AppText variant="heading" style={styles.sectionTitle}>
            Hoy
          </AppText>

          {status === 'loading' ? (
            <LoadingState message="Cargando sesiones…" />
          ) : status === 'error' ? (
            <ErrorState
              message={error ?? 'No se han podido cargar tus sesiones. Inténtalo de nuevo.'}
              onRetry={() => user && void loadTodaySessions(user.id, getTodayString())}
            />
          ) : status === 'empty' || todaySessions.length === 0 ? (
            <EmptyState
              title="Todavía no has registrado ninguna sesión hoy."
              description="Cuando guardes una exposición, aparecerá aquí."
              ctaLabel="Registrar primera sesión"
              onCta={handleRegister}
            />
          ) : (
            <View style={styles.sessionList}>
              {todaySessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </View>
          )}
        </View>

        {/* Disclaimer */}
        <DisclaimerBox compact />

        {/* Logout */}
        <Button
          label="Cerrar sesión"
          variant="ghost"
          size="md"
          fullWidth
          loading={isLoggingOut}
          onPress={() => void handleLogout()}
          accessibilityLabel="Cerrar sesión"
          style={styles.logoutButton}
        />
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
    gap: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  sessionList: {
    gap: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.sm,
  },
})
