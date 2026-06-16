import {
  buildLiveSessionPrefill,
  parseSessionLogPrefillParams,
  toSessionLogPrefillParams,
} from './session.prefill'

// ── buildLiveSessionPrefill ─────────────────────────────────────────────────────

describe('buildLiveSessionPrefill', () => {
  it('maps elapsed seconds to rounded duration minutes', () => {
    expect(buildLiveSessionPrefill({ elapsedSeconds: 2700, spf: 1 }).durationMinutes).toBe(45)
  })

  it('rounds to the nearest minute', () => {
    // 90s → 1.5 → 2 ; 89s → 1.48 → 1
    expect(buildLiveSessionPrefill({ elapsedSeconds: 90, spf: 1 }).durationMinutes).toBe(2)
    expect(buildLiveSessionPrefill({ elapsedSeconds: 89, spf: 1 }).durationMinutes).toBe(1)
  })

  it('omits duration for very short, likely-accidental sessions', () => {
    // 20s → rounds to 0 → omitted so the user fills it in
    expect(buildLiveSessionPrefill({ elapsedSeconds: 20, spf: 1 }).durationMinutes).toBeUndefined()
  })

  it('omits duration when elapsed is zero', () => {
    expect(buildLiveSessionPrefill({ elapsedSeconds: 0, spf: 30 }).durationMinutes).toBeUndefined()
  })

  it('clamps very long sessions to the form maximum (300)', () => {
    expect(buildLiveSessionPrefill({ elapsedSeconds: 30000, spf: 1 }).durationMinutes).toBe(300)
  })

  it('treats negative elapsed seconds as zero', () => {
    expect(
      buildLiveSessionPrefill({ elapsedSeconds: -100, spf: 1 }).durationMinutes
    ).toBeUndefined()
  })

  it('maps SPF 1 to no protection', () => {
    expect(buildLiveSessionPrefill({ elapsedSeconds: 600, spf: 1 }).protectionLevel).toBe('none')
  })

  it('maps SPF 30 to medium protection', () => {
    expect(buildLiveSessionPrefill({ elapsedSeconds: 600, spf: 30 }).protectionLevel).toBe('medium')
  })

  it('maps SPF 50 to high protection', () => {
    expect(buildLiveSessionPrefill({ elapsedSeconds: 600, spf: 50 }).protectionLevel).toBe('high')
  })

  it('never includes skin response or subjective fields', () => {
    const prefill = buildLiveSessionPrefill({ elapsedSeconds: 1800, spf: 30 })
    expect(Object.keys(prefill).sort()).toEqual(['durationMinutes', 'protectionLevel'])
    expect(prefill).not.toHaveProperty('sensationAfter')
    expect(prefill).not.toHaveProperty('notes')
    expect(prefill).not.toHaveProperty('context')
  })
})

// ── parseSessionLogPrefillParams ────────────────────────────────────────────────

describe('parseSessionLogPrefillParams', () => {
  it('parses valid duration and protection params', () => {
    const result = parseSessionLogPrefillParams({
      durationMinutes: '45',
      protectionLevel: 'medium',
    })
    expect(result).toEqual({ durationMinutes: 45, protectionLevel: 'medium' })
  })

  it('returns an empty object for empty params', () => {
    expect(parseSessionLogPrefillParams({})).toEqual({})
  })

  it('ignores non-numeric duration', () => {
    expect(parseSessionLogPrefillParams({ durationMinutes: 'abc' })).toEqual({})
  })

  it('ignores out-of-range duration', () => {
    expect(parseSessionLogPrefillParams({ durationMinutes: '0' })).toEqual({})
    expect(parseSessionLogPrefillParams({ durationMinutes: '500' })).toEqual({})
    expect(parseSessionLogPrefillParams({ durationMinutes: '-5' })).toEqual({})
  })

  it('ignores an invalid protection level', () => {
    expect(parseSessionLogPrefillParams({ protectionLevel: 'bogus' })).toEqual({})
  })

  it('accepts each valid protection level', () => {
    for (const level of ['unknown', 'high', 'medium', 'none', 'not_sure'] as const) {
      expect(parseSessionLogPrefillParams({ protectionLevel: level }).protectionLevel).toBe(level)
    }
  })

  it('handles array-valued params by taking the first entry', () => {
    const result = parseSessionLogPrefillParams({
      durationMinutes: ['30', '99'],
      protectionLevel: ['high'],
    })
    expect(result).toEqual({ durationMinutes: 30, protectionLevel: 'high' })
  })

  it('never produces skin-response fields even from injected params', () => {
    const result = parseSessionLogPrefillParams({
      durationMinutes: '20',
      sensationAfter: 'burned',
      notes: 'algo',
    } as Record<string, string>)
    expect(result).not.toHaveProperty('sensationAfter')
    expect(result).not.toHaveProperty('notes')
  })
})

// ── round-trip ──────────────────────────────────────────────────────────────────

describe('toSessionLogPrefillParams round-trip', () => {
  it('serializes and re-parses to the same prefill', () => {
    const prefill = buildLiveSessionPrefill({ elapsedSeconds: 2700, spf: 50 })
    const params = toSessionLogPrefillParams(prefill)
    expect(parseSessionLogPrefillParams(params)).toEqual(prefill)
  })

  it('omits absent fields rather than serializing undefined', () => {
    const params = toSessionLogPrefillParams({ protectionLevel: 'none' })
    expect(params).toEqual({ protectionLevel: 'none' })
    expect(params).not.toHaveProperty('durationMinutes')
  })
})
