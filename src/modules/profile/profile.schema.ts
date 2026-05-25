import { z } from 'zod'

export const mainGoalSchema = z.enum([
  'gradual_bronze',
  'avoid_overexposure',
  'track_sessions',
  'conscious_routine',
])

export const sunSensitivitySchema = z.enum(['low', 'medium', 'high', 'very_high'])

export const skinTypeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
])

export const profileSchema = z.object({
  id: z.string().uuid(),
  alias: z
    .string()
    .trim()
    .min(2, 'El alias debe tener al menos 2 caracteres')
    .max(30, 'El alias no puede superar 30 caracteres'),
  mainGoal: mainGoalSchema,
  sunSensitivity: sunSensitivitySchema,
  skinType: skinTypeSchema.nullable(),
  onboardingCompleted: z.boolean(),
  disclaimerAcceptedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const profileSetupSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(2, 'El alias debe tener al menos 2 caracteres')
    .max(30, 'El alias no puede superar 30 caracteres'),
  mainGoal: mainGoalSchema,
  sunSensitivity: sunSensitivitySchema,
  skinType: skinTypeSchema.nullable().optional(),
  disclaimerAcceptedAt: z
    .string()
    .datetime({ message: 'Debes aceptar el disclaimer para continuar' }),
})

export const profileUpdateSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(2, 'El alias debe tener al menos 2 caracteres')
    .max(30, 'El alias no puede superar 30 caracteres')
    .optional(),
  mainGoal: mainGoalSchema.optional(),
  sunSensitivity: sunSensitivitySchema.optional(),
  skinType: skinTypeSchema.nullable().optional(),
})

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
