import { profileSetupSchema, profileUpdateSchema, skinTypeSchema } from './profile.schema'

describe('profileSetupSchema', () => {
  const valid = {
    alias: 'Sol',
    mainGoal: 'gradual_bronze',
    sunSensitivity: 'medium',
    skinType: null,
    disclaimerAcceptedAt: '2026-05-25T12:00:00.000Z',
  }

  it('acepta entrada válida completa', () => {
    expect(profileSetupSchema.safeParse(valid).success).toBe(true)
  })

  it('acepta skinType null', () => {
    expect(profileSetupSchema.safeParse({ ...valid, skinType: null }).success).toBe(true)
  })

  it('acepta skinType 1-6', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(profileSetupSchema.safeParse({ ...valid, skinType: n }).success).toBe(true)
    }
  })

  it('rechaza alias demasiado corto', () => {
    expect(profileSetupSchema.safeParse({ ...valid, alias: 'A' }).success).toBe(false)
  })

  it('rechaza alias demasiado largo (>30)', () => {
    expect(profileSetupSchema.safeParse({ ...valid, alias: 'A'.repeat(31) }).success).toBe(false)
  })

  it('rechaza mainGoal inválido', () => {
    expect(profileSetupSchema.safeParse({ ...valid, mainGoal: 'tan_fast' }).success).toBe(false)
  })

  it('rechaza sunSensitivity inválida', () => {
    expect(profileSetupSchema.safeParse({ ...valid, sunSensitivity: 'extreme' }).success).toBe(
      false
    )
  })

  it('rechaza disclaimerAcceptedAt ausente', () => {
    expect(
      profileSetupSchema.safeParse({
        alias: valid.alias,
        mainGoal: valid.mainGoal,
        sunSensitivity: valid.sunSensitivity,
        skinType: valid.skinType,
      }).success
    ).toBe(false)
  })
})

describe('skinTypeSchema', () => {
  it('acepta valores 1-6', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(skinTypeSchema.safeParse(n).success).toBe(true)
    }
  })

  it('rechaza 0', () => {
    expect(skinTypeSchema.safeParse(0).success).toBe(false)
  })

  it('rechaza 7', () => {
    expect(skinTypeSchema.safeParse(7).success).toBe(false)
  })
})

describe('profileUpdateSchema', () => {
  it('acepta objeto vacío (todo opcional)', () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('rechaza alias corto incluso en update', () => {
    expect(profileUpdateSchema.safeParse({ alias: 'X' }).success).toBe(false)
  })
})
