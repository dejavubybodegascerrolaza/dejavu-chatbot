import { dataDeletionRequestSchema, dataDeletionRequestStatusSchema } from './privacy.schema'

describe('dataDeletionRequestStatusSchema', () => {
  it('acepta pending', () => {
    expect(dataDeletionRequestStatusSchema.safeParse('pending').success).toBe(true)
  })

  it('acepta processed', () => {
    expect(dataDeletionRequestStatusSchema.safeParse('processed').success).toBe(true)
  })

  it('rechaza status inválido', () => {
    expect(dataDeletionRequestStatusSchema.safeParse('cancelled').success).toBe(false)
    expect(dataDeletionRequestStatusSchema.safeParse('deleted').success).toBe(false)
    expect(dataDeletionRequestStatusSchema.safeParse('').success).toBe(false)
  })
})

describe('dataDeletionRequestSchema', () => {
  const valid = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    requestedAt: '2026-05-25T12:00:00.000Z',
    status: 'pending',
    processedAt: null,
  }

  it('acepta entrada válida', () => {
    expect(dataDeletionRequestSchema.safeParse(valid).success).toBe(true)
  })

  it('acepta processedAt datetime válido', () => {
    expect(
      dataDeletionRequestSchema.safeParse({
        ...valid,
        status: 'processed',
        processedAt: '2026-06-01T10:00:00.000Z',
      }).success
    ).toBe(true)
  })

  it('rechaza id que no es uuid', () => {
    expect(dataDeletionRequestSchema.safeParse({ ...valid, id: 'not-a-uuid' }).success).toBe(false)
  })

  it('rechaza status inválido', () => {
    expect(dataDeletionRequestSchema.safeParse({ ...valid, status: 'unknown' }).success).toBe(false)
  })
})
