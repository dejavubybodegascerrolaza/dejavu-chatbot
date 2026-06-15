import { computeLiveSessionState } from './live.engine'

describe('computeLiveSessionState', () => {
  it('reports no risk when UV index is 0', () => {
    const state = computeLiveSessionState({ elapsedSeconds: 600, skinType: 3, uvIndex: 0 })
    expect(state.status).toBe('no_risk')
    expect(state.safeMinutes).toBeNull()
    expect(state.remainingSafeSeconds).toBeNull()
    expect(state.progress).toBe(0)
  })

  it('is safe well before the safe limit', () => {
    // type II MED 250, UV 5 → safe 20 min; at 5 min → safe
    const state = computeLiveSessionState({ elapsedSeconds: 5 * 60, skinType: 2, uvIndex: 5 })
    expect(state.status).toBe('safe')
    expect(state.safeMinutes).toBe(20)
    expect(state.remainingSafeSeconds).toBe(15 * 60)
    expect(state.progress).toBeCloseTo(0.25, 2)
  })

  it('moves to caution once the safe limit is reached', () => {
    const state = computeLiveSessionState({ elapsedSeconds: 21 * 60, skinType: 2, uvIndex: 5 })
    expect(state.status).toBe('caution')
    expect(state.remainingSafeSeconds).toBe(0)
    expect(state.progress).toBe(1)
  })

  it('moves to danger at the burn threshold', () => {
    // burn threshold 33 min for type II at UV 5
    const state = computeLiveSessionState({ elapsedSeconds: 34 * 60, skinType: 2, uvIndex: 5 })
    expect(state.status).toBe('danger')
  })

  it('extends the safe time with SPF', () => {
    const bare = computeLiveSessionState({ elapsedSeconds: 25 * 60, skinType: 2, uvIndex: 5 })
    const withSpf = computeLiveSessionState({
      elapsedSeconds: 25 * 60,
      skinType: 2,
      uvIndex: 5,
      spf: 30,
    })
    expect(bare.status).toBe('caution')
    expect(withSpf.status).toBe('safe')
  })

  it('counts flip intervals', () => {
    const state = computeLiveSessionState({
      elapsedSeconds: 32 * 60,
      skinType: 4,
      uvIndex: 6,
      flipIntervalMinutes: 15,
    })
    expect(state.flipCount).toBe(2)
  })

  it('clamps negative elapsed time to zero', () => {
    const state = computeLiveSessionState({ elapsedSeconds: -10, skinType: 3, uvIndex: 6 })
    expect(state.elapsedSeconds).toBe(0)
    expect(state.status).toBe('safe')
  })
})
