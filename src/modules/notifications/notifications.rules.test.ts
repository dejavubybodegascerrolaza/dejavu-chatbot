import { buildNotificationSpecs } from './notifications.rules'
import type { NotificationPreferences, ScheduleInput } from './notifications.types'
import type { UvPeakWindow } from '../uv/uv.types'
import type { RecoveryLevel } from '../recovery/recovery.types'
import type { FaceGuardLevel } from '../face-guard/face-guard.types'

const ALL_ON: NotificationPreferences = {
  uvAlertsEnabled: true,
  sessionRemindersEnabled: true,
  streakRemindersEnabled: true,
  sessionReminderHour: 10,
}

const ALL_OFF: NotificationPreferences = {
  uvAlertsEnabled: false,
  sessionRemindersEnabled: false,
  streakRemindersEnabled: false,
  sessionReminderHour: 10,
}

// Current time: 07:30 today (before any scheduled hour)
const NOW = new Date('2026-06-15T07:30:00.000')

const PEAK: UvPeakWindow = { startHour: 11, endHour: 15, maxUvIndex: 9 }

function input(overrides: Partial<ScheduleInput> = {}): ScheduleInput {
  return {
    preferences: ALL_ON,
    uvPeakWindow: PEAK,
    streak: 5,
    hasActivePlan: true,
    now: NOW,
    ...overrides,
  }
}

describe('buildNotificationSpecs', () => {
  it('returns three specs when all conditions are met', () => {
    const specs = buildNotificationSpecs(input())
    expect(specs).toHaveLength(3)
    const ids = specs.map((s) => s.id)
    expect(ids).toContain('uv-peak-alert')
    expect(ids).toContain('session-reminder')
    expect(ids).toContain('streak-reminder')
  })

  it('schedules UV alert 30 min before peak start', () => {
    const specs = buildNotificationSpecs(input())
    const alert = specs.find((s) => s.id === 'uv-peak-alert')!
    // Peak starts at 11:00 → alert at 10:30
    expect(alert.fireAt.getHours()).toBe(10)
    expect(alert.fireAt.getMinutes()).toBe(30)
  })

  it('omits UV alert when peak is in the past', () => {
    // Now is 11:15 → alert would have been at 10:30 (past)
    const now = new Date('2026-06-15T11:15:00.000')
    const specs = buildNotificationSpecs(input({ now }))
    expect(specs.find((s) => s.id === 'uv-peak-alert')).toBeUndefined()
  })

  it('omits UV alert when there is no peak window', () => {
    const specs = buildNotificationSpecs(input({ uvPeakWindow: null }))
    expect(specs.find((s) => s.id === 'uv-peak-alert')).toBeUndefined()
  })

  it('omits UV alert when uvAlertsEnabled is false', () => {
    const specs = buildNotificationSpecs(
      input({ preferences: { ...ALL_ON, uvAlertsEnabled: false } })
    )
    expect(specs.find((s) => s.id === 'uv-peak-alert')).toBeUndefined()
  })

  it('schedules session reminder at the configured hour', () => {
    const specs = buildNotificationSpecs(
      input({ preferences: { ...ALL_ON, sessionReminderHour: 9 } })
    )
    const reminder = specs.find((s) => s.id === 'session-reminder')!
    expect(reminder.fireAt.getHours()).toBe(9)
    expect(reminder.fireAt.getMinutes()).toBe(0)
  })

  it('omits session reminder when the hour has passed', () => {
    const now = new Date('2026-06-15T10:01:00.000')
    const specs = buildNotificationSpecs(input({ now }))
    expect(specs.find((s) => s.id === 'session-reminder')).toBeUndefined()
  })

  it('omits session reminder when there is no plan', () => {
    const specs = buildNotificationSpecs(input({ hasActivePlan: false }))
    expect(specs.find((s) => s.id === 'session-reminder')).toBeUndefined()
  })

  it('omits session reminder when sessionRemindersEnabled is false', () => {
    const specs = buildNotificationSpecs(
      input({ preferences: { ...ALL_ON, sessionRemindersEnabled: false } })
    )
    expect(specs.find((s) => s.id === 'session-reminder')).toBeUndefined()
  })

  it('schedules streak reminder at 17:00', () => {
    const specs = buildNotificationSpecs(input())
    const reminder = specs.find((s) => s.id === 'streak-reminder')!
    expect(reminder.fireAt.getHours()).toBe(17)
    expect(reminder.fireAt.getMinutes()).toBe(0)
  })

  it('omits streak reminder when streak is 0', () => {
    const specs = buildNotificationSpecs(input({ streak: 0 }))
    expect(specs.find((s) => s.id === 'streak-reminder')).toBeUndefined()
  })

  it('omits streak reminder when streakRemindersEnabled is false', () => {
    const specs = buildNotificationSpecs(
      input({ preferences: { ...ALL_ON, streakRemindersEnabled: false } })
    )
    expect(specs.find((s) => s.id === 'streak-reminder')).toBeUndefined()
  })

  it('omits streak reminder when the hour has passed', () => {
    const now = new Date('2026-06-15T17:01:00.000')
    const specs = buildNotificationSpecs(input({ now }))
    expect(specs.find((s) => s.id === 'streak-reminder')).toBeUndefined()
  })

  it('returns empty array when all preferences are off', () => {
    const specs = buildNotificationSpecs(input({ preferences: ALL_OFF }))
    expect(specs).toHaveLength(0)
  })

  it('uses singular wording for streak of 1', () => {
    const specs = buildNotificationSpecs(input({ streak: 1 }))
    const reminder = specs.find((s) => s.id === 'streak-reminder')!
    expect(reminder.body).toContain('1 día')
  })

  it('uses plural wording for streak > 1', () => {
    const specs = buildNotificationSpecs(input({ streak: 3 }))
    const reminder = specs.find((s) => s.id === 'streak-reminder')!
    expect(reminder.body).toContain('3 días')
  })

  it('labels extreme UV index correctly', () => {
    const extremePeak: UvPeakWindow = { startHour: 12, endHour: 14, maxUvIndex: 11 }
    const specs = buildNotificationSpecs(input({ uvPeakWindow: extremePeak }))
    const alert = specs.find((s) => s.id === 'uv-peak-alert')!
    expect(alert.body).toContain('extremo')
  })

  it('labels very high UV index correctly', () => {
    const specs = buildNotificationSpecs(input({ uvPeakWindow: PEAK })) // maxUvIndex: 9
    const alert = specs.find((s) => s.id === 'uv-peak-alert')!
    expect(alert.body).toContain('muy alto')
  })
})

// ── Recovery awareness ────────────────────────────────────────────────────────

describe('buildNotificationSpecs — recovery', () => {
  it('suppresses session-reminder when recoveryLevel is recovery_recommended', () => {
    const specs = buildNotificationSpecs(
      input({ recoveryLevel: 'recovery_recommended', hasActivePlan: true })
    )
    expect(specs.find((s) => s.id === 'session-reminder')).toBeUndefined()
  })

  it('suppresses session-reminder when recoveryLevel is avoid_direct_exposure', () => {
    const specs = buildNotificationSpecs(
      input({ recoveryLevel: 'avoid_direct_exposure', hasActivePlan: true })
    )
    expect(specs.find((s) => s.id === 'session-reminder')).toBeUndefined()
  })

  it('fires recovery-check-in when recoveryLevel is recovery_recommended', () => {
    const specs = buildNotificationSpecs(input({ recoveryLevel: 'recovery_recommended' }))
    expect(specs.find((s) => s.id === 'recovery-check-in')).toBeDefined()
  })

  it('fires recovery-check-in when recoveryLevel is avoid_direct_exposure', () => {
    const specs = buildNotificationSpecs(input({ recoveryLevel: 'avoid_direct_exposure' }))
    expect(specs.find((s) => s.id === 'recovery-check-in')).toBeDefined()
  })

  it('recovery-check-in fires at the same hour as the session reminder', () => {
    const specs = buildNotificationSpecs(
      input({
        recoveryLevel: 'recovery_recommended',
        preferences: { ...ALL_ON, sessionReminderHour: 9 },
      })
    )
    const checkIn = specs.find((s) => s.id === 'recovery-check-in')!
    expect(checkIn.fireAt.getHours()).toBe(9)
    expect(checkIn.fireAt.getMinutes()).toBe(0)
  })

  it('recovery-check-in is suppressed when sessionRemindersEnabled is false', () => {
    const specs = buildNotificationSpecs(
      input({
        recoveryLevel: 'recovery_recommended',
        preferences: { ...ALL_ON, sessionRemindersEnabled: false },
      })
    )
    expect(specs.find((s) => s.id === 'recovery-check-in')).toBeUndefined()
  })

  it('recovery-check-in is suppressed when its scheduled hour has passed', () => {
    const lateNow = new Date('2026-06-15T10:01:00.000')
    const specs = buildNotificationSpecs(
      input({ recoveryLevel: 'recovery_recommended', now: lateNow })
    )
    expect(specs.find((s) => s.id === 'recovery-check-in')).toBeUndefined()
  })

  it('session-reminder fires normally when recoveryLevel is caution', () => {
    const specs = buildNotificationSpecs(input({ recoveryLevel: 'caution', hasActivePlan: true }))
    expect(specs.find((s) => s.id === 'session-reminder')).toBeDefined()
    expect(specs.find((s) => s.id === 'recovery-check-in')).toBeUndefined()
  })

  it('session-reminder fires normally when recoveryLevel is none', () => {
    const specs = buildNotificationSpecs(input({ recoveryLevel: 'none', hasActivePlan: true }))
    expect(specs.find((s) => s.id === 'session-reminder')).toBeDefined()
    expect(specs.find((s) => s.id === 'recovery-check-in')).toBeUndefined()
  })

  it('session-reminder fires normally when recoveryLevel is undefined', () => {
    const specs = buildNotificationSpecs(input({ hasActivePlan: true }))
    expect(specs.find((s) => s.id === 'session-reminder')).toBeDefined()
    expect(specs.find((s) => s.id === 'recovery-check-in')).toBeUndefined()
  })

  it('recovery-check-in does not fire when recoveryLevel is caution', () => {
    const specs = buildNotificationSpecs(input({ recoveryLevel: 'caution' }))
    expect(specs.find((s) => s.id === 'recovery-check-in')).toBeUndefined()
  })
})

// ── Face guard ────────────────────────────────────────────────────────────────

describe('buildNotificationSpecs — face guard', () => {
  it('adds face note to UV alert when faceGuardLevel is elevated', () => {
    const specs = buildNotificationSpecs(input({ faceGuardLevel: 'elevated' }))
    const alert = specs.find((s) => s.id === 'uv-peak-alert')!
    expect(alert.body).toContain('rostro')
  })

  it('adds face note to UV alert when faceGuardLevel is strong', () => {
    const specs = buildNotificationSpecs(input({ faceGuardLevel: 'strong' }))
    const alert = specs.find((s) => s.id === 'uv-peak-alert')!
    expect(alert.body).toContain('rostro')
  })

  it('no face note when faceGuardLevel is standard', () => {
    const specs = buildNotificationSpecs(input({ faceGuardLevel: 'standard' }))
    const alert = specs.find((s) => s.id === 'uv-peak-alert')!
    expect(alert.body).not.toContain('rostro')
  })

  it('no face note when faceGuardLevel is undefined', () => {
    const specs = buildNotificationSpecs(input())
    const alert = specs.find((s) => s.id === 'uv-peak-alert')!
    expect(alert.body).not.toContain('rostro')
  })
})

// ── Copy safety ───────────────────────────────────────────────────────────────

describe('buildNotificationSpecs — copy safety', () => {
  const forbidden = [
    /sin riesgo/i,
    /garantiz/i,
    /diagnos/i,
    /tiempo seguro/i,
    /dosis segura/i,
    /riesgo de c[aá]ncer/i,
    /previene c[aá]ncer/i,
    /piel segura/i,
    /bronceado seguro/i,
    /sin quemarse/i,
  ]

  const scenarios: Partial<ScheduleInput>[] = [
    {},
    { recoveryLevel: 'recovery_recommended' as RecoveryLevel },
    { recoveryLevel: 'avoid_direct_exposure' as RecoveryLevel },
    { faceGuardLevel: 'elevated' as FaceGuardLevel },
    { faceGuardLevel: 'strong' as FaceGuardLevel },
    { streak: 15 },
    {
      recoveryLevel: 'recovery_recommended' as RecoveryLevel,
      faceGuardLevel: 'strong' as FaceGuardLevel,
    },
  ]

  it('no notification copy contains forbidden phrases', () => {
    for (const overrides of scenarios) {
      const specs = buildNotificationSpecs(input(overrides))
      for (const spec of specs) {
        for (const re of forbidden) {
          expect(spec.title).not.toMatch(re)
          expect(spec.body).not.toMatch(re)
        }
      }
    }
  })
})
