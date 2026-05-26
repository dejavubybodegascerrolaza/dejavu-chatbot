import React, { useEffect } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback'
import { SessionCard } from '@/components/product'
import { colors, spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useSessionStore } from '@/modules/sessions/session.store'

export default function HistoryScreen() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const { historySessions, historyStatus, historyError, loadHistorySessions } = useSessionStore()

  useEffect(() => {
    if (!userId) return
    void loadHistorySessions(userId)
  }, [userId, loadHistorySessions])

  const handleRetry = () => {
    if (!userId) return
    void loadHistorySessions(userId)
  }

  const handleRegister = () => {
    router.push('/(app)/session-log')
  }

  const handleSessionPress = (sessionId: string) => {
    router.push(`/(app)/session-detail/${sessionId}`)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="title">Historial</AppText>
          <AppText variant="body" color="textSecondary" style={styles.subtitle}>
            Revisa tus sesiones registradas y cómo ha evolucionado tu exposición.
          </AppText>
        </View>

        <Button
          label="Registrar exposición"
          variant="secondary"
          size="md"
          fullWidth
          onPress={handleRegister}
          accessibilityLabel="Registrar una nueva sesión de exposición solar"
        />

        {historyStatus === 'loading' ? (
          <LoadingState message="Cargando tu historial…" />
        ) : historyStatus === 'error' ? (
          <ErrorState
            message={historyError ?? 'No se ha podido cargar tu historial. Inténtalo de nuevo.'}
            onRetry={handleRetry}
          />
        ) : historyStatus === 'empty' ? (
          <EmptyState
            title="Aún no hay sesiones registradas."
            description="Cuando registres tus exposiciones, aparecerán aquí para ayudarte a entender tu ritmo."
            ctaLabel="Registrar primera sesión"
            onCta={handleRegister}
          />
        ) : (
          <View style={styles.list}>
            {historySessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => handleSessionPress(session.id)}
              />
            ))}
          </View>
        )}
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
  list: {
    gap: spacing.md,
  },
})
