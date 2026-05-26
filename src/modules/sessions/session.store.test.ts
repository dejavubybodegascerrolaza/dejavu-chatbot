import { act } from '@testing-library/react-native'
import { useSessionStore } from './session.store'
import * as SessionService from './session.service'

jest.mock('./session.service', () => ({
  loadTodaySessions: jest.fn(),
  loadSessions: jest.fn(),
  loadRecentSessions: jest.fn(),
  loadSessionById: jest.fn(),
  deleteExposureSession: jest.fn(),
  createExposureSession: jest.fn(),
}))

const mockLoadToday = SessionService.loadTodaySessions as jest.MockedFunction<
  typeof SessionService.loadTodaySessions
>
const mockLoadSessions = SessionService.loadSessions as jest.MockedFunction<
  typeof SessionService.loadSessions
>
const mockLoadRecent = SessionService.loadRecentSessions as jest.MockedFunction<
  typeof SessionService.loadRecentSessions
>
const mockLoadById = SessionService.loadSessionById as jest.MockedFunction<
  typeof SessionService.loadSessionById
>
const mockDeleteService = SessionService.deleteExposureSession as jest.MockedFunction<
  typeof SessionService.deleteExposureSession
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
    recentSessions: [],
    recentSessionsStatus: 'idle',
    recentSessionsError: null,
    historySessions: [],
    historyStatus: 'idle',
    historyError: null,
    selectedSession: null,
    selectedSessionStatus: 'idle',
    selectedSessionError: null,
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

describe('useSessionStore — loadRecentSessions', () => {
  it('sets recentSessionsStatus ready when sessions exist', async () => {
    mockLoadRecent.mockResolvedValueOnce([mockSession])
    await act(async () => {
      await useSessionStore.getState().loadRecentSessions('user-uuid-1', 7)
    })
    const state = useSessionStore.getState()
    expect(state.recentSessionsStatus).toBe('ready')
    expect(state.recentSessions).toEqual([mockSession])
    expect(state.recentSessionsError).toBeNull()
  })

  it('sets recentSessionsStatus empty when no sessions', async () => {
    mockLoadRecent.mockResolvedValueOnce([])
    await act(async () => {
      await useSessionStore.getState().loadRecentSessions('user-uuid-1', 7)
    })
    const state = useSessionStore.getState()
    expect(state.recentSessionsStatus).toBe('empty')
    expect(state.recentSessions).toEqual([])
  })

  it('sets recentSessionsStatus error on failure', async () => {
    mockLoadRecent.mockRejectedValueOnce(
      new Error('No se han podido cargar tus sesiones. Inténtalo de nuevo.')
    )
    await act(async () => {
      await useSessionStore.getState().loadRecentSessions('user-uuid-1', 7)
    })
    const state = useSessionStore.getState()
    expect(state.recentSessionsStatus).toBe('error')
    expect(state.recentSessionsError).toBe(
      'No se han podido cargar tus sesiones. Inténtalo de nuevo.'
    )
  })
})

describe('useSessionStore — loadHistorySessions', () => {
  it('sets historyStatus ready when sessions exist', async () => {
    mockLoadSessions.mockResolvedValueOnce([mockSession])
    await act(async () => {
      await useSessionStore.getState().loadHistorySessions('user-uuid-1')
    })
    const state = useSessionStore.getState()
    expect(state.historyStatus).toBe('ready')
    expect(state.historySessions).toEqual([mockSession])
    expect(state.historyError).toBeNull()
  })

  it('sets historyStatus empty when no sessions', async () => {
    mockLoadSessions.mockResolvedValueOnce([])
    await act(async () => {
      await useSessionStore.getState().loadHistorySessions('user-uuid-1')
    })
    expect(useSessionStore.getState().historyStatus).toBe('empty')
    expect(useSessionStore.getState().historySessions).toEqual([])
  })

  it('sets historyStatus error on failure', async () => {
    mockLoadSessions.mockRejectedValueOnce(
      new Error('No se ha podido cargar tu historial. Inténtalo de nuevo.')
    )
    await act(async () => {
      await useSessionStore.getState().loadHistorySessions('user-uuid-1')
    })
    const state = useSessionStore.getState()
    expect(state.historyStatus).toBe('error')
    expect(state.historyError).toBe('No se ha podido cargar tu historial. Inténtalo de nuevo.')
  })
})

describe('useSessionStore — loadSessionById', () => {
  it('sets selectedSession ready when found', async () => {
    mockLoadById.mockResolvedValueOnce(mockSession)
    await act(async () => {
      await useSessionStore.getState().loadSessionById('user-uuid-1', 'session-uuid-1')
    })
    const state = useSessionStore.getState()
    expect(state.selectedSessionStatus).toBe('ready')
    expect(state.selectedSession).toEqual(mockSession)
  })

  it('sets selectedSessionStatus missing when session not found', async () => {
    mockLoadById.mockResolvedValueOnce(null)
    await act(async () => {
      await useSessionStore.getState().loadSessionById('user-uuid-1', 'session-uuid-1')
    })
    const state = useSessionStore.getState()
    expect(state.selectedSessionStatus).toBe('missing')
    expect(state.selectedSession).toBeNull()
  })

  it('sets selectedSessionStatus error on failure', async () => {
    mockLoadById.mockRejectedValueOnce(
      new Error('No se ha podido cargar esta sesión. Inténtalo de nuevo.')
    )
    await act(async () => {
      await useSessionStore.getState().loadSessionById('user-uuid-1', 'session-uuid-1')
    })
    const state = useSessionStore.getState()
    expect(state.selectedSessionStatus).toBe('error')
    expect(state.selectedSessionError).toBe(
      'No se ha podido cargar esta sesión. Inténtalo de nuevo.'
    )
  })
})

describe('useSessionStore — deleteSession', () => {
  it('removes session from all lists on success', async () => {
    useSessionStore.setState({
      todaySessions: [mockSession],
      recentSessions: [mockSession],
      historySessions: [mockSession],
      sessions: [mockSession],
      selectedSession: mockSession,
    })
    mockDeleteService.mockResolvedValueOnce(undefined)
    let result: boolean | undefined
    await act(async () => {
      result = await useSessionStore.getState().deleteSession('user-uuid-1', 'session-uuid-1')
    })
    const state = useSessionStore.getState()
    expect(result).toBe(true)
    expect(state.todaySessions).toEqual([])
    expect(state.recentSessions).toEqual([])
    expect(state.historySessions).toEqual([])
    expect(state.sessions).toEqual([])
    expect(state.selectedSession).toBeNull()
  })

  it('returns false and sets error on failure', async () => {
    mockDeleteService.mockRejectedValueOnce(
      new Error('No se ha podido eliminar la sesión. Inténtalo de nuevo.')
    )
    let result: boolean | undefined
    await act(async () => {
      result = await useSessionStore.getState().deleteSession('user-uuid-1', 'session-uuid-1')
    })
    const state = useSessionStore.getState()
    expect(result).toBe(false)
    expect(state.error).toBe('No se ha podido eliminar la sesión. Inténtalo de nuevo.')
  })
})

describe('useSessionStore — clearSelectedSession', () => {
  it('resets selectedSession state', () => {
    useSessionStore.setState({
      selectedSession: mockSession,
      selectedSessionStatus: 'ready',
      selectedSessionError: 'some error',
    })
    useSessionStore.getState().clearSelectedSession()
    const state = useSessionStore.getState()
    expect(state.selectedSession).toBeNull()
    expect(state.selectedSessionStatus).toBe('idle')
    expect(state.selectedSessionError).toBeNull()
  })
})

describe('useSessionStore — clearSessions', () => {
  it('resets all state including history and selected', () => {
    useSessionStore.setState({
      status: 'ready',
      todaySessions: [mockSession],
      sessions: [mockSession],
      recentSessions: [mockSession],
      recentSessionsStatus: 'ready',
      historySessions: [mockSession],
      historyStatus: 'ready',
      selectedSession: mockSession,
      selectedSessionStatus: 'ready',
    })
    useSessionStore.getState().clearSessions()
    const state = useSessionStore.getState()
    expect(state.status).toBe('idle')
    expect(state.todaySessions).toEqual([])
    expect(state.sessions).toEqual([])
    expect(state.recentSessions).toEqual([])
    expect(state.recentSessionsStatus).toBe('idle')
    expect(state.historySessions).toEqual([])
    expect(state.historyStatus).toBe('idle')
    expect(state.selectedSession).toBeNull()
    expect(state.selectedSessionStatus).toBe('idle')
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
