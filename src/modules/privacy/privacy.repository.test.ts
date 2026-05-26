import { createDeletionRequest, getDeletionRequestsByUserId } from './privacy.repository'

const mockSingle = jest.fn()
const mockSelect = jest.fn(() => ({ single: mockSingle }))
const mockInsert = jest.fn(() => ({ select: mockSelect }))
const mockOrder = jest.fn()
const mockEq = jest.fn(() => ({ order: mockOrder }))
const mockSelectAll = jest.fn(() => ({ eq: mockEq }))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'deletion_requests') {
        return {
          insert: mockInsert,
          select: mockSelectAll,
        }
      }
      return {}
    }),
  },
}))

const mockRow = {
  id: 'req-uuid-1',
  user_id: 'user-uuid-1',
  requested_at: '2026-05-26T10:00:00.000Z',
  status: 'pending',
  processed_at: null,
}

beforeEach(() => jest.clearAllMocks())

describe('createDeletionRequest', () => {
  it('returns mapped DataDeletionRequest on success', async () => {
    mockSingle.mockResolvedValueOnce({ data: mockRow, error: null })
    const result = await createDeletionRequest('user-uuid-1')
    expect(result).toEqual({
      id: 'req-uuid-1',
      userId: 'user-uuid-1',
      requestedAt: '2026-05-26T10:00:00.000Z',
      status: 'pending',
      processedAt: null,
    })
  })

  it('throws mapped error on Supabase error', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'network error' } })
    await expect(createDeletionRequest('user-uuid-1')).rejects.toThrow(
      'No se ha podido conectar. Inténtalo de nuevo.'
    )
  })

  it('throws on null data with no error', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null })
    await expect(createDeletionRequest('user-uuid-1')).rejects.toThrow(
      'No se ha podido registrar la solicitud. Inténtalo de nuevo.'
    )
  })

  it('maps auth error correctly', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'jwt expired' } })
    await expect(createDeletionRequest('user-uuid-1')).rejects.toThrow(
      'La sesión ha caducado. Vuelve a iniciar sesión.'
    )
  })
})

describe('getDeletionRequestsByUserId', () => {
  it('returns array of mapped requests', async () => {
    mockOrder.mockResolvedValueOnce({ data: [mockRow], error: null })
    const result = await getDeletionRequestsByUserId('user-uuid-1')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'req-uuid-1',
      userId: 'user-uuid-1',
      requestedAt: '2026-05-26T10:00:00.000Z',
      status: 'pending',
      processedAt: null,
    })
  })

  it('returns empty array when no requests', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: null })
    const result = await getDeletionRequestsByUserId('user-uuid-1')
    expect(result).toEqual([])
  })

  it('throws on error', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'fetch failed' } })
    await expect(getDeletionRequestsByUserId('user-uuid-1')).rejects.toThrow(
      'No se ha podido conectar. Inténtalo de nuevo.'
    )
  })
})
