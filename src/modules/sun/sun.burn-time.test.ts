import { calculateBurnTime } from './sun.burn-time'

describe('calculateBurnTime', () => {
  it('returns null times when UV index is 0', () => {
    const result = calculateBurnTime({ skinType: 2, uvIndex: 0 })
    expect(result.minutesToBurn).toBeNull()
    expect(result.safeMinutes).toBeNull()
    expect(result.spf).toBe(1)
  })

  it('clamps negative UV index to no risk', () => {
    const result = calculateBurnTime({ skinType: 2, uvIndex: -3 })
    expect(result.minutesToBurn).toBeNull()
  })

  it('computes burn time from MED, UV index and dose rate', () => {
    // type II MED = 250 J/m²; UV 5 → 7.5 J/m²/min → 250 / 7.5 ≈ 33 min
    const result = calculateBurnTime({ skinType: 2, uvIndex: 5 })
    expect(result.minutesToBurn).toBe(33)
  })

  it('gives a higher burn time to darker skin types', () => {
    const fair = calculateBurnTime({ skinType: 1, uvIndex: 8 })
    const dark = calculateBurnTime({ skinType: 6, uvIndex: 8 })
    expect(dark.minutesToBurn).toBeGreaterThan(fair.minutesToBurn as number)
  })

  it('safe minutes are below the burn threshold', () => {
    const result = calculateBurnTime({ skinType: 3, uvIndex: 7 })
    expect(result.safeMinutes as number).toBeLessThan(result.minutesToBurn as number)
  })

  it('multiplies burn time by the SPF factor', () => {
    const bare = calculateBurnTime({ skinType: 3, uvIndex: 6 })
    const protectedSkin = calculateBurnTime({ skinType: 3, uvIndex: 6, spf: 30 })
    const ratio = (protectedSkin.minutesToBurn as number) / (bare.minutesToBurn as number)
    expect(ratio).toBeCloseTo(30, 0)
    expect(protectedSkin.spf).toBe(30)
  })

  it('treats invalid or sub-1 SPF as no protection', () => {
    const bare = calculateBurnTime({ skinType: 3, uvIndex: 6 })
    expect(calculateBurnTime({ skinType: 3, uvIndex: 6, spf: 0 }).minutesToBurn).toBe(
      bare.minutesToBurn
    )
    expect(calculateBurnTime({ skinType: 3, uvIndex: 6, spf: -5 }).spf).toBe(1)
  })

  it('uses a conservative MED when skin type is unknown', () => {
    const unknown = calculateBurnTime({ skinType: null, uvIndex: 6 })
    const typeTwo = calculateBurnTime({ skinType: 2, uvIndex: 6 })
    expect(unknown.minutesToBurn).toBe(typeTwo.minutesToBurn)
  })
})
