import React, { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useKeepAwake } from 'expo-keep-awake'
import * as Haptics from 'expo-haptics'
import { AppText, Badge, Button, Card } from '@/components/ui'
import { colors, radius, spacing } from '@/design'
import { useProfileStore } from '@/modules/profile/profile.store'
import { useUvStore } from '@/modules/uv'
import {
  computeLiveSessionState,
  formatClock,
  LIVE_STATUS_LABELS,
  LIVE_STATUS_MESSAGES,
  LIVE_STATUS_TO_BADGE,
  SPF_PRESETS,
} from '@/modules/live'
import type { SpfPreset } from '@/modules/live'

const SPF_LABELS: Record<SpfPreset, string> = {
  1: 'Sin protección',
  30: 'SPF 30',
  50: 'SPF 50',
}

function buzz(type: Haptics.NotificationFeedbackType) {
  void Haptics.notificationAsync(type).catch(() => undefined)
}

export default function LiveSessionScreen() {
  useKeepAwake()

  const skinType = useProfileStore((s) => s.profile?.skinType ?? null)
  const sunSensitivity = useProfileStore((s) => s.profile?.sunSensitivity ?? null)
  const uvForecast = useUvStore((s) => s.forecast)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [spf, setSpf] = useState<SpfPreset>(1)
  const [showFlip, setShowFlip] = useState(false)

  const uvIndex = uvForecast?.current.uvIndex ?? 0
  const state = computeLiveSessionState({ elapsedSeconds, skinType, uvIndex, spf, sunSensitivity })

  // Tick every second while running.
  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isRunning])

  // Safety and flip alerts on state transitions.
  const prevStatus = useRef(state.status)
  const prevFlip = useRef(state.flipCount)
  useEffect(() => {
    if (state.status !== prevStatus.current) {
      if (state.status === 'caution') buzz(Haptics.NotificationFeedbackType.Warning)
      else if (state.status === 'danger') buzz(Haptics.NotificationFeedbackType.Error)
      prevStatus.current = state.status
    }
    if (state.flipCount > prevFlip.current) {
      prevFlip.current = state.flipCount
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined)
      setShowFlip(true)
    }
  }, [state.status, state.flipCount])

  // Auto-hide the flip banner.
  useEffect(() => {
    if (!showFlip) return
    const id = setTimeout(() => setShowFlip(false), 5000)
    return () => clearTimeout(id)
  }, [showFlip])

  const handleReset = () => {
    setIsRunning(false)
    setElapsedSeconds(0)
    prevStatus.current = 'safe'
    prevFlip.current = 0
    setShowFlip(false)
  }

  const handleFinish = () => {
    setIsRunning(false)
    router.push('/(app)/session-log')
  }

  if (uvForecast === null) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.empty}>
          <AppText variant="heading">Necesitamos el índice UV</AppText>
          <AppText variant="body" color="textSecondary" style={styles.emptyText}>
            La sesión en directo usa el índice UV de tu zona para avisarte a tiempo. Activa la
            ubicación desde Inicio y vuelve a intentarlo.
          </AppText>
          <Button
            label="Volver"
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.back()}
            accessibilityLabel="Volver a la pantalla anterior"
          />
        </View>
      </SafeAreaView>
    )
  }

  const isDanger = state.status === 'danger'
  const clockColor = isDanger ? 'danger' : 'brand'

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        {/* SPF selector */}
        <View style={styles.spfRow}>
          {SPF_PRESETS.map((preset) => {
            const selected = spf === preset
            return (
              <Pressable
                key={preset}
                onPress={() => setSpf(preset)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={SPF_LABELS[preset]}
                style={[styles.spfChip, selected ? styles.spfChipOn : styles.spfChipOff]}
              >
                <AppText variant="caption" color={selected ? 'white' : 'textSecondary'}>
                  {SPF_LABELS[preset]}
                </AppText>
              </Pressable>
            )
          })}
        </View>

        {/* Protection note */}
        {state.status !== 'no_risk' && state.protectionReality.explanation !== '' ? (
          <AppText variant="caption" color="textMuted" style={styles.protectionNote}>
            {state.protectionReality.explanation}
          </AppText>
        ) : null}

        {/* Clock */}
        <View style={styles.clockBlock}>
          <AppText variant="display" color={clockColor} style={styles.clock}>
            {formatClock(state.elapsedSeconds)}
          </AppText>
          <Badge
            level={LIVE_STATUS_TO_BADGE[state.status]}
            label={LIVE_STATUS_LABELS[state.status]}
          />
        </View>

        {/* Status message */}
        <Card variant={isDanger ? 'elevated' : 'outlined'}>
          <AppText variant="body" color={isDanger ? 'danger' : 'textSecondary'}>
            {LIVE_STATUS_MESSAGES[state.status]}
          </AppText>

          {state.remainingSafeSeconds !== null ? (
            <>
              <View style={styles.metaRow}>
                <AppText variant="caption" color="textSecondary">
                  Tiempo estimado restante
                </AppText>
                <AppText variant="bodyStrong" color={isDanger ? 'danger' : 'brand'}>
                  {formatClock(state.remainingSafeSeconds)}
                </AppText>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(state.progress * 100)}%` }]} />
              </View>
            </>
          ) : null}
        </Card>

        {/* Reapply protection warning */}
        {state.protectionReality.reapplyWarning ? (
          <Card variant="elevated">
            <AppText variant="bodyStrong" color="warning">
              Reaplica la protección
            </AppText>
            <AppText variant="caption" color="textSecondary" style={styles.reapplyText}>
              {state.protectionReality.explanation}
            </AppText>
          </Card>
        ) : null}

        {/* Flip reminder */}
        {showFlip ? (
          <Card variant="elevated">
            <AppText variant="bodyStrong" color="brand">
              Date la vuelta
            </AppText>
            <AppText variant="caption" color="textSecondary" style={styles.flipText}>
              Cambia de lado para un bronceado uniforme ({state.flipCount} giros).
            </AppText>
          </Card>
        ) : null}

        <View style={styles.spacer} />

        {/* Controls */}
        <Button
          label={isRunning ? 'Pausar' : elapsedSeconds === 0 ? 'Empezar' : 'Reanudar'}
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => setIsRunning((r) => !r)}
          accessibilityLabel={isRunning ? 'Pausar la sesión' : 'Iniciar la sesión'}
        />
        <Button
          label="Finalizar y registrar"
          variant="secondary"
          size="md"
          fullWidth
          onPress={handleFinish}
          accessibilityLabel="Finalizar la sesión y registrarla"
        />
        <Button
          label="Reiniciar"
          variant="ghost"
          size="md"
          fullWidth
          onPress={handleReset}
          accessibilityLabel="Reiniciar el cronómetro"
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  emptyText: {
    lineHeight: 24,
  },
  spfRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  spfChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  spfChipOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  spfChipOff: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  clockBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  clock: {
    fontSize: 64,
    lineHeight: 72,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundMuted,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  fill: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  protectionNote: {
    lineHeight: 18,
  },
  reapplyText: {
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  flipText: {
    marginTop: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
})
