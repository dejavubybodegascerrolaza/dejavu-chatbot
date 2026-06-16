import {
  buildLiveSessionPrefill,
  parseSessionLogPrefillParams,
  toSessionLogPrefillParams,
  uvIndexToFormValue,
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

  it('omits UV when no uvIndex is provided', () => {
    expect(buildLiveSessionPrefill({ elapsedSeconds: 600, spf: 1 }).uvIndexManual).toBeUndefined()
  })

  it('omits UV when uvIndex is null', () => {
    expect(
      buildLiveSessionPrefill({ elapsedSeconds: 600, spf: 1, uvIndex: null }).uvIndexManual
    ).toBeUndefined()
  })

  it('omits UV for a negative (invalid) uvIndex', () => {
    expect(
      buildLiveSessionPrefill({ elapsedSeconds: 600, spf: 1, uvIndex: -3 }).uvIndexManual
    ).toBeUndefined()
  })

  it('buckets a known live UV index into the form value', () => {
    expect(buildLiveSessionPrefill({ elapsedSeconds: 600, spf: 1, uvIndex: 7 }).uvIndexManual).toBe(
      6
    )
  })

  it('includes uvIndexManual alongside duration and protection when UV is known', () => {
    const prefill = buildLiveSessionPrefill({ elapsedSeconds: 1800, spf: 30, uvIndex: 9 })
    expect(Object.keys(prefill).sort()).toEqual([
      'durationMinutes',
      'protectionLevel',
      'uvIndexManual',
    ])
  })
})

// ── uvIndexToFormValue ──────────────────────────────────────────────────────────

describe('uvIndexToFormValue', () => {
  it('maps low UV (0–2) to 1', () => {
    expect(uvIndexToFormValue(0)).toBe(1)
    expect(uvIndexToFormValue(2.9)).toBe(1)
  })

  it('maps moderate UV (3–5) to 4', () => {
    expect(uvIndexToFormValue(3)).toBe(4)
    expect(uvIndexToFormValue(5.9)).toBe(4)
  })

  it('maps high UV (6–7) to 6', () => {
    expect(uvIndexToFormValue(6)).toBe(6)
    expect(uvIndexToFormValue(7.9)).toBe(6)
  })

  it('maps very_high UV (8–10) to 9', () => {
    expect(uvIndexToFormValue(8)).toBe(9)
    expect(uvIndexToFormValue(10.9)).toBe(9)
  })

  it('maps extreme UV (11+) to 11', () => {
    expect(uvIndexToFormValue(11)).toBe(11)
    expect(uvIndexToFormValue(15)).toBe(11)
  })
})

// ── parseSessionLogPrefillParams ────────────────────────────────────────────────

describe('parseSessionLogPrefillParams', () => {
  it('parses valid duration, protection and UV params', () => {
    const result = parseSessionLogPrefillParams({
      durationMinutes: '45',
      protectionLevel: 'medium',
      uvIndexManual: '6',
    })
    expect(result).toEqual({ durationMinutes: 45, protectionLevel: 'medium', uvIndexManual: 6 })
  })

  it('accepts each valid UV form value', () => {
    for (const v of [1, 4, 6, 9, 11]) {
      expect(parseSessionLogPrefillParams({ uvIndexManual: String(v) }).uvIndexManual).toBe(v)
    }
  })

  it('ignores a UV value that is not a form bucket representative', () => {
    expect(parseSessionLogPrefillParams({ uvIndexManual: '7' }).uvIndexManual).toBeUndefined()
    expect(parseSessionLogPrefillParams({ uvIndexManual: '0' }).uvIndexManual).toBeUndefined()
  })

  it('ignores a non-numeric UV value', () => {
    expect(parseSessionLogPrefillParams({ uvIndexManual: 'abc' }).uvIndexManual).toBeUndefined()
  })

  it('ignores a missing UV value', () => {
    expect(parseSessionLogPrefillParams({ durationMinutes: '30' }).uvIndexManual).toBeUndefined()
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

  it('round-trips UV only when a valid live UV index is known', () => {
    const prefill = buildLiveSessionPrefill({ elapsedSeconds: 2700, spf: 50, uvIndex: 9 })
    const params = toSessionLogPrefillParams(prefill)
    expect(params.uvIndexManual).toBe('9')
    expect(parseSessionLogPrefillParams(params)).toEqual(prefill)
  })

  it('omits absent fields rather than serializing undefined', () => {
    const params = toSessionLogPrefillParams({ protectionLevel: 'none' })
    expect(params).toEqual({ protectionLevel: 'none' })
    expect(params).not.toHaveProperty('durationMinutes')
  })
})
