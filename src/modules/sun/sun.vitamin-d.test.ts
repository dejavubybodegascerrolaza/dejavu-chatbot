import { calculateVitaminD } from './sun.vitamin-d'

describe('calculateVitaminD', () => {
  it('returns zero when UV index is 0', () => {
    const result = calculateVitaminD({
      skinType: 3,
      uvIndex: 0,
      minutes: 30,
      exposure: 'arms_legs',
    })
    expect(result.estimatedIu).toBe(0)
    expect(result.saturated).toBe(false)
  })

  it('returns zero when minutes is 0', () => {
    const result = calculateVitaminD({
      skinType: 3,
      uvIndex: 6,
      minutes: 0,
      exposure: 'arms_legs',
    })
    expect(result.estimatedIu).toBe(0)
  })

  it('produces a plausible estimate for a typical exposure', () => {
    // type III, UV 6, 20 min, arms+legs (0.3): dose 180 → fraction 0.9
    // 20000 × 0.9 × 0.85 × 0.3 = 4590 IU
    const result = calculateVitaminD({
      skinType: 3,
      uvIndex: 6,
      minutes: 20,
      exposure: 'arms_legs',
    })
    expect(result.estimatedIu).toBe(4590)
    expect(result.saturated).toBe(false)
  })

  it('produces less vitamin D for darker skin at equal exposure', () => {
    const fair = calculateVitaminD({ skinType: 2, uvIndex: 6, minutes: 20, exposure: 'most_body' })
    const dark = calculateVitaminD({ skinType: 6, uvIndex: 6, minutes: 20, exposure: 'most_body' })
    expect(dark.estimatedIu).toBeLessThan(fair.estimatedIu)
  })

  it('produces more vitamin D with more body exposed', () => {
    const little = calculateVitaminD({
      skinType: 3,
      uvIndex: 6,
      minutes: 15,
      exposure: 'face_hands',
    })
    const lots = calculateVitaminD({
      skinType: 3,
      uvIndex: 6,
      minutes: 15,
      exposure: 'full_body',
    })
    expect(lots.estimatedIu).toBeGreaterThan(little.estimatedIu)
  })

  it('flags saturation once the dose plateau is reached', () => {
    const result = calculateVitaminD({
      skinType: 3,
      uvIndex: 8,
      minutes: 60,
      exposure: 'full_body',
    })
    expect(result.saturated).toBe(true)
  })

  it('falls back to a default skin factor when skin type is unknown', () => {
    const unknown = calculateVitaminD({
      skinType: null,
      uvIndex: 6,
      minutes: 20,
      exposure: 'arms_legs',
    })
    const typeThree = calculateVitaminD({
      skinType: 3,
      uvIndex: 6,
      minutes: 20,
      exposure: 'arms_legs',
    })
    expect(unknown.estimatedIu).toBe(typeThree.estimatedIu)
  })
})
