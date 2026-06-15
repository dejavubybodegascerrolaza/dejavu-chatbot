import * as ExpoNotifications from 'expo-notifications'
import type { NotificationPermission, NotificationSpec } from './notifications.types'

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function getNotificationPermission(): Promise<NotificationPermission> {
  const { status } = await ExpoNotifications.getPermissionsAsync()
  if (status === 'granted') return 'granted'
  if (status === 'denied') return 'denied'
  return 'unknown'
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const { status } = await ExpoNotifications.requestPermissionsAsync()
  if (status === 'granted') return 'granted'
  return 'denied'
}

/**
 * Cancels any previously scheduled notification with each spec's id,
 * then schedules the new ones. Idempotent: safe to call multiple times.
 */
export async function scheduleNotifications(specs: NotificationSpec[]): Promise<void> {
  for (const spec of specs) {
    await ExpoNotifications.cancelScheduledNotificationAsync(spec.id).catch(() => undefined)
    await ExpoNotifications.scheduleNotificationAsync({
      identifier: spec.id,
      content: {
        title: spec.title,
        body: spec.body,
        sound: true,
      },
      trigger: {
        type: ExpoNotifications.SchedulableTriggerInputTypes.DATE,
        date: spec.fireAt,
      },
    })
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await ExpoNotifications.cancelAllScheduledNotificationsAsync()
}
