import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Screen, AppText, Button } from '@/components/ui'
import { ProfileOptionCard, FormSection } from '@/components/product'
import { colors, radius, spacing } from '@/design'
import type { SkinType } from '@/modules/profile/profile.types'
import {
  FITZPATRICK_QUESTIONS,
  FITZPATRICK_SECTION_META,
  FITZPATRICK_TYPE_SUMMARY,
  computeFitzpatrick,
} from '@/modules/profile/fitzpatrick'
import type { FitzpatrickAnswers, FitzpatrickScore } from '@/modules/profile/fitzpatrick'

type Props = {
  /** Called with the chosen phototype when the user confirms a result. */
  onComplete: (skinType: SkinType) => void
  /** Called when the user prefers not to determine a phototype. */
  onSkip: () => void
  /** Called when the user backs out of the very first question. */
  onExit?: (() => void) | undefined
  /** Shows the saving state on the confirm button. */
  saving?: boolean | undefined
  /** Error surfaced from the save attempt. */
  error?: string | null | undefined
}

const MANUAL_TYPES: SkinType[] = [1, 2, 3, 4, 5, 6]
const TOTAL = FITZPATRICK_QUESTIONS.length

export function FitzpatrickTest({ onComplete, onSkip, onExit, saving, error }: Props) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<FitzpatrickAnswers>({})
  const [phase, setPhase] = useState<'questions' | 'result'>('questions')
  const [manual, setManual] = useState(false)
  const [manualType, setManualType] = useState<SkinType | null>(null)

  // ─── Result phase ───────────────────────────────────────────────────────────
  if (phase === 'result') {
    const computed = computeFitzpatrick(answers)
    const selectedType: SkinType = manual && manualType !== null ? manualType : computed.skinType
    const summary = FITZPATRICK_TYPE_SUMMARY[selectedType]

    return (
      <Screen scroll padded>
        <View style={styles.container}>
          <View style={styles.content}>
            <AppText variant="caption" color="textMuted">
              Resultado de tu fototipo
            </AppText>

            <View style={styles.resultCard}>
              <AppText variant="title" color="brand">
                {summary.title}
              </AppText>
              <AppText variant="bodyStrong" style={styles.resultHeadline}>
                {summary.headline}
              </AppText>
              <AppText variant="body" color="textSecondary" style={styles.resultDetail}>
                {summary.detail}
              </AppText>
            </View>

            <AppText variant="caption" color="textMuted" style={styles.resultNote}>
              Bronze IQ usa tu fototipo para calibrar sus estimaciones orientativas. No es un
              diagnóstico médico y puedes cambiarlo cuando quieras.
            </AppText>

            {manual ? (
              <FormSection
                title="Ajusta tu fototipo"
                description="Si crees que otro tipo describe mejor tu piel, selecciónalo."
              >
                {MANUAL_TYPES.map((type) => (
                  <ProfileOptionCard
                    key={type}
                    label={FITZPATRICK_TYPE_SUMMARY[type].title}
                    description={FITZPATRICK_TYPE_SUMMARY[type].headline}
                    selected={selectedType === type}
                    onPress={() => setManualType(type)}
                    testID={`fitzpatrick-manual-${type}`}
                  />
                ))}
              </FormSection>
            ) : null}

            {error ? (
              <View style={styles.errorBanner}>
                <AppText variant="caption" color="danger">
                  {error}
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button
              label="Usar este fototipo"
              variant="primary"
              size="lg"
              fullWidth
              loading={saving ?? false}
              onPress={() => onComplete(selectedType)}
              accessibilityLabel={`Usar fototipo ${summary.title}`}
              testID="fitzpatrick-confirm"
            />
            {!manual ? (
              <Button
                label="Ajustar manualmente"
                variant="ghost"
                size="md"
                fullWidth
                disabled={saving}
                onPress={() => {
                  setManual(true)
                  setManualType(computed.skinType)
                }}
                accessibilityLabel="Ajustar el fototipo manualmente"
                testID="fitzpatrick-adjust"
              />
            ) : null}
            <Button
              label="Repetir el test"
              variant="ghost"
              size="md"
              fullWidth
              disabled={saving}
              onPress={() => {
                setAnswers({})
                setIndex(0)
                setManual(false)
                setManualType(null)
                setPhase('questions')
              }}
              accessibilityLabel="Volver a empezar el test de fototipo"
            />
          </View>
        </View>
      </Screen>
    )
  }

  // ─── Questions phase ────────────────────────────────────────────────────────
  const question = FITZPATRICK_QUESTIONS[index]
  if (!question) return null

  const section = FITZPATRICK_SECTION_META[question.section]
  const currentScore = answers[question.id]
  const answered = typeof currentScore === 'number'
  const isLast = index === TOTAL - 1
  const isFirst = index === 0
  const progress = (index + 1) / TOTAL

  const choose = (score: FitzpatrickScore) =>
    setAnswers((prev) => ({ ...prev, [question.id]: score }))

  const goNext = () => {
    if (isLast) setPhase('result')
    else setIndex((i) => i + 1)
  }

  return (
    <Screen scroll padded>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.progressHeader}>
            <AppText variant="caption" color="textMuted">
              {section.title} · Pregunta {index + 1} de {TOTAL}
            </AppText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          <AppText variant="title">{question.prompt}</AppText>
          {question.help !== undefined ? (
            <AppText variant="body" color="textSecondary" style={styles.help}>
              {question.help}
            </AppText>
          ) : null}

          <View style={styles.options}>
            {question.options.map((option) => (
              <ProfileOptionCard
                key={option.value}
                label={option.label}
                description={option.help}
                selected={currentScore === option.score}
                onPress={() => choose(option.score)}
                testID={`fitzpatrick-${question.id}-${option.value}`}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label={isLast ? 'Ver mi fototipo' : 'Continuar'}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!answered}
            onPress={goNext}
            accessibilityLabel={isLast ? 'Ver el resultado de tu fototipo' : 'Siguiente pregunta'}
            testID="fitzpatrick-next"
          />
          {isFirst ? (
            <Button
              label="Prefiero no indicarlo"
              variant="ghost"
              size="md"
              fullWidth
              onPress={onSkip}
              accessibilityLabel="Continuar sin determinar el fototipo"
              testID="fitzpatrick-skip"
            />
          ) : (
            <Button
              label="Atrás"
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
              accessibilityLabel="Pregunta anterior"
            />
          )}
          {isFirst && onExit !== undefined ? (
            <Button
              label="Volver"
              variant="ghost"
              size="md"
              fullWidth
              onPress={onExit}
              accessibilityLabel="Volver al paso anterior"
            />
          ) : null}
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  content: {
    flex: 1,
    gap: spacing.md,
  },
  progressHeader: {
    gap: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.sm,
    backgroundColor: colors.brand,
  },
  help: {
    marginTop: spacing.xs,
  },
  options: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  resultCard: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brand,
    padding: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  resultHeadline: {
    marginTop: spacing.sm,
  },
  resultDetail: {
    marginTop: spacing.xs,
  },
  resultNote: {
    marginTop: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
})
