jest.mock('./notifications.service', () => ({
  getNotificationPermission: jest.fn(),
  requestNotificationPermission: jest.fn(),
  scheduleNotifications: jest.fn(),
  cancelNotification: jest.fn(),
  cancelAllNotifications: jest.fn(),
}))

import { useNotificationStore } from './notifications.store'
import * as NotificationService from './notifications.service'

const mockRequest = NotificationService.requestNotificationPermission as jest.MockedFunction<
  typeof NotificationService.requestNotificationPermission
>
const mockRefresh = NotificationService.getNotificationPermission as jest.MockedFunction<
  typeof NotificationService.getNotificationPermission
>
const mockSchedule = NotificationService.scheduleNotifications as jest.MockedFunction<
  typeof NotificationService.scheduleNotifications
>
const mockCancel = NotificationService.cancelAllNotifications as jest.MockedFunction<
  typeof NotificationService.cancelAllNotifications
>
const mockCancelOne = NotificationService.cancelNotification as jest.MockedFunction<
  typeof NotificationService.cancelNotification
>

const BASE_INPUT = {
  uvPeakWindow: null,
  streak: 0,
  hasActivePlan: false,
  now: new Date('2026-06-15T08:00:00.000'),
}

beforeEach(() => {
  jest.clearAllMocks()
  useNotificationStore.setState({
    permission: 'unknown',
    preferences: {
      uvAlertsEnabled: true,
      sessionRemindersEnabled: true,
      streakRemindersEnabled: true,
      sessionReminderHour: 10,
    },
  })
})

describe('useNotificationStore', () => {
  it('starts with unknown permission and default preferences', () => {
    const state = useNotificationStore.getState()
    expect(state.permission).toBe('unknown')
    expect(state.preferences.sessionReminderHour).toBe(10)
  })

  it('updates permission to granted on successful request', async () => {
    mockRequest.mockResolvedValueOnce('granted')
    await useNotificationStore.getState().requestPermission()
    expect(useNotificationStore.getState().permission).toBe('granted')
  })

  it('updates permission to denied on failed request', async () => {
    mockRequest.mockResolvedValueOnce('denied')
    await useNotificationStore.getState().requestPermission()
    expect(useNotificationStore.getState().permission).toBe('denied')
  })

  it('refreshes permission without prompting', async () => {
    mockRefresh.mockResolvedValueOnce('granted')
    await useNotificationStore.getState().refreshPermission()
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(useNotificationStore.getState().permission).toBe('granted')
  })

  it('does not schedule when permission is not granted', async () => {
    useNotificationStore.setState({ permission: 'denied' })
    await useNotificationStore.getState().scheduleAll(BASE_INPUT)
    expect(mockSchedule).not.toHaveBeenCalled()
  })

  it('does not schedule when permission is unknown', async () => {
    useNotificationStore.setState({ permission: 'unknown' })
    await useNotificationStore.getState().scheduleAll(BASE_INPUT)
    expect(mockSchedule).not.toHaveBeenCalled()
  })

  it('calls scheduleNotifications when permission is granted', async () => {
    mockSchedule.mockResolvedValueOnce(undefined)
    useNotificationStore.setState({ permission: 'granted' })
    // streak=3, hasActivePlan=true, now=08:00 → session reminder + streak reminder
    await useNotificationStore.getState().scheduleAll({
      ...BASE_INPUT,
      streak: 3,
      hasActivePlan: true,
    })
    expect(mockSchedule).toHaveBeenCalledTimes(1)
    const specs = mockSchedule.mock.calls[0]![0]
    expect(specs.length).toBeGreaterThan(0)
    const ids = specs.map((s) => s.id)
    expect(ids).toContain('session-reminder')
    expect(ids).toContain('streak-reminder')
  })

  it('passes UV spec when forecast has a peak window', async () => {
    mockSchedule.mockResolvedValueOnce(undefined)
    useNotificationStore.setState({ permission: 'granted' })
    await useNotificationStore.getState().scheduleAll({
      ...BASE_INPUT,
      uvPeakWindow: { startHour: 11, endHour: 15, maxUvIndex: 9 },
    })
    const specs = mockSchedule.mock.calls[0]![0]
    expect(specs.find((s) => s.id === 'uv-peak-alert')).toBeDefined()
  })

  it('updates a single preference', () => {
    useNotificationStore.getState().setPreference('uvAlertsEnabled', false)
    expect(useNotificationStore.getState().preferences.uvAlertsEnabled).toBe(false)
    expect(useNotificationStore.getState().preferences.sessionRemindersEnabled).toBe(true)
  })

  it('cancels the associated notification when a boolean channel is toggled off', () => {
    mockCancelOne.mockResolvedValueOnce(undefined)
    useNotificationStore.getState().setPreference('uvAlertsEnabled', false)
    expect(mockCancelOne).toHaveBeenCalledWith('uv-peak-alert')
  })

  it('cancels streak-reminder when streakRemindersEnabled is toggled off', () => {
    mockCancelOne.mockResolvedValueOnce(undefined)
    useNotificationStore.getState().setPreference('streakRemindersEnabled', false)
    expect(mockCancelOne).toHaveBeenCalledWith('streak-reminder')
  })

  it('cancels both session-reminder and recovery-check-in when sessionRemindersEnabled is toggled off', () => {
    mockCancelOne.mockResolvedValue(undefined)
    useNotificationStore.getState().setPreference('sessionRemindersEnabled', false)
    expect(mockCancelOne).toHaveBeenCalledWith('session-reminder')
    expect(mockCancelOne).toHaveBeenCalledWith('recovery-check-in')
  })

  it('does not cancel any notification when toggling a channel on', () => {
    useNotificationStore.setState({
      preferences: {
        uvAlertsEnabled: false,
        sessionRemindersEnabled: true,
        streakRemindersEnabled: true,
        sessionReminderHour: 10,
      },
    })
    useNotificationStore.getState().setPreference('uvAlertsEnabled', true)
    expect(mockCancelOne).not.toHaveBeenCalled()
  })

  it('does not cancel a notification when changing a non-boolean preference', () => {
    useNotificationStore.getState().setPreference('sessionReminderHour', 9)
    expect(useNotificationStore.getState().preferences.sessionReminderHour).toBe(9)
    expect(mockCancelOne).not.toHaveBeenCalled()
  })

  it('calls cancelAllNotifications on cancelAll', async () => {
    mockCancel.mockResolvedValueOnce(undefined)
    await useNotificationStore.getState().cancelAll()
    expect(mockCancel).toHaveBeenCalledTimes(1)
  })
})
