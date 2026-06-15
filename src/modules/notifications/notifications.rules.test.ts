import { buildNotificationSpecs } from './notifications.rules'
import type { NotificationPreferences, ScheduleInput } from './notifications.types'
import type { UvPeakWindow } from '../uv/uv.types'

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
