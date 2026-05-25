import { mapSessionRowToSession, mapCreateSessionInputToInsert } from './session.mapper'

const mockRow = {
  id: 'session-uuid-1',
  user_id: 'user-uuid-1',
  session_date: '2026-05-25',
  duration_minutes: 45,
  context: 'beach',
  uv_index_manual: 6,
  protection_level: 'medium',
  sensation_after: 'normal',
  notes: 'Some notes',
  created_at: '2026-05-25T10:00:00.000Z',
  updated_at: '2026-05-25T10:00:00.000Z',
}

const mockInput = {
  sessionDate: '2026-05-25',
  durationMinutes: 45,
  context: 'beach' as const,
  uvIndexManual: 6,
  protectionLevel: 'medium' as const,
  sensationAfter: 'normal' as const,
  notes: 'Some notes',
}

describe('mapSessionRowToSession', () => {
  it('maps snake_case row to camelCase domain object', () => {
    const result = mapSessionRowToSession(mockRow)
    expect(result.id).toBe('session-uuid-1')
    expect(result.userId).toBe('user-uuid-1')
    expect(result.sessionDate).toBe('2026-05-25')
    expect(result.durationMinutes).toBe(45)
    expect(result.context).toBe('beach')
    expect(result.uvIndexManual).toBe(6)
    expect(result.protectionLevel).toBe('medium')
    expect(result.sensationAfter).toBe('normal')
    expect(result.notes).toBe('Some notes')
    expect(result.createdAt).toBe('2026-05-25T10:00:00.000Z')
    expect(result.updatedAt).toBe('2026-05-25T10:00:00.000Z')
  })

  it('preserves uvIndexManual null', () => {
    const result = mapSessionRowToSession({ ...mockRow, uv_index_manual: null })
    expect(result.uvIndexManual).toBeNull()
  })

  it('preserves notes null', () => {
    const result = mapSessionRowToSession({ ...mockRow, notes: null })
    expect(result.notes).toBeNull()
  })

  it('maps all context values correctly', () => {
    const contexts = ['beach', 'pool', 'urban', 'terrace_garden', 'outdoor_sport', 'other'] as const
    for (const ctx of contexts) {
      const result = mapSessionRowToSession({ ...mockRow, context: ctx })
      expect(result.context).toBe(ctx)
    }
  })
})

describe('mapCreateSessionInputToInsert', () => {
  it('maps camelCase input to snake_case insert', () => {
    const result = mapCreateSessionInputToInsert('user-uuid-1', mockInput)
    expect(result.user_id).toBe('user-uuid-1')
    expect(result.session_date).toBe('2026-05-25')
    expect(result.duration_minutes).toBe(45)
    expect(result.context).toBe('beach')
    expect(result.uv_index_manual).toBe(6)
    expect(result.protection_level).toBe('medium')
    expect(result.sensation_after).toBe('normal')
    expect(result.notes).toBe('Some notes')
  })

  it('preserves uvIndexManual null in insert', () => {
    const result = mapCreateSessionInputToInsert('user-uuid-1', {
      ...mockInput,
      uvIndexManual: null,
    })
    expect(result.uv_index_manual).toBeNull()
  })

  it('preserves notes null in insert', () => {
    const result = mapCreateSessionInputToInsert('user-uuid-1', { ...mockInput, notes: null })
    expect(result.notes).toBeNull()
  })
})
