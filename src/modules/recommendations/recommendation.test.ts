import {
  calculateSessionExposureLoad,
  calculateWeeklyExposureLoad,
  generateRecommendation,
} from './recommendation.service'
import type { RecommendationInput, RecommendationSessionInput } from './recommendation.types'

/** Words that must never appear in recommendation output. Kept here so the
 *  test fails if copy accidentally makes medical claims or safety guarantees. */
const FORBIDDEN_WORDS: string[] = [
  'seguro',
  'sin riesgo',
  'garantizado',
  'garantiza',
  'perfecto',
  'puedes tomar el sol sin problema',
]

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TODAY = '2026-05-25'
const YESTERDAY = '2026-05-24'
const FIVE_DAYS_AGO = '2026-05-20'
const NOW = new Date('2026-05-25T12:00:00Z')

const BASE_PROFILE: RecommendationInput['profile'] = {
  mainGoal: 'gradual_bronze',
  sunSensitivity: 'medium',
  skinType: 4,
}

function makeSession(
  overrides: Partial<RecommendationSessionInput> = {}
): RecommendationSessionInput {
  return {
    sessionDate: TODAY,
    durationMinutes: 30,
    context: 'urban',
    uvIndexManual: 5,
    protectionLevel: 'medium',
    sensationAfter: 'normal',
    ...overrides,
  }
}

function makeInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    profile: BASE_PROFILE,
    sessionsLast7Days: [],
    now: NOW,
    ...overrides,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function containsForbiddenWord(text: string): boolean {
  const lower = text.toLowerCase()
  return FORBIDDEN_WORDS.some((word: string) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower)
  })
}

function checkNoForbiddenLanguage(result: ReturnType<typeof generateRecommendation>): void {
  const fields = [result.title, result.message, result.ctaLabel, ...result.reasons]
  for (const field of fields) {
    expect(containsForbiddenWord(field)).toBe(false)
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateRecommendation', () => {
  it('1. sin sesiones recientes → low', () => {
    const result = generateRecommendation(makeInput())
    expect(result.level).toBe('low')
    expect(result.weeklyExposureLoad).toBe(0)
  })

  it('2. sesión corta baja carga → low', () => {
    const result = generateRecommendation(
      makeInput({ sessionsLast7Days: [makeSession({ durationMinutes: 20, uvIndexManual: 2 })] })
    )
    expect(result.level).toBe('low')
  })

  it('3. acumulación moderada → moderate', () => {
    // 3 × 25min × pool × UV5 × medium → load 30/session → total 90 (moderate: 51-110)
    const sessions = Array.from({ length: 3 }, () =>
      makeSession({ durationMinutes: 25, context: 'pool', uvIndexManual: 5 })
    )
    const result = generateRecommendation(makeInput({ sessionsLast7Days: sessions }))
    expect(result.level).toBe('moderate')
  })

  it('4. acumulación alta → caution', () => {
    // 5 × 30min × urban × UV7 × medium → load 31.2/session → total 156 (caution: 111-180)
    const sessions = Array.from({ length: 5 }, () =>
      makeSession({ durationMinutes: 30, context: 'urban', uvIndexManual: 7 })
    )
    const result = generateRecommendation(makeInput({ sessionsLast7Days: sessions }))
    expect(result.level).toBe('caution')
  })

  it('5. acumulación muy alta → high_caution', () => {
    // 4 × 40min × pool × UV7 × medium → load 62.4/session → total 249.6 (high_caution: 181-260)
    const sessions = Array.from({ length: 4 }, () =>
      makeSession({ durationMinutes: 40, context: 'pool', uvIndexManual: 7 })
    )
    const result = generateRecommendation(makeInput({ sessionsLast7Days: sessions }))
    expect(result.level).toBe('high_caution')
  })

  it('6. acumulación extrema → rest', () => {
    // 1 × 60min × beach × UV11 × none × very_high × skin1 → load 486 (rest: >260)
    const profile = { ...BASE_PROFILE, sunSensitivity: 'very_high' as const, skinType: 1 as const }
    const sessions = [
      makeSession({
        durationMinutes: 60,
        context: 'beach',
        uvIndexManual: 11,
        protectionLevel: 'none',
      }),
    ]
    const result = generateRecommendation(makeInput({ profile, sessionsLast7Days: sessions }))
    expect(result.level).toBe('rest')
  })

  it('7. quemadura en últimos 7 días → rest (prioridad máxima)', () => {
    const sessions = [makeSession({ sessionDate: FIVE_DAYS_AGO, sensationAfter: 'burned' })]
    const result = generateRecommendation(makeInput({ sessionsLast7Days: sessions }))
    expect(result.level).toBe('rest')
    expect(result.reasons).toContain('burned_recently')
  })

  it('8. enrojecimiento en últimas 48h → high_caution', () => {
    const sessions = [makeSession({ sessionDate: YESTERDAY, sensationAfter: 'slightly_red' })]
    const result = generateRecommendation(makeInput({ sessionsLast7Days: sessions }))
    expect(result.level).toBe('high_caution')
    expect(result.reasons).toContain('slightly_red_recently')
  })

  it('9. piel caliente/tirante en últimas 48h → caution', () => {
    const sessions = [makeSession({ sessionDate: YESTERDAY, sensationAfter: 'warm_tight' })]
    const result = generateRecommendation(makeInput({ sessionsLast7Days: sessions }))
    expect(result.level).toBe('caution')
    expect(result.reasons).toContain('warm_tight_recently')
  })

  it('10. sensibilidad very_high aumenta carga respecto a medium', () => {
    const session = makeSession({ durationMinutes: 30, uvIndexManual: 5 })
    const loadMedium = calculateSessionExposureLoad(session, BASE_PROFILE)
    const profileVeryHigh = { ...BASE_PROFILE, sunSensitivity: 'very_high' as const }
    const loadVeryHigh = calculateSessionExposureLoad(session, profileVeryHigh)
    expect(loadVeryHigh).toBeGreaterThan(loadMedium)
  })

  it('11. fototipo I (piel muy clara) aumenta carga', () => {
    const session = makeSession({ durationMinutes: 30 })
    const loadType4 = calculateSessionExposureLoad(session, { ...BASE_PROFILE, skinType: 4 })
    const loadType1 = calculateSessionExposureLoad(session, { ...BASE_PROFILE, skinType: 1 })
    expect(loadType1).toBeGreaterThan(loadType4)
  })

  it('12. UV >= 8 fuerza mínimo high_caution', () => {
    const result = generateRecommendation(makeInput({ today: { uvIndexManual: 10 } }))
    expect(['high_caution', 'rest']).toContain(result.level)
    expect(result.reasons).toContain('high_uv_today')
  })

  it('13. protección none aumenta carga vs medium', () => {
    const session = makeSession({ durationMinutes: 30 })
    const loadMedium = calculateSessionExposureLoad(session, BASE_PROFILE)
    const loadNone = calculateSessionExposureLoad(
      { ...session, protectionLevel: 'none' },
      BASE_PROFILE
    )
    expect(loadNone).toBeGreaterThan(loadMedium)
  })

  it('14. protección high reduce carga vs medium', () => {
    const session = makeSession({ durationMinutes: 30 })
    const loadMedium = calculateSessionExposureLoad(session, BASE_PROFILE)
    const loadHigh = calculateSessionExposureLoad(
      { ...session, protectionLevel: 'high' },
      BASE_PROFILE
    )
    expect(loadHigh).toBeLessThan(loadMedium)
    // La recomendación sigue siendo prudente — no "garantiza" nada
    const result = generateRecommendation(
      makeInput({ sessionsLast7Days: [{ ...session, protectionLevel: 'high' }] })
    )
    expect(result.disclaimer).toContain('no garantiza')
  })

  it('15. notas no influyen en el cálculo (no están en el input del motor)', () => {
    // RecommendationSessionInput no tiene campo notes — esto es una garantía de tipos
    const session = makeSession()
    const keys = Object.keys(session)
    expect(keys).not.toContain('notes')
  })

  it('16. todos los outputs incluyen disclaimer', () => {
    const inputs: RecommendationInput[] = [
      makeInput(),
      makeInput({ sessionsLast7Days: [makeSession({ sensationAfter: 'burned' })] }),
      makeInput({
        sessionsLast7Days: [
          makeSession({ sessionDate: YESTERDAY, sensationAfter: 'slightly_red' }),
        ],
      }),
      makeInput({
        sessionsLast7Days: [makeSession({ sessionDate: YESTERDAY, sensationAfter: 'warm_tight' })],
      }),
      makeInput({ today: { uvIndexManual: 10 } }),
    ]
    for (const input of inputs) {
      const result = generateRecommendation(input)
      expect(result.disclaimer).toBeTruthy()
      expect(result.disclaimer.length).toBeGreaterThan(10)
    }
  })

  it('17. ningún output usa lenguaje prohibido en campos visibles', () => {
    const inputs: RecommendationInput[] = [
      makeInput(),
      makeInput({ sessionsLast7Days: [makeSession({ sensationAfter: 'burned' })] }),
      makeInput({
        sessionsLast7Days: [
          makeSession({ sessionDate: YESTERDAY, sensationAfter: 'slightly_red' }),
        ],
      }),
      makeInput({
        sessionsLast7Days: [makeSession({ sessionDate: YESTERDAY, sensationAfter: 'warm_tight' })],
      }),
      makeInput({ today: { uvIndexManual: 10 } }),
      makeInput({
        sessionsLast7Days: Array.from({ length: 5 }, () =>
          makeSession({ durationMinutes: 60, context: 'beach', uvIndexManual: 9 })
        ),
      }),
    ]
    for (const input of inputs) {
      checkNoForbiddenLanguage(generateRecommendation(input))
    }
  })

  it('18. quemadura tiene prioridad sobre UV alto y carga semanal', () => {
    const sessions = [
      makeSession({ sensationAfter: 'burned' }),
      makeSession({ durationMinutes: 200, context: 'beach', uvIndexManual: 11 }),
    ]
    const result = generateRecommendation(
      makeInput({ sessionsLast7Days: sessions, today: { uvIndexManual: 11 } })
    )
    expect(result.level).toBe('rest')
    expect(result.reasons).toContain('burned_recently')
  })

  it('19. enrojecimiento reciente tiene prioridad sobre carga semanal baja', () => {
    // Carga baja (sería low) pero hay slightly_red reciente
    const sessions = [
      makeSession({ sessionDate: TODAY, sensationAfter: 'slightly_red', durationMinutes: 5 }),
    ]
    const result = generateRecommendation(makeInput({ sessionsLast7Days: sessions }))
    expect(result.level).toBe('high_caution')
    expect(result.reasons).toContain('slightly_red_recently')
  })

  it('20. calculateSessionExposureLoad devuelve número estable y redondeado', () => {
    const load = calculateSessionExposureLoad(makeSession(), BASE_PROFILE)
    expect(typeof load).toBe('number')
    expect(isNaN(load)).toBe(false)
    // Máximo 1 decimal
    const decimals = load.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(1)
  })
})

describe('calculateWeeklyExposureLoad', () => {
  it('devuelve 0 para lista vacía', () => {
    expect(calculateWeeklyExposureLoad([], BASE_PROFILE)).toBe(0)
  })

  it('suma cargas individuales correctamente', () => {
    const session = makeSession()
    const single = calculateSessionExposureLoad(session, BASE_PROFILE)
    const weekly = calculateWeeklyExposureLoad([session, session], BASE_PROFILE)
    expect(weekly).toBeCloseTo(single * 2, 1)
  })
})

// ── CTA action intent ───────────────────────────────────────────────────────────

describe('generateRecommendation — ctaAction', () => {
  it('low load suggests registering a session', () => {
    const result = generateRecommendation(makeInput())
    expect(result.level).toBe('low')
    expect(result.ctaAction).toBe('register')
  })

  it('caution load points to reviewing history (not adding exposure)', () => {
    const sessions = Array.from({ length: 5 }, () =>
      makeSession({ durationMinutes: 30, context: 'urban', uvIndexManual: 7 })
    )
    const result = generateRecommendation(makeInput({ sessionsLast7Days: sessions }))
    expect(result.level).toBe('caution')
    expect(result.ctaAction).toBe('history')
  })

  it('burned recently points to history', () => {
    const result = generateRecommendation(
      makeInput({ sessionsLast7Days: [makeSession({ sensationAfter: 'burned' })] })
    )
    expect(result.ctaAction).toBe('history')
  })

  it('ctaAction is always register or history', () => {
    const sessions = Array.from({ length: 5 }, () =>
      makeSession({ durationMinutes: 30, context: 'urban', uvIndexManual: 7 })
    )
    const scenarios = [makeInput(), makeInput({ sessionsLast7Days: sessions })]
    for (const input of scenarios) {
      expect(['register', 'history']).toContain(generateRecommendation(input).ctaAction)
    }
  })
})
