import { mapDeletionRequestRowToRequest } from './privacy.mapper'

const mockRow = {
  id: 'req-uuid-1',
  user_id: 'user-uuid-1',
  requested_at: '2026-05-26T10:00:00.000Z',
  status: 'pending',
  processed_at: null,
}

describe('mapDeletionRequestRowToRequest', () => {
  it('maps snake_case row to camelCase domain object', () => {
    const result = mapDeletionRequestRowToRequest(mockRow)
    expect(result.id).toBe('req-uuid-1')
    expect(result.userId).toBe('user-uuid-1')
    expect(result.requestedAt).toBe('2026-05-26T10:00:00.000Z')
    expect(result.status).toBe('pending')
    expect(result.processedAt).toBeNull()
  })

  it('maps processed_at when set', () => {
    const processed = {
      ...mockRow,
      status: 'processed',
      processed_at: '2026-06-01T00:00:00.000Z',
    }
    const result = mapDeletionRequestRowToRequest(processed)
    expect(result.status).toBe('processed')
    expect(result.processedAt).toBe('2026-06-01T00:00:00.000Z')
  })
})
