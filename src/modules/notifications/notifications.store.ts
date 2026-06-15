import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
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

/** Maps a boolean preference key to the notification ID it controls. */
const PREF_TO_NOTIFICATION_ID: Partial<Record<keyof NotificationPreferences, string>> = {
  uvAlertsEnabled: 'uv-peak-alert',
  sessionRemindersEnabled: 'session-reminder',
  streakRemindersEnabled: 'streak-reminder',
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
  /**
   * Update a single preference. If a boolean channel is toggled off, immediately
   * cancels that channel's scheduled notification in the OS.
   */
  setPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void
  cancelAll: () => Promise<void>
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
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
        // When a boolean channel is disabled, immediately cancel its OS notification
        // so it doesn't fire after the user has turned it off.
        if (typeof value === 'boolean' && !value) {
          const notificationId = PREF_TO_NOTIFICATION_ID[key as keyof NotificationPreferences]
          if (notificationId !== undefined) {
            void NotificationService.cancelNotification(notificationId)
          }
        }
      },

      cancelAll: async () => {
        await NotificationService.cancelAllNotifications()
      },
    }),
    {
      name: 'bronze-iq-notification-prefs',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only preferences — permission must be refreshed from the OS on each launch.
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
)
