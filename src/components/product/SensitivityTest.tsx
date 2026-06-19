import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Screen, AppText, Button } from '@/components/ui'
import { ProfileOptionCard } from '@/components/product'
import { colors, radius, spacing } from '@/design'
import type {
  AgeRange,
  BlisteringSunburns,
  TanningBedUse,
  MoleCount,
} from '@/modules/profile/profile.types'
import { SENSITIVITY_QUESTIONS, getCareNotes } from '@/modules/profile/sensitivity'
import type { SensitivityFieldKey, SensitivityProfile } from '@/modules/profile/sensitivity'

type Props = {
  /** Called with the (possibly partial) sensitivity profile when finished. */
  onComplete: (profile: SensitivityProfile) => void
  /** Called when the whole optional layer is skipped. */
  onSkip: () => void
  saving?: boolean | undefined
  error?: string | null | undefined
}

type Answers = Partial<Record<SensitivityFieldKey, string>>

const TOTAL = SENSITIVITY_QUESTIONS.length

function buildProfile(answers: Answers): SensitivityProfile {
  return {
    ageRange: (answers.ageRange as AgeRange | undefined) ?? null,
    blisteringSunburns: (answers.blisteringSunburns as BlisteringSunburns | undefined) ?? null,
    tanningBedUse: (answers.tanningBedUse as TanningBedUse | undefined) ?? null,
    moleCount: (answers.moleCount as MoleCount | undefined) ?? null,
  }
}

export function SensitivityTest({ onComplete, onSkip, saving, error }: Props) {
  const [phase, setPhase] = useState<'intro' | 'questions' | 'summary'>('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})

  // ─── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <Screen scroll padded>
        <View style={styles.container}>
          <View style={styles.content}>
            <AppText variant="caption" color="textMuted">
              Paso opcional
            </AppText>
            <AppText variant="title">Afinemos tu perfil de sensibilidad</AppText>
            <AppText variant="body" color="textSecondary" style={styles.intro}>
              Cuatro preguntas rápidas sobre factores con respaldo científico (quemaduras, lunares,
              cabinas UVA y edad). Nos ayudan a ser más prudentes contigo. Es opcional: puedes
              responder lo que quieras o saltarlo.
            </AppText>
            <AppText variant="caption" color="textMuted" style={styles.introNote}>
              No es un diagnóstico médico ni sustituye a un profesional.
            </AppText>
          </View>
          <View style={styles.actions}>
            <Button
              label="Empezar"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => setPhase('questions')}
              accessibilityLabel="Empezar el perfil de sensibilidad"
              testID="sensitivity-start"
            />
            <Button
              label="Saltar por ahora"
              variant="ghost"
              size="md"
              fullWidth
              disabled={saving}
              onPress={onSkip}
              accessibilityLabel="Saltar el perfil de sensibilidad"
              testID="sensitivity-skip"
            />
          </View>
        </View>
      </Screen>
    )
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const profile = buildProfile(answers)
    const notes = getCareNotes(profile)

    return (
      <Screen scroll padded>
        <View style={styles.container}>
          <View style={styles.content}>
            <AppText variant="caption" color="textMuted">
              Tu perfil de cuidado
            </AppText>
            <AppText variant="title">
              {notes.length > 0 ? 'Lo tendremos muy en cuenta' : 'Perfil registrado'}
            </AppText>

            {notes.length > 0 ? (
              <View style={styles.notes}>
                {notes.map((note) => (
                  <View key={note} style={styles.noteCard}>
                    <AppText variant="body" color="textPrimary">
                      {note}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : (
              <AppText variant="body" color="textSecondary" style={styles.intro}>
                Gracias. Bronze IQ usará estas respuestas para ajustar su nivel de prudencia.
              </AppText>
            )}

            <AppText variant="caption" color="textMuted" style={styles.introNote}>
              Esta orientación es general y no constituye un diagnóstico. Ante cualquier duda o
              cambio en tu piel, consulta con un profesional sanitario.
            </AppText>

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
              label="Finalizar"
              variant="primary"
              size="lg"
              fullWidth
              loading={saving ?? false}
              onPress={() => onComplete(profile)}
              accessibilityLabel="Finalizar y guardar el perfil"
              testID="sensitivity-finish"
            />
            <Button
              label="Atrás"
              variant="ghost"
              size="md"
              fullWidth
              disabled={saving}
              onPress={() => {
                setPhase('questions')
                setIndex(TOTAL - 1)
              }}
              accessibilityLabel="Volver a las preguntas"
            />
          </View>
        </View>
      </Screen>
    )
  }

  // ─── Questions ──────────────────────────────────────────────────────────────
  const question = SENSITIVITY_QUESTIONS[index]
  if (!question) return null

  const current = answers[question.field]
  const answered = current !== undefined
  const isLast = index === TOTAL - 1
  const isFirst = index === 0
  const progress = (index + 1) / TOTAL

  const choose = (value: string) => setAnswers((prev) => ({ ...prev, [question.field]: value }))

  const advance = () => {
    if (isLast) setPhase('summary')
    else setIndex((i) => i + 1)
  }

  const goBack = () => {
    if (isFirst) setPhase('intro')
    else setIndex((i) => i - 1)
  }

  return (
    <Screen scroll padded>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.progressHeader}>
            <AppText variant="caption" color="textMuted">
              Sensibilidad · {index + 1} de {TOTAL}
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
          {question.source !== undefined ? (
            <AppText variant="caption" color="textMuted" style={styles.source}>
              Base científica: {question.source}
            </AppText>
          ) : null}

          <View style={styles.options}>
            {question.options.map((option) => (
              <ProfileOptionCard
                key={option.value}
                label={option.label}
                selected={current === option.value}
                onPress={() => choose(option.value)}
                testID={`sensitivity-${question.field}-${option.value}`}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label={isLast ? 'Ver resumen' : 'Continuar'}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!answered}
            onPress={advance}
            accessibilityLabel={isLast ? 'Ver el resumen' : 'Siguiente pregunta'}
            testID="sensitivity-next"
          />
          <Button
            label="Omitir esta pregunta"
            variant="ghost"
            size="md"
            fullWidth
            onPress={advance}
            accessibilityLabel="Omitir esta pregunta"
            testID="sensitivity-omit"
          />
          <Button
            label="Atrás"
            variant="ghost"
            size="md"
            fullWidth
            onPress={goBack}
            accessibilityLabel={isFirst ? 'Volver a la introducción' : 'Pregunta anterior'}
          />
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
  intro: {
    marginTop: spacing.sm,
  },
  introNote: {
    marginTop: spacing.sm,
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
  source: {
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  options: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  notes: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  noteCard: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brand,
    padding: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
})
