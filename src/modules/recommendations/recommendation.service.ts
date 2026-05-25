import {
  CONTEXT_FACTOR,
  DISCLAIMER,
  PROTECTION_FACTOR,
  SENSITIVITY_FACTOR,
  SKIN_TYPE_FACTOR,
  SKIN_TYPE_FACTOR_UNKNOWN,
  WEEKLY_LOAD_THRESHOLDS,
  getUvFactor,
} from './recommendation.rules'
import type {
  Recommendation,
  RecommendationInput,
  RecommendationLevel,
  RecommendationProfileInput,
  RecommendationSessionInput,
} from './recommendation.types'

// ── Level ordering ────────────────────────────────────────────────────────────

const LEVEL_ORDER: Record<RecommendationLevel, number> = {
  low: 0,
  moderate: 1,
  caution: 2,
  high_caution: 3,
  rest: 4,
}

function maxLevel(a: RecommendationLevel, b: RecommendationLevel): RecommendationLevel {
  return LEVEL_ORDER[a] >= LEVEL_ORDER[b] ? a : b
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function isWithinDays(sessionDate: string, days: number, now: Date): boolean {
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return sessionDate >= cutoffStr
}

// ── Exposure load ─────────────────────────────────────────────────────────────

export function calculateSessionExposureLoad(
  session: RecommendationSessionInput,
  profile: RecommendationProfileInput
): number {
  const uvFactor = getUvFactor(session.uvIndexManual)
  const sensitivityFactor = SENSITIVITY_FACTOR[profile.sunSensitivity]
  const skinTypeFactor =
    profile.skinType !== null ? SKIN_TYPE_FACTOR[profile.skinType] : SKIN_TYPE_FACTOR_UNKNOWN
  const contextFactor = CONTEXT_FACTOR[session.context]
  const protectionFactor = PROTECTION_FACTOR[session.protectionLevel]

  const load =
    session.durationMinutes *
    uvFactor *
    sensitivityFactor *
    skinTypeFactor *
    contextFactor *
    protectionFactor

  return Math.round(load * 10) / 10
}

export function calculateWeeklyExposureLoad(
  sessions: RecommendationSessionInput[],
  profile: RecommendationProfileInput
): number {
  let total = 0
  for (const session of sessions) {
    total += calculateSessionExposureLoad(session, profile)
  }
  return Math.round(total * 10) / 10
}

// ── Level from weekly load ────────────────────────────────────────────────────

function levelFromLoad(weeklyLoad: number): RecommendationLevel {
  const threshold = WEEKLY_LOAD_THRESHOLDS.find((t) => weeklyLoad <= t.max)
  return threshold?.level ?? 'rest'
}

// ── Output builders ───────────────────────────────────────────────────────────

function buildOutput(
  level: RecommendationLevel,
  reasons: string[],
  weeklyExposureLoad: number,
  uvOverride: boolean
): Recommendation {
  const base = LEVEL_COPY[level]
  const message =
    uvOverride && LEVEL_ORDER[level] === LEVEL_ORDER['high_caution']
      ? `Con un índice UV muy alto, evita las horas de mayor intensidad y prioriza protección y sombra. ${base.message}`
      : base.message

  return {
    level,
    title: base.title,
    message,
    reasons,
    ctaLabel: base.ctaLabel,
    disclaimer: DISCLAIMER,
    weeklyExposureLoad,
  }
}

// ── Copy ─────────────────────────────────────────────────────────────────────

const LEVEL_COPY: Record<
  RecommendationLevel,
  { title: string; message: string; ctaLabel: string }
> = {
  low: {
    title: 'Puedes empezar con prudencia',
    message:
      'No tienes una acumulación elevada en los últimos días. Si decides exponerte, hazlo de forma gradual, con protección adecuada y evitando excesos.',
    ctaLabel: 'Registrar sesión',
  },
  moderate: {
    title: 'Mantén un ritmo gradual',
    message:
      'Tu historial reciente muestra exposición moderada. Bronze IQ recomienda mantener sesiones cortas y observar cómo responde tu piel.',
    ctaLabel: 'Registrar exposición',
  },
  caution: {
    title: 'Hoy conviene ir con calma',
    message:
      'Has acumulado exposición reciente. Considera reducir duración, evitar horas intensas y escuchar cualquier señal de incomodidad.',
    ctaLabel: 'Ver historial',
  },
  high_caution: {
    title: 'Prudencia alta',
    message:
      'Tu acumulación reciente sugiere bajar el ritmo. Bronze IQ recomienda priorizar descanso, sombra y protección.',
    ctaLabel: 'Ver historial',
  },
  rest: {
    title: 'Mejor descansar de exposición directa',
    message:
      'Tu historial reciente sugiere que conviene evitar añadir más exposición directa por ahora.',
    ctaLabel: 'Revisar sesiones',
  },
}

const BURNED_COPY = {
  title: 'Mejor descansar de exposición directa',
  message:
    'Has registrado una señal clara de exceso. Bronze IQ recomienda evitar exposición directa y observar cómo evoluciona tu piel.',
  ctaLabel: 'Ver historial',
}

const SLIGHTLY_RED_COPY = {
  title: 'Hoy conviene ir con mucha calma',
  message:
    'Tu historial reciente muestra enrojecimiento. Es mejor reducir exposición directa y priorizar recuperación.',
  ctaLabel: 'Registrar evolución',
}

const WARM_TIGHT_COPY = {
  title: 'Revisa cómo respondió tu piel',
  message:
    'Has registrado una señal de incomodidad. Bronze IQ recomienda prudencia antes de añadir más exposición.',
  ctaLabel: 'Ver historial',
}

// ── Main function ─────────────────────────────────────────────────────────────

export function generateRecommendation(input: RecommendationInput): Recommendation {
  const { profile, sessionsLast7Days, today, now = new Date() } = input

  const weeklyLoad = calculateWeeklyExposureLoad(sessionsLast7Days, profile)

  // Regla 1 — burned in last 7 days (highest priority)
  const hasBurned = sessionsLast7Days.some((s) => s.sensationAfter === 'burned')
  if (hasBurned) {
    return {
      level: 'rest',
      title: BURNED_COPY.title,
      message: BURNED_COPY.message,
      reasons: ['burned_recently'],
      ctaLabel: BURNED_COPY.ctaLabel,
      disclaimer: DISCLAIMER,
      weeklyExposureLoad: weeklyLoad,
    }
  }

  // Regla 2 — slightly_red in last 48 hours
  const hasSlightlyRed = sessionsLast7Days.some(
    (s) => s.sensationAfter === 'slightly_red' && isWithinDays(s.sessionDate, 2, now)
  )
  if (hasSlightlyRed) {
    return {
      level: 'high_caution',
      title: SLIGHTLY_RED_COPY.title,
      message: SLIGHTLY_RED_COPY.message,
      reasons: ['slightly_red_recently'],
      ctaLabel: SLIGHTLY_RED_COPY.ctaLabel,
      disclaimer: DISCLAIMER,
      weeklyExposureLoad: weeklyLoad,
    }
  }

  // Regla 3 — warm_tight in last 48 hours
  const hasWarmTight = sessionsLast7Days.some(
    (s) => s.sensationAfter === 'warm_tight' && isWithinDays(s.sessionDate, 2, now)
  )
  if (hasWarmTight) {
    return {
      level: 'caution',
      title: WARM_TIGHT_COPY.title,
      message: WARM_TIGHT_COPY.message,
      reasons: ['warm_tight_recently'],
      ctaLabel: WARM_TIGHT_COPY.ctaLabel,
      disclaimer: DISCLAIMER,
      weeklyExposureLoad: weeklyLoad,
    }
  }

  // Load-based level
  let level = levelFromLoad(weeklyLoad)
  const reasons: string[] = [reasonFromLoad(weeklyLoad)]

  // Regla 4 — UV >= 8 today forces minimum high_caution
  const uvOverride =
    today?.uvIndexManual !== undefined && today.uvIndexManual !== null && today.uvIndexManual >= 8

  if (uvOverride) {
    level = maxLevel(level, 'high_caution')
    reasons.push('high_uv_today')
  }

  return buildOutput(level, reasons, weeklyLoad, uvOverride)
}

function reasonFromLoad(load: number): string {
  if (load <= 50) return 'low_weekly_load'
  if (load <= 110) return 'moderate_weekly_load'
  if (load <= 180) return 'caution_weekly_load'
  if (load <= 260) return 'high_weekly_load'
  return 'very_high_weekly_load'
}
