import { z } from 'zod'

export const dataDeletionRequestStatusSchema = z.enum(['pending', 'processed'])

export const dataDeletionRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  requestedAt: z.string().datetime(),
  status: dataDeletionRequestStatusSchema,
  processedAt: z.string().datetime().nullable(),
})

export const createDataDeletionRequestSchema = z.object({})

export type CreateDataDeletionRequestInput = z.infer<typeof createDataDeletionRequestSchema>
