import React from 'react'
import { ScrollView, StyleSheet, View, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Input } from '@/components/ui'
import { colors, spacing, radius } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useProfileStore } from '@/modules/profile/profile.store'
import {
  mainGoalSchema,
  sunSensitivitySchema,
  skinTypeSchema,
} from '@/modules/profile/profile.schema'
import {
  MAIN_GOAL_LABELS,
  SUN_SENSITIVITY_LABELS,
  SKIN_TYPE_LABELS,
} from '@/modules/profile/profile.labels'
import type { MainGoal, SunSensitivity, SkinType } from '@/modules/profile/profile.types'

const editProfileFormSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(2, 'El alias debe tener al menos 2 caracteres')
    .max(30, 'El alias no puede superar 30 caracteres'),
  mainGoal: mainGoalSchema,
  sunSensitivity: sunSensitivitySchema,
  skinType: skinTypeSchema.nullable(),
})

type EditProfileFormValues = z.infer<typeof editProfileFormSchema>

const MAIN_GOALS: MainGoal[] = [
  'gradual_bronze',
  'avoid_overexposure',
  'track_sessions',
  'conscious_routine',
]

const SUN_SENSITIVITIES: SunSensitivity[] = ['very_high', 'high', 'medium', 'low']
const SKIN_TYPES: (SkinType | null)[] = [null, 1, 2, 3, 4, 5, 6]

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionRow, selected && styles.optionRowSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]} />
      <AppText variant="body" color={selected ? 'brand' : 'textPrimary'}>
        {label}
      </AppText>
    </Pressable>
  )
}

export default function EditProfileScreen() {
  const user = useAuthStore((s) => s.user)
  const { profile, updateProfile, isSubmitting, error } = useProfileStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileFormSchema),
    defaultValues: {
      alias: profile?.alias ?? '',
      mainGoal: profile?.mainGoal ?? 'track_sessions',
      sunSensitivity: profile?.sunSensitivity ?? 'medium',
      skinType: profile?.skinType ?? null,
    },
  })

  const onSubmit = async (values: EditProfileFormValues) => {
    if (!user?.id) return
    await updateProfile(user.id, values)
    if (!error) {
      router.back()
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Alias */}
        <View style={styles.fieldGroup}>
          <AppText variant="label" color="textSecondary">
            Alias
          </AppText>
          <Controller
            control={control}
            name="alias"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Tu alias"
                autoCapitalize="none"
                error={errors.alias?.message}
              />
            )}
          />
        </View>

        {/* Main goal */}
        <View style={styles.fieldGroup}>
          <AppText variant="label" color="textSecondary">
            Objetivo principal
          </AppText>
          <Controller
            control={control}
            name="mainGoal"
            render={({ field: { onChange, value } }) => (
              <View style={styles.options}>
                {MAIN_GOALS.map((goal) => (
                  <OptionRow
                    key={goal}
                    label={MAIN_GOAL_LABELS[goal]}
                    selected={value === goal}
                    onPress={() => onChange(goal)}
                  />
                ))}
              </View>
            )}
          />
        </View>

        {/* Sun sensitivity */}
        <View style={styles.fieldGroup}>
          <AppText variant="label" color="textSecondary">
            Sensibilidad al sol
          </AppText>
          <Controller
            control={control}
            name="sunSensitivity"
            render={({ field: { onChange, value } }) => (
              <View style={styles.options}>
                {SUN_SENSITIVITIES.map((s) => (
                  <OptionRow
                    key={s}
                    label={SUN_SENSITIVITY_LABELS[s]}
                    selected={value === s}
                    onPress={() => onChange(s)}
                  />
                ))}
              </View>
            )}
          />
        </View>

        {/* Skin type */}
        <View style={styles.fieldGroup}>
          <AppText variant="label" color="textSecondary">
            Fototipo (opcional)
          </AppText>
          <Controller
            control={control}
            name="skinType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.options}>
                {SKIN_TYPES.map((st) => (
                  <OptionRow
                    key={st === null ? 'null' : String(st)}
                    label={st === null ? 'No indicado' : (SKIN_TYPE_LABELS[st] ?? String(st))}
                    selected={value === st}
                    onPress={() => onChange(st)}
                  />
                ))}
              </View>
            )}
          />
        </View>

        {error ? (
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Guardar cambios"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            accessibilityLabel="Guardar cambios en el perfil"
          />
          <Button
            label="Cancelar"
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.back()}
            accessibilityLabel="Cancelar edición"
          />
        </View>
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
  fieldGroup: {
    gap: spacing.sm,
  },
  options: {
    gap: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionRowSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioCircleSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  actions: {
    gap: spacing.sm,
  },
})
