import React, { useState } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { Screen, AppText, Button, Input } from '@/components/ui'
import {
  OnboardingStep,
  ProfileOptionCard,
  FormSection,
  FitzpatrickTest,
} from '@/components/product'
import { colors, spacing, radius } from '@/design'
import type { MainGoal, SunSensitivity, SkinType } from '@/modules/profile/profile.types'
import { useProfileStore } from '@/modules/profile/profile.store'
import { useAuthStore } from '@/modules/auth/auth.store'

// ─── Wizard state ────────────────────────────────────────────────────────────

type WizardState = {
  step: number
  disclaimerAccepted: boolean
  disclaimerAcceptedAt: string | null
  alias: string
  aliasTouched: boolean
  mainGoal: MainGoal | null
  sunSensitivity: SunSensitivity | null
}

const MAIN_GOAL_OPTIONS: Array<{ label: string; value: MainGoal }> = [
  { label: 'Mantener un bronceado gradual', value: 'gradual_bronze' },
  { label: 'Evitar pasarme con el sol', value: 'avoid_overexposure' },
  { label: 'Registrar mis sesiones', value: 'track_sessions' },
  { label: 'Crear una rutina más consciente', value: 'conscious_routine' },
]

const SENSITIVITY_OPTIONS: Array<{ label: string; value: SunSensitivity }> = [
  { label: 'Me quemo con facilidad', value: 'very_high' },
  { label: 'A veces me irrito si me paso', value: 'high' },
  { label: 'Normalmente tolero exposiciones moderadas', value: 'medium' },
  { label: 'Suelo tolerarlo bien, pero quiero controlarlo', value: 'low' },
]

// ─── Step progress ───────────────────────────────────────────────────────────

// Steps 4–7 are the profile setup steps. Progress is shown as "X de 4".
const PROFILE_STEP_LABEL: Record<number, string> = {
  4: 'Perfil · 1 de 4',
  5: 'Perfil · 2 de 4',
  6: 'Perfil · 3 de 4',
  7: 'Perfil · 4 de 4',
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const user = useAuthStore((s) => s.user)
  const { completeOnboarding, isSubmitting, error, clearError } = useProfileStore()

  const [wizard, setWizard] = useState<WizardState>({
    step: 0,
    disclaimerAccepted: false,
    disclaimerAcceptedAt: null,
    alias: '',
    aliasTouched: false,
    mainGoal: null,
    sunSensitivity: null,
  })

  const update = (partial: Partial<WizardState>) => setWizard((prev) => ({ ...prev, ...partial }))

  const next = () => update({ step: wizard.step + 1 })

  const aliasError = wizard.aliasTouched
    ? wizard.alias.trim().length < 2
      ? 'El alias debe tener al menos 2 caracteres'
      : wizard.alias.trim().length > 30
        ? 'El alias no puede superar 30 caracteres'
        : null
    : null

  const handleSave = async (skinType: SkinType | null) => {
    if (!user) return
    clearError()
    await completeOnboarding(user.id, {
      alias: wizard.alias.trim(),
      mainGoal: wizard.mainGoal as MainGoal,
      sunSensitivity: wizard.sunSensitivity as SunSensitivity,
      skinType,
      disclaimerAcceptedAt: wizard.disclaimerAcceptedAt as string,
    })
  }

  // ─── Steps ────────────────────────────────────────────────────────────────

  // Step 0 — Intro 1
  if (wizard.step === 0) {
    return (
      <OnboardingStep
        title="Menos improvisación. Más control."
        message="Bronze IQ te ayuda a registrar tus sesiones de exposición solar, revisar tu historial reciente y recibir orientación prudente basada en tus propios datos."
        primaryLabel="Continuar"
        onPrimaryPress={next}
      />
    )
  }

  // Step 1 — Intro 2
  if (wizard.step === 1) {
    return (
      <OnboardingStep
        title="Una guía prudente, no una garantía médica."
        message="Bronze IQ no diagnostica, no sustituye al dermatólogo y no puede garantizar que una exposición sea segura. Sus recomendaciones son orientativas y conservadoras."
        primaryLabel="Lo entiendo"
        onPrimaryPress={next}
      />
    )
  }

  // Step 2 — Intro 3
  if (wizard.step === 2) {
    return (
      <OnboardingStep
        title="Escucha las señales de tu piel."
        message="La app prioriza la prudencia. Si registras molestias, irritación, quemadura o acumulación elevada, Bronze IQ te recomendará bajar el ritmo o descansar."
        primaryLabel="Continuar"
        onPrimaryPress={next}
      />
    )
  }

  // Step 3 — Disclaimer
  if (wizard.step === 3) {
    return (
      <Screen scroll padded>
        <View style={styles.stepContainer}>
          <View style={styles.stepContent}>
            <AppText variant="title">Antes de empezar</AppText>
            <AppText variant="body" color="textSecondary" style={styles.stepMessage}>
              Bronze IQ ofrece orientación general para ayudarte a registrar y entender mejor tu
              exposición solar. No es una herramienta médica, no diagnostica condiciones de la piel
              y no sustituye el consejo de un profesional sanitario. La exposición solar puede
              implicar riesgos. Usa protección adecuada, evita excesos y consulta con un profesional
              si tienes dudas, antecedentes, lesiones, quemaduras frecuentes o condiciones de
              sensibilidad.
            </AppText>
            <Pressable
              style={styles.checkboxRow}
              onPress={() => {
                const accepted = !wizard.disclaimerAccepted
                update({
                  disclaimerAccepted: accepted,
                  disclaimerAcceptedAt: accepted ? new Date().toISOString() : null,
                })
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: wizard.disclaimerAccepted }}
              accessibilityLabel="He leído y entiendo los límites de Bronze IQ"
              testID="onboarding-disclaimer-checkbox"
            >
              <View
                style={[
                  styles.checkbox,
                  wizard.disclaimerAccepted ? styles.checkboxChecked : styles.checkboxUnchecked,
                ]}
              >
                {wizard.disclaimerAccepted ? (
                  <AppText variant="caption" color="white" style={styles.checkmark}>
                    ✓
                  </AppText>
                ) : null}
              </View>
              <AppText variant="body" color="textPrimary" style={styles.checkboxLabel}>
                He leído y entiendo los límites de Bronze IQ.
              </AppText>
            </Pressable>
          </View>
          <View style={styles.stepActions}>
            <Button
              label="Aceptar y continuar"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!wizard.disclaimerAccepted}
              onPress={next}
              accessibilityLabel="Aceptar disclaimer y continuar"
              testID="onboarding-disclaimer-accept"
            />
          </View>
        </View>
      </Screen>
    )
  }

  // Step 4 — Alias
  if (wizard.step === 4) {
    const canAdvance = wizard.alias.trim().length >= 2 && wizard.alias.trim().length <= 30

    return (
      <Screen padded>
        <View style={styles.stepContainer}>
          <View style={styles.stepContent}>
            <AppText variant="caption" color="textMuted">
              {PROFILE_STEP_LABEL[4]}
            </AppText>
            <AppText variant="title">¿Cómo quieres que te llamemos?</AppText>
            <AppText variant="body" color="textSecondary" style={styles.stepMessage}>
              Puedes usar un alias, apodo o lo que prefieras. No necesitamos tu nombre completo.
            </AppText>
            <View style={styles.fieldContainer}>
              <Input
                label="Alias"
                placeholder="Ej: Alex, Lola, Sol…"
                value={wizard.alias}
                onChangeText={(text) => update({ alias: text })}
                onBlur={() => update({ aliasTouched: true })}
                error={aliasError ?? undefined}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={30}
                testID="onboarding-alias-input"
              />
            </View>
          </View>
          <View style={styles.stepActions}>
            <Button
              label="Continuar"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canAdvance}
              onPress={() => {
                update({ aliasTouched: true })
                if (canAdvance) next()
              }}
              accessibilityLabel="Continuar con el alias introducido"
              testID="onboarding-alias-continue"
            />
          </View>
        </View>
      </Screen>
    )
  }

  // Step 5 — Main goal
  if (wizard.step === 5) {
    return (
      <Screen scroll padded>
        <View style={styles.stepContainer}>
          <View style={styles.stepContent}>
            <AppText variant="caption" color="textMuted">
              {PROFILE_STEP_LABEL[5]}
            </AppText>
            <FormSection
              title="¿Qué buscas controlar mejor?"
              description="Tu elección orienta los mensajes y sugerencias de Bronze IQ."
            >
              {MAIN_GOAL_OPTIONS.map((option) => (
                <ProfileOptionCard
                  key={option.value}
                  label={option.label}
                  selected={wizard.mainGoal === option.value}
                  onPress={() => update({ mainGoal: option.value })}
                />
              ))}
            </FormSection>
          </View>
          <View style={styles.stepActions}>
            <Button
              label="Continuar"
              variant="primary"
              size="lg"
              fullWidth
              disabled={wizard.mainGoal === null}
              onPress={next}
              accessibilityLabel="Continuar con el objetivo seleccionado"
            />
          </View>
        </View>
      </Screen>
    )
  }

  // Step 6 — Sun sensitivity
  if (wizard.step === 6) {
    return (
      <Screen scroll padded>
        <View style={styles.stepContainer}>
          <View style={styles.stepContent}>
            <AppText variant="caption" color="textMuted">
              {PROFILE_STEP_LABEL[6]}
            </AppText>
            <FormSection
              title="¿Cómo suele reaccionar tu piel al sol?"
              description="Esta información ayuda a que Bronze IQ sea más prudente. No sustituye una valoración médica."
            >
              {SENSITIVITY_OPTIONS.map((option) => (
                <ProfileOptionCard
                  key={option.value}
                  label={option.label}
                  selected={wizard.sunSensitivity === option.value}
                  onPress={() => update({ sunSensitivity: option.value })}
                />
              ))}
            </FormSection>
          </View>
          <View style={styles.stepActions}>
            <Button
              label="Continuar"
              variant="primary"
              size="lg"
              fullWidth
              disabled={wizard.sunSensitivity === null}
              onPress={next}
              accessibilityLabel="Continuar con la sensibilidad seleccionada"
            />
          </View>
        </View>
      </Screen>
    )
  }

  // Step 7 — Fitzpatrick phototype self-assessment (scored questionnaire)
  return (
    <FitzpatrickTest
      onComplete={(skinType) => void handleSave(skinType)}
      onSkip={() => void handleSave(null)}
      onExit={() => update({ step: 6 })}
      saving={isSubmitting}
      error={error}
    />
  )
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  stepContent: {
    flex: 1,
    gap: spacing.md,
  },
  stepMessage: {
    marginTop: spacing.sm,
  },
  stepActions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  fieldContainer: {
    marginTop: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  checkboxUnchecked: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
  },
  checkmark: {
    lineHeight: 16,
  },
  checkboxLabel: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
})
