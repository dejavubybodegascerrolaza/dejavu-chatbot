import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppText, Button, Input } from '@/components/ui'
import { DisclaimerBox } from '@/components/feedback'
import { ProfileOptionCard, FormSection } from '@/components/product'
import { colors, spacing } from '@/design'
import {
  exposureContextSchema,
  protectionLevelSchema,
  sensationAfterSchema,
} from '@/modules/sessions/session.schema'
import {
  CONTEXT_LABELS,
  PROTECTION_LABELS,
  SENSATION_LABELS,
} from '@/modules/sessions/session.labels'
import type { CreateExposureSessionInput } from '@/modules/sessions/session.schema'
import type {
  ExposureContext,
  ProtectionLevel,
  SensationAfter,
} from '@/modules/sessions/session.types'

// ─── Form schema ──────────────────────────────────────────────────────────────
// Numeric fields stay as strings (TextInput gives strings). Enum picker fields
// are optional so defaultValues can omit them; runtime validation in onSubmit.

const sessionFormSchema = z.object({
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  durationText: z
    .string()
    .min(1, 'Introduce la duración en minutos')
    .refine((v) => {
      const n = parseInt(v, 10)
      return !isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 300
    }, 'La duración debe estar entre 1 y 300 minutos'),
  context: exposureContextSchema.optional(),
  uvIndexManualRaw: z.string(),
  protectionLevel: protectionLevelSchema,
  sensationAfter: sensationAfterSchema.optional(),
  notes: z.string().max(500, 'Las notas no pueden superar 500 caracteres'),
})

type SessionFormValues = z.infer<typeof sessionFormSchema>

// ─── Option arrays ────────────────────────────────────────────────────────────

const CONTEXT_OPTIONS = (Object.keys(CONTEXT_LABELS) as ExposureContext[]).map((value) => ({
  value,
  label: CONTEXT_LABELS[value],
}))

const PROTECTION_OPTIONS = (Object.keys(PROTECTION_LABELS) as ProtectionLevel[]).map((value) => ({
  value,
  label: PROTECTION_LABELS[value],
}))

const SENSATION_OPTIONS = (Object.keys(SENSATION_LABELS) as SensationAfter[]).map((value) => ({
  value,
  label: SENSATION_LABELS[value],
}))

const UV_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'No indicado', value: '' },
  { label: '0–2 Bajo', value: '1' },
  { label: '3–5 Moderado', value: '4' },
  { label: '6–7 Alto', value: '6' },
  { label: '8–10 Muy alto', value: '9' },
  { label: '11 Extremo', value: '11' },
]

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  onSave: (input: CreateExposureSessionInput) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function SessionForm({ onSave, onCancel, isSubmitting }: Props) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      sessionDate: getTodayString(),
      durationText: '',
      uvIndexManualRaw: '',
      protectionLevel: 'unknown',
      notes: '',
    },
  })

  const durationText = useWatch({ control, name: 'durationText' })
  const durationNum = parseInt(durationText, 10)
  const showDurationWarning = !isNaN(durationNum) && durationNum > 180

  const onSubmit = async (values: SessionFormValues) => {
    // Validate picker fields that have no pre-selected default
    if (values.context === undefined) {
      setError('context', { message: 'Selecciona el contexto de la sesión' })
      return
    }
    if (values.sensationAfter === undefined) {
      setError('sensationAfter', { message: 'Selecciona cómo te sentiste' })
      return
    }

    const uvIndexManual =
      values.uvIndexManualRaw !== '' ? parseInt(values.uvIndexManualRaw, 10) : null

    const input: CreateExposureSessionInput = {
      sessionDate: values.sessionDate,
      durationMinutes: parseInt(values.durationText, 10),
      context: values.context,
      uvIndexManual,
      protectionLevel: values.protectionLevel,
      sensationAfter: values.sensationAfter,
      notes: values.notes.trim() !== '' ? values.notes : null,
    }

    await onSave(input)
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Date */}
      <FormSection title="Fecha">
        <Controller
          name="sessionDate"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Fecha"
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.sessionDate?.message}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
      </FormSection>

      {/* Duration */}
      <FormSection title="Duración aproximada">
        <Controller
          name="durationText"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Duración aproximada"
              placeholder="Ej. 45"
              helper="En minutos"
              keyboardType="number-pad"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.durationText?.message}
            />
          )}
        />
        {showDurationWarning ? (
          <View style={styles.warning}>
            <AppText variant="caption" color="warning">
              Es una duración elevada. Bronze IQ será especialmente prudente con esta sesión.
            </AppText>
          </View>
        ) : null}
      </FormSection>

      {/* Context */}
      <FormSection title="Contexto">
        <Controller
          name="context"
          control={control}
          render={({ field: { onChange, value } }) => (
            <View style={styles.options}>
              {CONTEXT_OPTIONS.map((opt) => (
                <ProfileOptionCard
                  key={opt.value}
                  label={opt.label}
                  selected={value === opt.value}
                  onPress={() => onChange(opt.value)}
                />
              ))}
              {errors.context ? (
                <AppText variant="caption" color="danger">
                  {errors.context.message}
                </AppText>
              ) : null}
            </View>
          )}
        />
      </FormSection>

      {/* UV Index */}
      <FormSection
        title="Índice UV si lo conoces"
        description="Es opcional. Si no lo sabes, Bronze IQ usará una recomendación más general."
      >
        <Controller
          name="uvIndexManualRaw"
          control={control}
          render={({ field: { onChange, value } }) => (
            <View style={styles.options}>
              {UV_OPTIONS.map((opt) => (
                <ProfileOptionCard
                  key={opt.value === '' ? 'none' : opt.value}
                  label={opt.label}
                  selected={value === opt.value}
                  onPress={() => onChange(opt.value)}
                />
              ))}
            </View>
          )}
        />
      </FormSection>

      {/* Protection */}
      <FormSection
        title="Protección usada"
        description="Este dato ayuda a interpretar tu sesión, pero no convierte la exposición en segura."
      >
        <Controller
          name="protectionLevel"
          control={control}
          render={({ field: { onChange, value } }) => (
            <View style={styles.options}>
              {PROTECTION_OPTIONS.map((opt) => (
                <ProfileOptionCard
                  key={opt.value}
                  label={opt.label}
                  selected={value === opt.value}
                  onPress={() => onChange(opt.value)}
                />
              ))}
              {errors.protectionLevel ? (
                <AppText variant="caption" color="danger">
                  {errors.protectionLevel.message}
                </AppText>
              ) : null}
            </View>
          )}
        />
      </FormSection>

      {/* Sensation */}
      <FormSection title="Sensación posterior">
        <Controller
          name="sensationAfter"
          control={control}
          render={({ field: { onChange, value } }) => (
            <View style={styles.options}>
              {SENSATION_OPTIONS.map((opt) => (
                <ProfileOptionCard
                  key={opt.value}
                  label={opt.label}
                  selected={value === opt.value}
                  onPress={() => onChange(opt.value)}
                />
              ))}
              {errors.sensationAfter ? (
                <AppText variant="caption" color="danger">
                  {errors.sensationAfter.message}
                </AppText>
              ) : null}
            </View>
          )}
        />
      </FormSection>

      {/* Notes */}
      <FormSection title="Notas opcionales">
        <Controller
          name="notes"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Notas opcionales"
              placeholder="Ej. hora del día, sensación, zona, protección, descanso…"
              multiline
              numberOfLines={3}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.notes?.message}
              style={styles.notesInput}
            />
          )}
        />
      </FormSection>

      <DisclaimerBox compact />

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          label="Guardar sesión"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          onPress={() => void handleSubmit(onSubmit)()}
          accessibilityLabel="Guardar sesión de exposición"
        />
        <Button
          label="Cancelar"
          variant="ghost"
          size="md"
          fullWidth
          disabled={isSubmitting}
          onPress={onCancel}
          accessibilityLabel="Cancelar registro de sesión"
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  options: {
    gap: spacing.sm,
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
})
