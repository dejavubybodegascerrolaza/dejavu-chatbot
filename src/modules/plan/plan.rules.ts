import type { SkinType } from '../profile/profile.types'
import type { TanLevel } from './plan.types'

/** Tan levels ordered from lightest to deepest. */
export const TAN_LEVEL_ORDER: TanLevel[] = [
  'natural',
  'light_golden',
  'golden',
  'bronze',
  'deep_bronze',
]

/** Position of each named level on an abstract 0–100 shade scale. */
export const TAN_LEVEL_SHADE: Record<TanLevel, number> = {
  natural: 0,
  light_golden: 25,
  golden: 45,
  bronze: 65,
  deep_bronze: 85,
}

/**
 * Maximum shade each skin type can safely reach. Fair skin (type I) barely
 * tans; deeper skin tans more. The plan never recommends exceeding this.
 */
export const MAX_TAN_BY_SKIN_TYPE: Record<SkinType, number> = {
  1: 25,
  2: 40,
  3: 60,
  4: 80,
  5: 95,
  6: 100,
}

export const MAX_TAN_UNKNOWN = 50

/**
 * Fraction of the remaining gap to the ceiling that a single safe session
 * closes. Higher skin types tan faster.
 */
export const TAN_RATE_BY_SKIN_TYPE: Record<SkinType, number> = {
  1: 0.04,
  2: 0.06,
  3: 0.08,
  4: 0.1,
  5: 0.12,
  6: 0.14,
}

export const TAN_RATE_UNKNOWN = 0.07

export const DEFAULT_SESSIONS_PER_WEEK = 5
export const MIN_SESSIONS_PER_WEEK = 1
export const MAX_SESSIONS_PER_WEEK = 7

export const DEFAULT_TYPICAL_UV = 7

/**
 * Tanning approaches the ceiling asymptotically, so we treat 95% of the ceiling
 * as the practical maximum reachable shade.
 */
export const REACHABLE_CEILING_FRACTION = 0.95

/** Safety cap on plan length to bound the simulation. */
export const MAX_PLAN_DAYS = 180

export function tanLevelIndex(level: TanLevel): number {
  return TAN_LEVEL_ORDER.indexOf(level)
}

export function ceilingFor(skinType: SkinType | null): number {
  return skinType !== null ? MAX_TAN_BY_SKIN_TYPE[skinType] : MAX_TAN_UNKNOWN
}

export function tanRateFor(skinType: SkinType | null): number {
  return skinType !== null ? TAN_RATE_BY_SKIN_TYPE[skinType] : TAN_RATE_UNKNOWN
}

export function clampSessionsPerWeek(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_SESSIONS_PER_WEEK
  return Math.min(MAX_SESSIONS_PER_WEEK, Math.max(MIN_SESSIONS_PER_WEEK, Math.round(value)))
}

/**
 * Whether calendar day `d` (0-indexed) is a session day given N sessions/week.
 * Spreads N sessions evenly across each 7-day window, starting on day 0.
 */
export function isSessionDay(dayIndex: number, sessionsPerWeek: number): boolean {
  if (sessionsPerWeek >= MAX_SESSIONS_PER_WEEK) return true
  return (dayIndex * sessionsPerWeek) % 7 < sessionsPerWeek
}
