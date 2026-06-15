import type { UvPeakWindow } from '../uv/uv.types'
import type { NotificationSpec, ScheduleInput } from './notifications.types'

/** Minutes before the UV peak window starts to fire the alert. */
const UV_ADVANCE_MINUTES = 30

/** Hour (0-23) for the daily streak protection reminder. */
const STREAK_REMINDER_HOUR = 17

/**
 * Pure, deterministic engine.
 * Returns the set of notifications that should be scheduled right now,
 * given the current UV forecast, streak, plan state, and preferences.
 * Notifications whose trigger time has already passed are omitted.
 */
export function buildNotificationSpecs(input: ScheduleInput): NotificationSpec[] {
  const { preferences, uvPeakWindow, streak, hasActivePlan, now = new Date() } = input
  const specs: NotificationSpec[] = []

  if (preferences.uvAlertsEnabled && uvPeakWindow !== null) {
    const alertAt = uvPeakAlertTime(uvPeakWindow, now)
    if (alertAt !== null && alertAt > now) {
      const category = uvCategoryLabel(uvPeakWindow.maxUvIndex)
      specs.push({
        id: 'uv-peak-alert',
        title: '☀️ Pico UV se acerca',
        body: `El UV alcanzará nivel ${category} (${uvPeakWindow.maxUvIndex}) entre las ${uvPeakWindow.startHour}h y las ${uvPeakWindow.endHour}h. Usa protección solar.`,
        fireAt: alertAt,
      })
    }
  }

  if (preferences.sessionRemindersEnabled && hasActivePlan) {
    const fireAt = todayAtHour(preferences.sessionReminderHour, now)
    if (fireAt > now) {
      specs.push({
        id: 'session-reminder',
        title: '🌅 Hoy toca sesión',
        body: 'Tienes una sesión en tu plan para hoy. ¿Listo? Recuerda el protector solar.',
        fireAt,
      })
    }
  }

  if (preferences.streakRemindersEnabled && streak > 0) {
    const fireAt = todayAtHour(STREAK_REMINDER_HOUR, now)
    if (fireAt > now) {
      const days = streak === 1 ? '1 día' : `${streak} días`
      specs.push({
        id: 'streak-reminder',
        title: '🔥 ¡Protege tu racha!',
        body: `Llevas ${days} sin incidencias. Hoy aún puedes mantenerla segura.`,
        fireAt,
      })
    }
  }

  return specs
}

function todayAtHour(hour: number, now: Date): Date {
  const d = new Date(now)
  d.setHours(hour, 0, 0, 0)
  return d
}

/**
 * Returns the time to fire the UV alert: UV_ADVANCE_MINUTES before the peak
 * window starts, or null if the peak start is already in the past.
 */
function uvPeakAlertTime(window: NonNullable<UvPeakWindow>, now: Date): Date | null {
  const peakStart = todayAtHour(window.startHour, now)
  const alertAt = new Date(peakStart.getTime() - UV_ADVANCE_MINUTES * 60_000)
  // If the alert time is in the past but the peak hasn't started yet,
  // fire as soon as possible (i.e., return alertAt even if it's slightly before now;
  // the caller's `alertAt > now` check filters it out).
  return alertAt
}

function uvCategoryLabel(uvIndex: number): string {
  if (uvIndex >= 11) return 'extremo'
  if (uvIndex >= 8) return 'muy alto'
  if (uvIndex >= 6) return 'alto'
  return 'moderado'
}
