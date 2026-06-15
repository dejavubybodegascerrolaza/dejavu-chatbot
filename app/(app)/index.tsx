import React, { useEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Card } from '@/components/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback'
import {
  AchievementsCard,
  BurnTimeCard,
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
import { generateRecommendation } from '@/modules/recommendations/recommendation.service'
import { LEVEL_SUBTEXTS } from '@/modules/recommendations/recommendation.labels'
import { useUvStore } from '@/modules/uv'
import { useLocationStore } from '@/modules/location'
import { generateTanPlan, usePlanStore } from '@/modules/plan'
import { buildGamificationSummary } from '@/modules/gamification'

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

  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    const today = getTodayString()
    void loadTodaySessions(userId, today)
    void loadRecentSessions(userId, 7)
    void loadHistorySessions(userId)
    return () => {
      clearSessions()
    }
  }, [userId, loadTodaySessions, loadRecentSessions, loadHistorySessions, clearSessions])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const coords = await requestLocation()
      if (!cancelled && coords) {
        await loadForecast(coords)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [requestLocation, loadForecast])

  const currentUv = uvForecast?.current.uvIndex ?? null

  const recommendation = useMemo(() => {
    if (!profile) return null
    return generateRecommendation({
      profile: {
        mainGoal: profile.mainGoal,
        sunSensitivity: profile.sunSensitivity,
        skinType: profile.skinType,
      },
      sessionsLast7Days: recentSessions,
      today: { uvIndexNow: currentUv },
    })
  }, [profile, recentSessions, currentUv])

  const maxUvToday = uvForecast?.maxToday ?? null

  const tanPlan = useMemo(() => {
    if (planGoal === null) return null
    return generateTanPlan({
      skinType: profile?.skinType ?? null,
      currentLevel: planCurrentLevel,
      goalLevel: planGoal,
      ...(maxUvToday !== null ? { typicalUvIndex: maxUvToday } : {}),
    })
  }, [planGoal, planCurrentLevel, profile?.skinType, maxUvToday])

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

        {/* Safety streak */}
        <StreakCard streak={gamification.safetyStreak} />

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

        {/* Tanning plan */}
        <TanPlanCard plan={tanPlan} onPress={() => router.push('/(app)/plan')} />

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
