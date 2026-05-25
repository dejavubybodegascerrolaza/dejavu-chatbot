import { createExposureSessionSchema } from './session.schema'

const valid = {
  sessionDate: '2026-05-25',
  durationMinutes: 45,
  context: 'beach',
  uvIndexManual: 6,
  protectionLevel: 'medium',
  sensationAfter: 'normal',
  notes: null,
}

describe('createExposureSessionSchema', () => {
  it('acepta entrada válida', () => {
    expect(createExposureSessionSchema.safeParse(valid).success).toBe(true)
  })

  it('acepta uvIndexManual null', () => {
    expect(createExposureSessionSchema.safeParse({ ...valid, uvIndexManual: null }).success).toBe(
      true
    )
  })

  it('acepta notes null', () => {
    expect(createExposureSessionSchema.safeParse({ ...valid, notes: null }).success).toBe(true)
  })

  it('rechaza duration 0', () => {
    expect(createExposureSessionSchema.safeParse({ ...valid, durationMinutes: 0 }).success).toBe(
      false
    )
  })

  it('rechaza duration 301', () => {
    expect(createExposureSessionSchema.safeParse({ ...valid, durationMinutes: 301 }).success).toBe(
      false
    )
  })

  it('rechaza uvIndex 12', () => {
    expect(createExposureSessionSchema.safeParse({ ...valid, uvIndexManual: 12 }).success).toBe(
      false
    )
  })

  it('rechaza uvIndex -1', () => {
    expect(createExposureSessionSchema.safeParse({ ...valid, uvIndexManual: -1 }).success).toBe(
      false
    )
  })

  it('rechaza notes > 500 caracteres', () => {
    expect(
      createExposureSessionSchema.safeParse({ ...valid, notes: 'x'.repeat(501) }).success
    ).toBe(false)
  })

  it('acepta notes de exactamente 500 caracteres', () => {
    expect(
      createExposureSessionSchema.safeParse({ ...valid, notes: 'x'.repeat(500) }).success
    ).toBe(true)
  })

  it('rechaza context inválido', () => {
    expect(createExposureSessionSchema.safeParse({ ...valid, context: 'mountain' }).success).toBe(
      false
    )
  })

  it('rechaza sensationAfter inválido', () => {
    expect(
      createExposureSessionSchema.safeParse({ ...valid, sensationAfter: 'fine' }).success
    ).toBe(false)
  })

  it('rechaza sessionDate con formato incorrecto', () => {
    expect(
      createExposureSessionSchema.safeParse({ ...valid, sessionDate: '25/05/2026' }).success
    ).toBe(false)
  })
})
