import { z } from 'zod'

export const exposureContextSchema = z.enum([
  'beach',
  'pool',
  'urban',
  'terrace_garden',
  'outdoor_sport',
  'other',
])

export const protectionLevelSchema = z.enum(['unknown', 'high', 'medium', 'none', 'not_sure'])

export const sensationAfterSchema = z.enum([
  'great',
  'normal',
  'warm_tight',
  'slightly_red',
  'burned',
])

export const exposureSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  durationMinutes: z
    .number()
    .int()
    .min(1, 'La duración mínima es 1 minuto')
    .max(300, 'La duración máxima es 300 minutos'),
  context: exposureContextSchema,
  uvIndexManual: z.number().int().min(0).max(11).nullable(),
  protectionLevel: protectionLevelSchema,
  sensationAfter: sensationAfterSchema,
  notes: z.string().max(500, 'Las notas no pueden superar 500 caracteres').nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const createExposureSessionSchema = z.object({
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  durationMinutes: z
    .number()
    .int()
    .min(1, 'La duración mínima es 1 minuto')
    .max(300, 'La duración máxima es 300 minutos'),
  context: exposureContextSchema,
  uvIndexManual: z.number().int().min(0).max(11).nullable(),
  protectionLevel: protectionLevelSchema,
  sensationAfter: sensationAfterSchema,
  notes: z.string().max(500, 'Las notas no pueden superar 500 caracteres').nullable(),
})

export type CreateExposureSessionInput = z.infer<typeof createExposureSessionSchema>
