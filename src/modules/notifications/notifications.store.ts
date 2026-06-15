import { create } from 'zustand'
import type {
  NotificationPermission,
  NotificationPreferences,
  ScheduleInput,
} from './notifications.types'
import { buildNotificationSpecs } from './notifications.rules'
import * as NotificationService from './notifications.service'

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  uvAlertsEnabled: true,
  sessionRemindersEnabled: true,
  streakRemindersEnabled: true,
  sessionReminderHour: 10,
}

type NotificationStore = {
  permission: NotificationPermission
  preferences: NotificationPreferences
  /** Request OS permission. Updates permission in store. */
  requestPermission: () => Promise<void>
  /** Re-check permission without prompting (e.g. on app foreground). */
  refreshPermission: () => Promise<void>
  /**
   * Build specs from input + preferences and schedule them via the service.
   * No-ops if permission is not granted.
   */
  scheduleAll: (input: Omit<ScheduleInput, 'preferences'>) => Promise<void>
  setPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void
  cancelAll: () => Promise<void>
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  permission: 'unknown',
  preferences: DEFAULT_NOTIFICATION_PREFERENCES,

  requestPermission: async () => {
    const permission = await NotificationService.requestNotificationPermission()
    set({ permission })
  },

  refreshPermission: async () => {
    const permission = await NotificationService.getNotificationPermission()
    set({ permission })
  },

  scheduleAll: async (input) => {
    const { preferences, permission } = get()
    if (permission !== 'granted') return
    const specs = buildNotificationSpecs({ ...input, preferences })
    await NotificationService.scheduleNotifications(specs)
  },

  setPreference: (key, value) => {
    set((state) => ({ preferences: { ...state.preferences, [key]: value } }))
  },

  cancelAll: async () => {
    await NotificationService.cancelAllNotifications()
  },
}))
