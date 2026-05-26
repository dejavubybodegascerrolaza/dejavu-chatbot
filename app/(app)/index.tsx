import React, { useEffect, useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback'
import {
  RecommendationCard,
  SessionCard,
  WeeklySummaryCard,
  SafetyNote,
} from '@/components/product'
import { colors, spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useProfileStore } from '@/modules/profile/profile.store'
import { useSessionStore } from '@/modules/sessions/session.store'
import { SENSATION_LABELS } from '@/modules/sessions/session.labels'
import { generateRecommendation } from '@/modules/recommendations/recommendation.service'
import { LEVEL_SUBTEXTS } from '@/modules/recommendations/recommendation.labels'

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const { logout, isSubmitting: isLoggingOut } = useAuthStore()

  const profile = useProfileStore((s) => s.profile)
  const profileStatus = useProfileStore((s) => s.status)

  const {
    status: todayStatus,
    todaySessions,
    recentSessions,
    recentSessionsStatus,
    recentSessionsError,
    error: todayError,
    loadTodaySessions,
    loadRecentSessions,
    clearSessions,
  } = useSessionStore()

  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    const today = getTodayString()
    void loadTodaySessions(userId, today)
    void loadRecentSessions(userId, 7)
    return () => {
      clearSessions()
    }
  }, [userId, loadTodaySessions, loadRecentSessions, clearSessions])

  const recommendation = useMemo(() => {
    if (!profile) return null
    return generateRecommendation({
      profile: {
        mainGoal: profile.mainGoal,
        sunSensitivity: profile.sunSensitivity,
        skinType: profile.skinType,
      },
      sessionsLast7Days: recentSessions,
    })
  }, [profile, recentSessions])

  const isLoading =
    profileStatus === 'loading' || todayStatus === 'loading' || recentSessionsStatus === 'loading'

  const loadError = todayError ?? recentSessionsError

  const handleRegister = () => {
    router.push('/(app)/session-log')
  }

  const handleRetry = () => {
    if (!userId) return
    const today = getTodayString()
    void loadTodaySessions(userId, today)
    void loadRecentSessions(userId, 7)
  }

  const weeklySessionsCount = recentSessions.length
  const weeklyTotalMinutes = recentSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const lastSession = recentSessions[0] ?? null
  const lastSensationLabel = lastSession ? SENSATION_LABELS[lastSession.sensationAfter] : null

  const alias = profile?.alias ?? ''
  const level = recommendation?.level ?? 'low'

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Cargando tu información…" />
      </SafeAreaView>
    )
  }

  if (loadError !== null && loadError !== undefined) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState
          message="No se ha podido cargar tu información. Inténtalo de nuevo."
          onRetry={handleRetry}
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
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="title">{alias !== '' ? `Hola, ${alias}` : 'Hola'}</AppText>
          <AppText variant="body" color="textSecondary" style={styles.subtitle}>
            {LEVEL_SUBTEXTS[level]}
          </AppText>
        </View>

        {/* Recommendation */}
        {recommendation !== null ? (
          <RecommendationCard
            title={recommendation.title}
            message={recommendation.message}
            level={recommendation.level}
            reasons={recommendation.reasons}
            ctaLabel={recommendation.ctaLabel}
            onCtaPress={handleRegister}
          />
        ) : null}

        {/* Weekly summary */}
        {recommendation !== null ? (
          <WeeklySummaryCard
            sessionsCount={weeklySessionsCount}
            totalMinutes={weeklyTotalMinutes}
            lastSensationLabel={lastSensationLabel}
            recommendationLevel={recommendation.level}
          />
        ) : null}

        {/* Register CTA */}
        <Button
          label="Registrar exposición"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleRegister}
          accessibilityLabel="Registrar una sesión de exposición solar"
        />

        {/* History link */}
        <Button
          label="Ver historial"
          variant="secondary"
          size="md"
          fullWidth
          onPress={() => router.push('/(app)/history')}
          accessibilityLabel="Ver historial completo de sesiones"
        />

        {/* Settings link */}
        <Button
          label="Ajustes"
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => router.push('/(app)/settings')}
          accessibilityLabel="Ir a ajustes"
        />

        {/* Sessions today */}
        <View style={styles.section}>
          <AppText variant="heading" style={styles.sectionTitle}>
            Hoy
          </AppText>
          {todaySessions.length === 0 ? (
            <EmptyState
              title="Todavía no has registrado ninguna sesión hoy."
              description="Cuando guardes una exposición, aparecerá aquí."
            />
          ) : (
            <View style={styles.sessionList}>
              {todaySessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </View>
          )}
        </View>

        {/* Last session (if not already shown in today) */}
        {lastSession !== null && lastSession.sessionDate !== getTodayString() ? (
          <View style={styles.section}>
            <AppText variant="heading" style={styles.sectionTitle}>
              Última sesión
            </AppText>
            <SessionCard session={lastSession} />
          </View>
        ) : null}

        <SafetyNote />

        {/* Logout */}
        <Button
          label="Cerrar sesión"
          variant="ghost"
          size="md"
          fullWidth
          loading={isLoggingOut}
          onPress={() => void logout()}
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
