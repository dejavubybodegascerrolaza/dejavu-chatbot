import { calculateBurnTime } from '../sun/sun.burn-time'
import { DEFAULT_FLIP_INTERVAL_MINUTES } from './live.rules'
import type { LiveSessionInput, LiveSessionState, LiveStatus } from './live.types'

/**
 * Pure state of a live tanning session at a given elapsed time. Drives the
 * real-time countdown and the safety/flip alerts. Holds no timer — the screen
 * ticks elapsed seconds and calls this each tick, so it stays fully testable.
 *
 * Safety first: the primary signal is reaching the conservative safe dose
 * ('caution'); 'danger' marks the sunburn threshold. Guidance, not a guarantee.
 */
export function computeLiveSessionState(input: LiveSessionInput): LiveSessionState {
  const elapsedSeconds = Math.max(0, Math.floor(input.elapsedSeconds))
  const elapsedMinutes = elapsedSeconds / 60
  const flipInterval = input.flipIntervalMinutes ?? DEFAULT_FLIP_INTERVAL_MINUTES
  const flipCount = flipInterval > 0 ? Math.floor(elapsedMinutes / flipInterval) : 0

  const { safeMinutes, minutesToBurn } = calculateBurnTime({
    skinType: input.skinType,
    uvIndex: input.uvIndex,
    ...(input.spf !== undefined ? { spf: input.spf } : {}),
  })

  // No UV (night/indoor): no erythemal risk, no countdown, no alerts.
  if (safeMinutes === null || minutesToBurn === null) {
    return {
      status: 'no_risk',
      elapsedSeconds,
      safeMinutes: null,
      burnMinutes: null,
      remainingSafeSeconds: null,
      progress: 0,
      flipCount,
    }
  }

  const remainingSafeSeconds = Math.max(0, Math.round(safeMinutes * 60 - elapsedSeconds))
  const progress = Math.min(elapsedMinutes / safeMinutes, 1)

  let status: LiveStatus = 'safe'
  if (elapsedMinutes >= minutesToBurn) {
    status = 'danger'
  } else if (elapsedMinutes >= safeMinutes) {
    status = 'caution'
  }

  return {
    status,
    elapsedSeconds,
    safeMinutes,
    burnMinutes: minutesToBurn,
    remainingSafeSeconds,
    progress,
    flipCount,
  }
}
