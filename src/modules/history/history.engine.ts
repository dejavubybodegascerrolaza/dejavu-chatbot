import { daysBetweenISODates } from '@/utils/date'
import { buildRecoveryStatus } from '../recovery/recovery.engine'
import { calculateSafetyStreak } from '../gamification/gamification.engine'
import type { ExposureSession, SensationAfter } from '../sessions/session.types'
import type {
  HistoryInsights,
  HistoryInsightsInput,
  HistoryMetrics,
  SafetyTrend,
} from './history.types'

const WINDOW_DAYS = 7

/** Non-positive skin responses — used only for counts/dates, not recovery rules. */
const NEGATIVE_RESPONSES: SensationAfter[] = ['warm_tight', 'slightly_red', 'burned']

/** Severity ordering, used to break "most common" ties conservatively. */
const SEVERITY: Record<SensationAfter, number> = {
  great: 0,
  normal: 1,
  warm_tight: 2,
  slightly_red: 3,
  burned: 4,
}

// ── Copy ────────────────────────────────────────────────────────────────────────

const TREND_COPY: Record<
  SafetyTrend,
  { title: string; explanation: string; cautionNote: string | null }
> = {
  insufficient_data: {
    title: 'Aún no hay tendencia',
    explanation:
      'Todavía necesitamos más sesiones para ver una tendencia. Estimación basada en sesiones registradas.',
    cautionNote: null,
  },
  stable: {
    title: 'Sin señales de sobreexposición',
    explanation:
      'Sin señales de sobreexposición registradas en los últimos 7 días. Buen registro: tus sesiones ayudan a ajustar el margen.',
    cautionNote: null,
  },
  caution: {
    title: 'Ve con calma',
    explanation:
      'Has registrado calor o tirantez recientemente; Bronze IQ ajustará el margen con prudencia.',
    cautionNote: 'Mantén las sesiones cortas y observa cómo responde tu piel.',
  },
  recovery_needed: {
    title: 'Prioriza la recuperación',
    explanation:
      'Has registrado rojez o sobreexposición recientemente; Bronze IQ prioriza la recuperación.',
    cautionNote: 'Evita la exposición directa hasta que la piel se recupere. No es consejo médico.',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isWithinWindow(sessionDate: string, today: string): boolean {
  const diff = daysBetweenISODates(sessionDate, today)
  return diff >= 0 && diff < WINDOW_DAYS
}

function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm
}

function mostCommonResponse(sessions: ExposureSession[]): SensationAfter | null {
  if (sessions.length === 0) return null
  const counts = new Map<SensationAfter, number>()
  for (const s of sessions) {
    counts.set(s.sensationAfter, (counts.get(s.sensationAfter) ?? 0) + 1)
  }
  let best: SensationAfter | null = null
  let bestCount = 0
  for (const [response, count] of counts) {
    if (
      count > bestCount ||
      (count === bestCount && best !== null && SEVERITY[response] > SEVERITY[best])
    ) {
      best = response
      bestCount = count
    }
  }
  return best
}

function lastNegativeDate(sessions: ExposureSession[]): string | null {
  let latest: string | null = null
  for (const s of sessions) {
    if (!NEGATIVE_RESPONSES.includes(s.sensationAfter)) continue
    if (latest === null || s.sessionDate > latest) latest = s.sessionDate
  }
  return latest
}

function deriveTrend(
  sessionsInWindow: number,
  recoveryLevel: ReturnType<typeof buildRecoveryStatus>['level']
): SafetyTrend {
  // Without recent sessions there is nothing to base a trend on.
  if (sessionsInWindow === 0) return 'insufficient_data'
  switch (recoveryLevel) {
    case 'avoid_direct_exposure':
    case 'recovery_recommended':
      return 'recovery_needed'
    case 'caution':
      return 'caution'
    case 'none':
    default:
      return 'stable'
  }
}

function buildReasons(metrics: HistoryMetrics): string[] {
  const reasons: string[] = []
  reasons.push(
    `${metrics.sessionsLoggedLast7Days} ${plural(
      metrics.sessionsLoggedLast7Days,
      'sesión',
      'sesiones'
    )} en los últimos 7 días`
  )
  if (metrics.burnFreeDays > 0) {
    reasons.push(
      `${metrics.burnFreeDays} ${plural(metrics.burnFreeDays, 'día', 'días')} sin señales de quemadura`
    )
  }
  if (metrics.recoverySignalsLast7Days > 0) {
    reasons.push(
      `${metrics.recoverySignalsLast7Days} ${plural(
        metrics.recoverySignalsLast7Days,
        'señal de molestia registrada',
        'señales de molestia registradas'
      )}`
    )
  }
  return reasons
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Derives conservative, non-medical insights from logged exposure sessions.
 *
 * Pure function — no side effects, safe to call in useMemo. Uses structured
 * session fields only (never free-text notes). The trend reuses the recovery
 * engine and the burn-free streak reuses the gamification engine, so recovery
 * rules are never duplicated here.
 */
export function buildHistoryInsights(input: HistoryInsightsInput): HistoryInsights {
  const { sessions, today } = input

  const inWindow = sessions.filter((s) => isWithinWindow(s.sessionDate, today))

  const metrics: HistoryMetrics = {
    sessionsLoggedLast7Days: inWindow.length,
    totalEstimatedMinutesLast7Days: inWindow.reduce((sum, s) => sum + s.durationMinutes, 0),
    burnFreeDays: calculateSafetyStreak(
      sessions.map((s) => ({
        sessionDate: s.sessionDate,
        sensationAfter: s.sensationAfter,
        context: s.context,
      })),
      today
    ),
    recoverySignalsLast7Days: inWindow.filter((s) => NEGATIVE_RESPONSES.includes(s.sensationAfter))
      .length,
    mostCommonSkinResponse: mostCommonResponse(inWindow),
    lastNegativeResponseDate: lastNegativeDate(sessions),
  }

  const recovery = buildRecoveryStatus({ recentSessions: sessions, today })
  const trend = deriveTrend(metrics.sessionsLoggedLast7Days, recovery.level)
  const copy = TREND_COPY[trend]

  return {
    trend,
    title: copy.title,
    explanation: copy.explanation,
    reasons: trend === 'insufficient_data' ? [] : buildReasons(metrics),
    metrics,
    cautionNote: copy.cautionNote,
  }
}
