import {
  getSessionsByUserId,
  getRecentSessionsByUserId,
  getTodaySessionsByUserId,
  getSessionById,
  deleteSession,
  createSession,
} from './session.repository'
import { supabase } from '@/lib/supabase'

const mockChain = {
  select: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  order: jest.fn(),
  insert: jest.fn(),
  single: jest.fn(),
  delete: jest.fn(),
}

mockChain.select.mockReturnValue(mockChain)
mockChain.eq.mockReturnValue(mockChain)
mockChain.gte.mockReturnValue(mockChain)
mockChain.order.mockReturnValue(mockChain)
mockChain.insert.mockReturnValue(mockChain)
mockChain.delete.mockReturnValue(mockChain)

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockChain),
  },
}))

const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>

const mockRow = {
  id: 'session-uuid-1',
  user_id: 'user-uuid-1',
  session_date: '2026-05-25',
  duration_minutes: 45,
  context: 'beach',
  uv_index_manual: null,
  protection_level: 'medium',
  sensation_after: 'normal',
  notes: null,
  created_at: '2026-05-25T10:00:00.000Z',
  updated_at: '2026-05-25T10:00:00.000Z',
}

const mockInput = {
  sessionDate: '2026-05-25',
  durationMinutes: 45,
  context: 'beach' as const,
  uvIndexManual: null,
  protectionLevel: 'medium' as const,
  sensationAfter: 'normal' as const,
  notes: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockChain.select.mockReturnValue(mockChain)
  mockChain.eq.mockReturnValue(mockChain)
  mockChain.gte.mockReturnValue(mockChain)
  mockChain.order.mockReturnValue(mockChain)
  mockChain.insert.mockReturnValue(mockChain)
  mockChain.delete.mockReturnValue(mockChain)
})

// getSessionsByUserId chains .order() twice; first returns chain, second resolves
function mockGetSessionsResolve(payload: { data: unknown; error: unknown }) {
  mockChain.order.mockReturnValueOnce(mockChain).mockResolvedValueOnce(payload)
}

describe('getSessionsByUserId', () => {
  it('returns mapped sessions ordered by date and created_at', async () => {
    mockGetSessionsResolve({ data: [mockRow], error: null })
    const result = await getSessionsByUserId('user-uuid-1')
    expect(result).toHaveLength(1)
    expect(result[0]?.sessionDate).toBe('2026-05-25')
    expect(result[0]?.context).toBe('beach')
    expect(mockFrom).toHaveBeenCalledWith('exposure_sessions')
  })

  it('returns empty array when no sessions exist', async () => {
    mockGetSessionsResolve({ data: [], error: null })
    const result = await getSessionsByUserId('user-uuid-1')
    expect(result).toEqual([])
  })

  it('throws mapped error on Supabase error', async () => {
    mockGetSessionsResolve({ data: null, error: { message: 'some db error', code: '500' } })
    await expect(getSessionsByUserId('user-uuid-1')).rejects.toThrow(
      'No se ha podido guardar la sesión. Inténtalo de nuevo.'
    )
  })

  it('throws network error when fetch fails', async () => {
    mockGetSessionsResolve({ data: null, error: { message: 'Failed to fetch', code: '0' } })
    await expect(getSessionsByUserId('user-uuid-1')).rejects.toThrow(
      'No se ha podido conectar. Inténtalo de nuevo.'
    )
  })
})

describe('getRecentSessionsByUserId', () => {
  it('returns mapped sessions filtered from a given date', async () => {
    mockGetSessionsResolve({ data: [mockRow], error: null })
    const result = await getRecentSessionsByUserId('user-uuid-1', '2026-05-18')
    expect(result).toHaveLength(1)
    expect(result[0]?.sessionDate).toBe('2026-05-25')
    expect(mockFrom).toHaveBeenCalledWith('exposure_sessions')
  })

  it('returns empty array when no recent sessions', async () => {
    mockGetSessionsResolve({ data: [], error: null })
    const result = await getRecentSessionsByUserId('user-uuid-1', '2026-05-18')
    expect(result).toEqual([])
  })

  it('throws mapped error on Supabase error', async () => {
    mockGetSessionsResolve({ data: null, error: { message: 'some db error', code: '500' } })
    await expect(getRecentSessionsByUserId('user-uuid-1', '2026-05-18')).rejects.toThrow(
      'No se ha podido guardar la sesión. Inténtalo de nuevo.'
    )
  })

  it('throws network error when fetch fails', async () => {
    mockGetSessionsResolve({ data: null, error: { message: 'Failed to fetch', code: '0' } })
    await expect(getRecentSessionsByUserId('user-uuid-1', '2026-05-18')).rejects.toThrow(
      'No se ha podido conectar. Inténtalo de nuevo.'
    )
  })
})

describe('getTodaySessionsByUserId', () => {
  it('filters by user_id and session_date', async () => {
    mockChain.order.mockResolvedValueOnce({ data: [mockRow], error: null })
    const result = await getTodaySessionsByUserId('user-uuid-1', '2026-05-25')
    expect(result).toHaveLength(1)
    expect(result[0]?.sessionDate).toBe('2026-05-25')
  })

  it('returns empty array when no sessions today', async () => {
    mockChain.order.mockResolvedValueOnce({ data: [], error: null })
    const result = await getTodaySessionsByUserId('user-uuid-1', '2026-05-25')
    expect(result).toEqual([])
  })

  it('throws mapped error on failure', async () => {
    mockChain.order.mockResolvedValueOnce({
      data: null,
      error: { message: 'JWT expired', code: '401' },
    })
    await expect(getTodaySessionsByUserId('user-uuid-1', '2026-05-25')).rejects.toThrow(
      'La sesión ha caducado. Vuelve a iniciar sesión.'
    )
  })
})

describe('getSessionById', () => {
  it('returns mapped session when found', async () => {
    mockChain.single.mockResolvedValueOnce({ data: mockRow, error: null })
    const result = await getSessionById('user-uuid-1', 'session-uuid-1')
    expect(result).not.toBeNull()
    expect(result?.sessionDate).toBe('2026-05-25')
    expect(mockFrom).toHaveBeenCalledWith('exposure_sessions')
  })

  it('returns null when PGRST116 (no row found)', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'The result contains 0 rows' },
    })
    const result = await getSessionById('user-uuid-1', 'session-uuid-1')
    expect(result).toBeNull()
  })

  it('returns null when data is null without error', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: null })
    const result = await getSessionById('user-uuid-1', 'session-uuid-1')
    expect(result).toBeNull()
  })

  it('throws mapped error on other Supabase error', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'JWT expired', code: '401' },
    })
    await expect(getSessionById('user-uuid-1', 'session-uuid-1')).rejects.toThrow(
      'La sesión ha caducado. Vuelve a iniciar sesión.'
    )
  })
})

describe('deleteSession', () => {
  it('executes delete filtered by user_id and session id', async () => {
    mockChain.eq.mockReturnValueOnce(mockChain).mockResolvedValueOnce({ error: null })
    await expect(deleteSession('user-uuid-1', 'session-uuid-1')).resolves.toBeUndefined()
    expect(mockFrom).toHaveBeenCalledWith('exposure_sessions')
    expect(mockChain.delete).toHaveBeenCalled()
  })

  it('throws mapped error on delete failure', async () => {
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: { message: 'some db error', code: '500' } })
    await expect(deleteSession('user-uuid-1', 'session-uuid-1')).rejects.toThrow(
      'No se ha podido guardar la sesión. Inténtalo de nuevo.'
    )
  })
})

describe('createSession', () => {
  it('inserts with user_id and returns mapped session', async () => {
    mockChain.single.mockResolvedValueOnce({ data: mockRow, error: null })
    const result = await createSession('user-uuid-1', mockInput)
    expect(result.userId).toBe('user-uuid-1')
    expect(result.sessionDate).toBe('2026-05-25')
    expect(mockFrom).toHaveBeenCalledWith('exposure_sessions')
  })

  it('throws on Supabase insert error', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'duplicate key', code: '23505' },
    })
    await expect(createSession('user-uuid-1', mockInput)).rejects.toThrow(
      'No se ha podido guardar la sesión. Inténtalo de nuevo.'
    )
  })
})
