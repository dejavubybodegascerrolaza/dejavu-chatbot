import type { UvPeakWindow } from '../uv/uv.types'
import type { RecoveryLevel } from '../recovery/recovery.types'
import type { FaceGuardLevel } from '../face-guard/face-guard.types'

export type NotificationPermission = 'unknown' | 'granted' | 'denied'

export type NotificationId =
  | 'uv-peak-alert'
  | 'session-reminder'
  | 'streak-reminder'
  | 'recovery-check-in'

export type NotificationSpec = {
  id: NotificationId
  title: string
  body: string
  /** When to fire the notification (absolute date). */
  fireAt: Date
}

export type NotificationPreferences = {
  uvAlertsEnabled: boolean
  sessionRemindersEnabled: boolean
  streakRemindersEnabled: boolean
  /** Hour (0–23) at which the daily session reminder fires. Default 10. */
  sessionReminderHour: number
}

export type ScheduleInput = {
  preferences: NotificationPreferences
  uvPeakWindow: UvPeakWindow
  /** Current safety streak (consecutive safe days). */
  streak: number
  /** Whether the user has an active tanning plan. */
  hasActivePlan: boolean
  /** Recovery level from recent sessions. Suppresses session reminder; fires recovery check-in instead. */
  recoveryLevel?: RecoveryLevel
  /** Face Guard level. When elevated or strong, adds a face protection note to the UV alert. */
  faceGuardLevel?: FaceGuardLevel
  /** Override current time for testability. Defaults to new Date(). */
  now?: Date
}
