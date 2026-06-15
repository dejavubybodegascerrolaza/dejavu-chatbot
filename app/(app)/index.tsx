import React, { useEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Card } from '@/components/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback'
import {
  AchievementsCard,
  BurnTimeCard,
  RecoveryGuidanceCard,
  RecommendationCard,
  SessionCard,
  StreakCard,
  TanPlanCard,
  UvIndexCard,
  VitaminDCard,
  WeeklySummaryCard,
  SafetyNote,
} from '@/components/product'
import { colors, spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useProfileStore } from '@/modules/profile/profile.store'
import { useSessionStore } from '@/modules/sessions/session.store'
import { SENSATION_LABELS } from '@/modules/sessions/session.labels'
import { LEVEL_SUBTEXTS } from '@/modules/recommendations/recommendation.labels'
import { useUvStore } from '@/modules/uv'
import { useLocationStore } from '@/modules/location'
import { usePlanStore } from '@/modules/plan'
import { buildGamificationSummary } from '@/modules/gamification'
import { buildTodayDecision } from '@/modules/today'
import { useNotificationStore } from '@/modules/notifications/notifications.store'

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
    historySessions,
    error: todayError,
    loadTodaySessions,
    loadRecentSessions,
    loadHistorySessions,
    clearSessions,
  } = useSessionStore()

  const uvForecast = useUvStore((s) => s.forecast)
  const uvStatus = useUvStore((s) => s.status)
  const loadForecast = useUvStore((s) => s.loadForecast)

  const requestLocation = useLocationStore((s) => s.requestLocation)
  const locationStatus = useLocationStore((s) => s.status)
  const coordinates = useLocationStore((s) => s.coordinates)

  const planGoal = usePlanStore((s) => s.goalLevel)
  const planCurrentLevel = usePlanStore((s) => s.currentLevel)
  const loadPlan = usePlanStore((s) => s.loadPlan)
  const resetPlan = usePlanStore((s) => s.reset)

  const scheduleNotifications = useNotificationStore((s) => s.scheduleAll)
  const requestNotificationPermission = useNotificationStore((s) => s.requestPermission)
  const notificationPermission = useNotificationStore((s) => s.permission)

  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    const today = getTodayString()
    void loadTodaySessions(userId, today)
    void loadRecentSessions(userId, 7)
    void loadHistorySessions(userId)
    void loadPlan(userId)
    return () => {
      clearSessions()
      resetPlan()
    }
  }, [
    userId,
    loadTodaySessions,
    loadRecentSessions,
    loadHistorySessions,
    loadPlan,
    clearSessions,
    resetPlan,
  ])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const coords = await requestLocation()
      if (!cancelled && coords) {
        await loadForecast(coords)
      }
      // Ask for notification permission after location (non-blocking)
      if (!cancelled && notificationPermission === 'unknown') {
        await requestNotificationPermission()
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [requestLocation, loadForecast, notificationPermission, requestNotificationPermission])

  const todayDecision = useMemo(
    () =>
      buildTodayDecision({
        profile,
        recentSessions,
        todaySessions,
        historySessions,
        uvForecast,
        locationStatus,
        planGoal,
        planCurrentLevel,
        today: getTodayString(),
      }),
    [
      profile,
      recentSessions,
      todaySessions,
      historySessions,
      uvForecast,
      locationStatus,
      planGoal,
      planCurrentLevel,
    ]
  )

  const gamification = useMemo(
    () =>
      buildGamificationSummary({
        sessions: historySessions.map((s) => ({
          sessionDate: s.sessionDate,
          sensationAfter: s.sensationAfter,
          context: s.context,
        })),
        today: getTodayString(),
        hasPlan: planGoal !== null,
      }),
    [historySessions, planGoal]
  )

  // Schedule notifications whenever key data changes
  useEffect(() => {
    void scheduleNotifications({
      uvPeakWindow: uvForecast?.peakWindow ?? null,
      streak: todayDecision.safetyStreak,
      hasActivePlan: todayDecision.hasActivePlan,
    })
  }, [scheduleNotifications, uvForecast, todayDecision.safetyStreak, todayDecision.hasActivePlan])

  const isLoading =
    profileStatus === 'loading' || todayStatus === 'loading' || recentSessionsStatus === 'loading'

  const loadError = todayError ?? recentSessionsError

  const handleRegister = () => {
    router.push('/(app)/session-log')
  }

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRetry = () => {
    if (!userId) return
    const today = getTodayString()
    void loadTodaySessions(userId, today)
    void loadRecentSessions(userId, 7)
  }

  const handleRefresh = async () => {
    if (!userId) return
    setIsRefreshing(true)
    const today = getTodayString()
    const tasks: Promise<unknown>[] = [
      loadTodaySessions(userId, today),
      loadRecentSessions(userId, 7),
    ]
    if (coordinates) {
      tasks.push(loadForecast(coordinates))
    }
    await Promise.all(tasks)
    setIsRefreshing(false)
  }

  const weeklySessionsCount = recentSessions.length
  const weeklyTotalMinutes = recentSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const lastSession = recentSessions[0] ?? null
  const lastSensationLabel = lastSession ? SENSATION_LABELS[lastSession.sensationAfter] : null

  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const skinType = profile?.skinType ?? null

  const alias = profile?.alias ?? ''
  const level = todayDecision.recommendationLevel ?? 'low'

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

  const showUvUnavailable =
    uvForecast === null && (uvStatus === 'error' || locationStatus === 'denied')

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="title">{alias !== '' ? `Hola, ${alias}` : 'Hola'}</AppText>
          <AppText variant="body" color="textSecondary" style={styles.subtitle}>
            {LEVEL_SUBTEXTS[level]}
          </AppText>
        </View>

        {/* Today Decision — primary card */}
        {todayDecision.recommendationLevel !== null ? (
          <RecommendationCard
            title={todayDecision.title}
            message={todayDecision.explanation}
            level={todayDecision.recommendationLevel}
            reasons={todayDecision.reasons}
            ctaLabel={todayDecision.bestNextAction}
            onCtaPress={handleRegister}
          />
        ) : null}

        {/* Recovery guidance — shown when skin response signals overexposure */}
        {todayDecision.recoveryStatus.level !== 'none' ? (
          <RecoveryGuidanceCard recovery={todayDecision.recoveryStatus} />
        ) : null}

        {/* Live UV */}
        {uvForecast !== null ? <UvIndexCard forecast={uvForecast} /> : null}

        {showUvUnavailable ? (
          <Card variant="outlined">
            <AppText variant="bodyStrong">Índice UV no disponible</AppText>
            <AppText variant="caption" color="textSecondary" style={styles.uvUnavailableText}>
              {locationStatus === 'denied'
                ? 'Activa el permiso de ubicación para ver el índice UV de tu zona en tiempo real.'
                : 'No hemos podido obtener el índice UV ahora mismo. Desliza para reintentar.'}
            </AppText>
          </Card>
        ) : null}

        {/* Skin clock */}
        {uvForecast !== null ? (
          <BurnTimeCard skinType={skinType} uvIndex={uvForecast.current.uvIndex} />
        ) : null}

        {/* Safety streak */}
        <StreakCard streak={todayDecision.safetyStreak} />

        {/* Tanning plan */}
        <TanPlanCard plan={todayDecision.tanPlan} onPress={() => router.push('/(app)/plan')} />

        {/* Achievements */}
        <AchievementsCard
          summary={gamification}
          onPress={() => router.push('/(app)/achievements')}
        />

        {/* Vitamin D from today's exposure */}
        {uvForecast !== null && todayMinutes > 0 ? (
          <VitaminDCard
            skinType={skinType}
            uvIndex={uvForecast.current.uvIndex}
            minutes={todayMinutes}
          />
        ) : null}

        {/* Weekly summary */}
        {todayDecision.recommendationLevel !== null ? (
          <WeeklySummaryCard
            sessionsCount={weeklySessionsCount}
            totalMinutes={weeklyTotalMinutes}
            lastSensationLabel={lastSensationLabel}
            recommendationLevel={todayDecision.recommendationLevel}
          />
        ) : null}

        {/* Live session CTA */}
        <Button
          label="Sesión en directo"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(app)/live-session')}
          accessibilityLabel="Iniciar una sesión de exposición en directo"
        />

        {/* Register CTA */}
        <Button
          label="Registrar exposición"
          variant="secondary"
          size="md"
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
  uvUnavailableText: {
    marginTop: spacing.xs,
    lineHeight: 18,
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
