import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Card } from '@/components/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback'
import {
  AchievementsCard,
  BurnTimeCard,
  FaceGuardCard,
  QuickActionsBar,
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
import { parseSessionSaveAcknowledgement } from '@/modules/sessions/session.acknowledgement'
import type { SaveAckTone } from '@/modules/sessions/session.acknowledgement'
import { useUvStore } from '@/modules/uv'
import { useLocationStore } from '@/modules/location'
import { usePlanStore } from '@/modules/plan'
import { buildGamificationSummary } from '@/modules/gamification'
import { buildTodayDecision } from '@/modules/today'
import { useNotificationStore } from '@/modules/notifications/notifications.store'

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

const ACK_TONE_BG: Record<SaveAckTone, string> = {
  positive: colors.successSoft,
  caution: colors.warningSoft,
  recovery: colors.warningSoft,
  avoid: colors.dangerSoft,
}

const ACK_TONE_TEXT: Record<SaveAckTone, 'success' | 'warning' | 'danger'> = {
  positive: 'success',
  caution: 'warning',
  recovery: 'warning',
  avoid: 'danger',
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)

  const profile = useProfileStore((s) => s.profile)
  const profileStatus = useProfileStore((s) => s.status)
  const clearProfile = useProfileStore((s) => s.clearProfile)

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
  const planStartDate = usePlanStore((s) => s.startDate)
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
      clearProfile()
    }
  }, [
    userId,
    loadTodaySessions,
    loadRecentSessions,
    loadHistorySessions,
    loadPlan,
    clearSessions,
    resetPlan,
    clearProfile,
  ])

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

  // Notification permission — asked once, separately, so it never re-triggers
  // the location/UV effect when the permission status changes from unknown.
  useEffect(() => {
    if (notificationPermission !== 'unknown') return
    void requestNotificationPermission()
  }, [notificationPermission, requestNotificationPermission])

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
        planStartDate,
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
      planStartDate,
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
      recoveryLevel: todayDecision.recoveryStatus.level,
      faceGuardLevel: todayDecision.faceGuard.level,
    })
  }, [
    scheduleNotifications,
    uvForecast,
    todayDecision.safetyStreak,
    todayDecision.hasActivePlan,
    todayDecision.recoveryStatus.level,
    todayDecision.faceGuard.level,
  ])

  const isLoading =
    profileStatus === 'loading' || todayStatus === 'loading' || recentSessionsStatus === 'loading'

  const loadError = todayError ?? recentSessionsError

  const handleRegister = () => {
    router.push('/(app)/session-log')
  }

  // Route the Today Decision CTA to match its label's intent (logging vs. history)
  // so the button never says one thing and does another.
  const handleDecisionCta = () => {
    if (todayDecision.bestNextActionTarget === 'history') {
      router.push('/(app)/history')
    } else {
      handleRegister()
    }
  }

  // In rest/recovery states Home must not push exposure. The live-session entry
  // stays accessible but is de-emphasised so it doesn't contradict the guidance.
  const deEmphasizeExposure =
    todayDecision.state === 'recovery' ||
    todayDecision.state === 'avoid' ||
    todayDecision.recoveryStatus.level === 'recovery_recommended' ||
    todayDecision.recoveryStatus.level === 'avoid_direct_exposure'

  // Post-save acknowledgement, carried from Session Log via a route param.
  // Parsed in a pure helper so invalid/missing values are ignored safely.
  const ackParams = useLocalSearchParams<{ saved?: string; savedId?: string }>()
  const savedParam = ackParams.saved
  const savedKey = typeof savedParam === 'string' ? savedParam : null
  const savedId = typeof ackParams.savedId === 'string' ? ackParams.savedId : null
  const acknowledgement = useMemo(() => parseSessionSaveAcknowledgement(savedParam), [savedParam])
  const [dismissedAckKey, setDismissedAckKey] = useState<string | null>(null)
  const showAcknowledgement = acknowledgement !== null && savedKey !== dismissedAckKey
  // When deeper recovery guidance is already on screen, keep the ack transactional.
  const ackCompact = todayDecision.recoveryStatus.level !== 'none'

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
    uvForecast === null &&
    (uvStatus === 'error' || locationStatus === 'denied' || locationStatus === 'error')

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
            Esto es lo que Bronze IQ sugiere hoy.
          </AppText>
        </View>

        {/* Post-save acknowledgement — brief, dismissible, varies by skin response.
            Compact when RecoveryGuidanceCard already carries the deeper guidance. */}
        {showAcknowledgement && acknowledgement !== null ? (
          <View
            style={[styles.ackBanner, { backgroundColor: ACK_TONE_BG[acknowledgement.tone] }]}
            accessibilityRole="summary"
          >
            <View style={styles.ackTextGroup}>
              <AppText variant="bodyStrong" color={ACK_TONE_TEXT[acknowledgement.tone]}>
                {acknowledgement.title}
              </AppText>
              {!ackCompact ? (
                <AppText variant="caption" color="textSecondary" style={styles.ackMessage}>
                  {acknowledgement.message}
                </AppText>
              ) : null}
              {savedId !== null ? (
                <Pressable
                  onPress={() => router.push(`/(app)/session-detail/${savedId}`)}
                  accessibilityRole="button"
                  accessibilityLabel="Ver la sesión registrada"
                  hitSlop={8}
                >
                  <AppText variant="caption" color="brand" style={styles.ackLink}>
                    Ver sesión
                  </AppText>
                </Pressable>
              ) : null}
            </View>
            <Pressable
              onPress={() => setDismissedAckKey(savedKey)}
              accessibilityRole="button"
              accessibilityLabel="Descartar confirmación"
              hitSlop={8}
            >
              <AppText variant="caption" color="textMuted">
                Entendido
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {/* Today Decision — primary card */}
        {todayDecision.recommendationLevel !== null ? (
          <RecommendationCard
            title={todayDecision.title}
            message={todayDecision.explanation}
            level={todayDecision.recommendationLevel}
            reasons={todayDecision.reasons}
            ctaLabel={todayDecision.bestNextAction}
            onCtaPress={handleDecisionCta}
          />
        ) : null}

        {/* Recovery guidance — shown when skin response signals overexposure */}
        {todayDecision.recoveryStatus.level !== 'none' ? (
          <RecoveryGuidanceCard recovery={todayDecision.recoveryStatus} />
        ) : null}

        {/* Face Guard — shown when elevated or strong */}
        <FaceGuardCard faceGuard={todayDecision.faceGuard} />

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
        <TanPlanCard
          plan={todayDecision.tanPlan}
          adherence={todayDecision.planAdherence}
          onPress={() => router.push('/(app)/plan')}
        />

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

        {/* Live session CTA — de-emphasised in rest/recovery states so Home does
            not push direct exposure while still keeping the action reachable. */}
        <Button
          label="Sesión en directo"
          variant={deEmphasizeExposure ? 'secondary' : 'primary'}
          size={deEmphasizeExposure ? 'md' : 'lg'}
          fullWidth
          onPress={() => router.push('/(app)/live-session')}
          accessibilityLabel="Iniciar una sesión de exposición en directo"
        />

        {/* Compact secondary navigation — logout lives in Settings */}
        <QuickActionsBar
          actions={[
            {
              label: 'Registrar',
              onPress: handleRegister,
              accessibilityLabel: 'Registrar una sesión de exposición solar',
            },
            {
              label: 'Historial',
              onPress: () => router.push('/(app)/history'),
              accessibilityLabel: 'Ver historial completo de sesiones',
            },
            {
              label: 'Ajustes',
              onPress: () => router.push('/(app)/settings'),
              accessibilityLabel: 'Ir a ajustes',
            },
          ]}
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
  ackBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
  },
  ackTextGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  ackMessage: {
    lineHeight: 18,
  },
  ackLink: {
    marginTop: spacing.xs,
    fontWeight: '600',
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
})
