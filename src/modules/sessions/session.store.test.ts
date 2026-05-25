import { act } from '@testing-library/react-native'
import { useSessionStore } from './session.store'
import * as SessionService from './session.service'

jest.mock('./session.service', () => ({
  loadTodaySessions: jest.fn(),
  loadSessions: jest.fn(),
  createExposureSession: jest.fn(),
}))

const mockLoadToday = SessionService.loadTodaySessions as jest.MockedFunction<
  typeof SessionService.loadTodaySessions
>
const mockCreate = SessionService.createExposureSession as jest.MockedFunction<
  typeof SessionService.createExposureSession
>

const today = new Date().toISOString().slice(0, 10)

const mockSession = {
  id: 'session-uuid-1',
  userId: 'user-uuid-1',
  sessionDate: today,
  durationMinutes: 45,
  context: 'beach' as const,
  uvIndexManual: null,
  protectionLevel: 'medium' as const,
  sensationAfter: 'normal' as const,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const validInput = {
  sessionDate: today,
  durationMinutes: 45,
  context: 'beach' as const,
  uvIndexManual: null,
  protectionLevel: 'medium' as const,
  sensationAfter: 'normal' as const,
  notes: null,
}

beforeEach(() => {
  useSessionStore.setState({
    status: 'idle',
    todaySessions: [],
    sessions: [],
    error: null,
    isSubmitting: false,
  })
  jest.clearAllMocks()
})

describe('useSessionStore — loadTodaySessions', () => {
  it('sets status ready when sessions exist', async () => {
    mockLoadToday.mockResolvedValueOnce([mockSession])
    await act(async () => {
      await useSessionStore.getState().loadTodaySessions('user-uuid-1', today)
    })
    const state = useSessionStore.getState()
    expect(state.status).toBe('ready')
    expect(state.todaySessions).toEqual([mockSession])
    expect(state.error).toBeNull()
  })

  it('sets status empty when no sessions', async () => {
    mockLoadToday.mockResolvedValueOnce([])
    await act(async () => {
      await useSessionStore.getState().loadTodaySessions('user-uuid-1', today)
    })
    expect(useSessionStore.getState().status).toBe('empty')
    expect(useSessionStore.getState().todaySessions).toEqual([])
  })

  it('sets status error on failure', async () => {
    mockLoadToday.mockRejectedValueOnce(
      new Error('No se han podido cargar tus sesiones. Inténtalo de nuevo.')
    )
    await act(async () => {
      await useSessionStore.getState().loadTodaySessions('user-uuid-1', today)
    })
    const state = useSessionStore.getState()
    expect(state.status).toBe('error')
    expect(state.error).toBe('No se han podido cargar tus sesiones. Inténtalo de nuevo.')
  })
})

describe('useSessionStore — createSession', () => {
  it('adds session to todaySessions when date is today', async () => {
    useSessionStore.setState({ status: 'empty', todaySessions: [] })
    mockCreate.mockResolvedValueOnce(mockSession)
    await act(async () => {
      await useSessionStore.getState().createSession('user-uuid-1', validInput)
    })
    const state = useSessionStore.getState()
    expect(state.todaySessions).toHaveLength(1)
    expect(state.todaySessions[0]?.id).toBe('session-uuid-1')
    expect(state.status).toBe('ready')
    expect(state.isSubmitting).toBe(false)
  })

  it('does not duplicate a session already in todaySessions', async () => {
    useSessionStore.setState({ status: 'ready', todaySessions: [mockSession] })
    mockCreate.mockResolvedValueOnce(mockSession)
    await act(async () => {
      await useSessionStore.getState().createSession('user-uuid-1', validInput)
    })
    expect(useSessionStore.getState().todaySessions).toHaveLength(1)
  })

  it('does not add to todaySessions when session date is not today', async () => {
    const pastSession = { ...mockSession, sessionDate: '2020-01-01' }
    mockCreate.mockResolvedValueOnce(pastSession)
    await act(async () => {
      await useSessionStore.getState().createSession('user-uuid-1', {
        ...validInput,
        sessionDate: '2020-01-01',
      })
    })
    expect(useSessionStore.getState().todaySessions).toHaveLength(0)
  })

  it('sets error and returns null on failure', async () => {
    mockCreate.mockRejectedValueOnce(
      new Error('No se ha podido guardar la sesión. Inténtalo de nuevo.')
    )
    let returned: unknown
    await act(async () => {
      returned = await useSessionStore.getState().createSession('user-uuid-1', validInput)
    })
    const state = useSessionStore.getState()
    expect(returned).toBeNull()
    expect(state.error).toBe('No se ha podido guardar la sesión. Inténtalo de nuevo.')
    expect(state.isSubmitting).toBe(false)
  })
})

describe('useSessionStore — clearSessions', () => {
  it('resets all state to idle', () => {
    useSessionStore.setState({
      status: 'ready',
      todaySessions: [mockSession],
      sessions: [mockSession],
    })
    useSessionStore.getState().clearSessions()
    const state = useSessionStore.getState()
    expect(state.status).toBe('idle')
    expect(state.todaySessions).toEqual([])
    expect(state.sessions).toEqual([])
    expect(state.error).toBeNull()
  })
})

describe('useSessionStore — clearError', () => {
  it('clears error field', () => {
    useSessionStore.setState({ error: 'some error' })
    useSessionStore.getState().clearError()
    expect(useSessionStore.getState().error).toBeNull()
  })
})
