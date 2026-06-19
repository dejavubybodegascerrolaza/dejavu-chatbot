import Constants from 'expo-constants'

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Primitive-only context bag for observability reports.
 * Objects and arrays are intentionally excluded — they can carry nested user data.
 */
export type ObservabilityContext = Record<string, string | number | boolean | null>

export type CaptureLevel = 'info' | 'warning' | 'error'

// ── Privacy safeguards ────────────────────────────────────────────────────────

/**
 * Context keys that must never appear in observability reports.
 * Any key in this set is silently stripped by sanitizeContext().
 *
 * Extend this list before adding any new context key that could carry user data.
 */
const BLOCKED_KEYS = new Set([
  // Identity
  'userId',
  'user_id',
  'email',
  // Auth secrets
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'password',
  'key',
  'serviceRole',
  'service_role',
  'anonKey',
  'anon_key',
  // Location
  'latitude',
  'longitude',
  'coordinates',
  // Health-like / sensitive user data
  'notes',
  'skinType',
  'skin_type',
  'sunSensitivity',
  'sun_sensitivity',
  'ageRange',
  'age_range',
  'blisteringSunburns',
  'blistering_sunburns',
  'tanningBedUse',
  'tanning_bed_use',
  'moleCount',
  'mole_count',
  'spf',
  // Data payloads
  'sessions',
  'profile',
  'plan',
])

/**
 * Removes any key that could carry sensitive user data.
 * Non-primitive values (objects, arrays) are always dropped —
 * they could contain nested sensitive fields.
 *
 * Call this before passing dynamic objects to captureError/captureMessage.
 */
export function sanitizeContext(raw: Record<string, unknown>): ObservabilityContext {
  const out: ObservabilityContext = {}
  for (const [key, value] of Object.entries(raw)) {
    if (BLOCKED_KEYS.has(key)) continue
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      out[key] = value
    }
    // Objects and arrays are dropped — their contents are unpredictable.
  }
  return out
}

// ── App context ───────────────────────────────────────────────────────────────

/**
 * Returns safe, non-sensitive app metadata to attach to reports.
 * Never includes user-identifying fields.
 */
export function getAppContext(): ObservabilityContext {
  return {
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    appEnv: process.env['EXPO_PUBLIC_APP_ENV'] ?? 'unknown',
  }
}

// ── Capture helpers ───────────────────────────────────────────────────────────

/**
 * Reports an unexpected error to the configured observability provider.
 *
 * Currently a no-op — plug in @sentry/react-native (or equivalent) here once
 * a DSN is available and the native Expo plugin is configured.
 *
 * Usage:
 *   captureError(err, { module: 'uv.repository', operation: 'fetchForecast', ...getAppContext() })
 *
 * DSN env var to add when integrating:  EXPO_PUBLIC_SENTRY_DSN
 *
 * Do NOT pass userId, email, coordinates, notes, or session payloads in context.
 * Use sanitizeContext() when context comes from a dynamic or external source.
 */
export function captureError(_error: unknown, _context?: ObservabilityContext): void {
  // Future Sentry integration point:
  //
  // if (__DEV__) {
  //   // eslint-disable-next-line no-console
  //   console.error('[observability] captureError', _error, _context)
  // }
  // Sentry.captureException(toError(_error), {
  //   contexts: { app: _context },
  // })
}

/**
 * Reports a diagnostic message to the configured observability provider.
 * No-op until a provider is configured.
 */
export function captureMessage(
  _message: string,
  _level: CaptureLevel = 'info',
  _context?: ObservabilityContext
): void {
  // Future integration point — see captureError above.
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Converts any thrown value to a proper Error object.
 * Useful in catch (e) handlers where e is typed as unknown.
 */
export function toError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown
  return new Error(typeof thrown === 'string' ? thrown : String(thrown))
}
