import { deleteTanningPlan, getTanningPlanByUserId, upsertTanningPlan } from './plan.repository'

const mockMaybeSingle = jest.fn()
const mockEqSelect = jest.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelectAll = jest.fn(() => ({ eq: mockEqSelect }))

const mockUpsertSingle = jest.fn()
const mockUpsertSelect = jest.fn(() => ({ single: mockUpsertSingle }))
const mockUpsert = jest.fn(() => ({ select: mockUpsertSelect }))

const mockDeleteEq = jest.fn()
const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'tanning_plans') {
        return { select: mockSelectAll, upsert: mockUpsert, delete: mockDelete }
      }
      return {}
    }),
  },
}))

const ROW = {
  id: 'plan-1',
  user_id: 'user-1',
  goal_level: 'bronze',
  current_level: 'natural',
  start_date: '2026-06-15',
  created_at: '2026-06-15T10:00:00.000Z',
  updated_at: '2026-06-15T10:00:00.000Z',
}

beforeEach(() => jest.clearAllMocks())

describe('getTanningPlanByUserId', () => {
  it('returns the mapped plan when one exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: ROW, error: null })
    const plan = await getTanningPlanByUserId('user-1')
    expect(plan?.goalLevel).toBe('bronze')
    expect(plan?.userId).toBe('user-1')
  })

  it('returns null when there is no plan', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    expect(await getTanningPlanByUserId('user-1')).toBeNull()
  })

  it('throws a mapped error on failure', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'network down' } })
    await expect(getTanningPlanByUserId('user-1')).rejects.toThrow('No se ha podido conectar')
  })
})

describe('upsertTanningPlan', () => {
  it('returns the mapped plan on success', async () => {
    mockUpsertSingle.mockResolvedValueOnce({ data: ROW, error: null })
    const plan = await upsertTanningPlan('user-1', {
      goalLevel: 'bronze',
      currentLevel: 'natural',
      startDate: '2026-06-15',
    })
    expect(plan.goalLevel).toBe('bronze')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', goal_level: 'bronze' }),
      { onConflict: 'user_id' }
    )
  })

  it('maps an auth error', async () => {
    mockUpsertSingle.mockResolvedValueOnce({ data: null, error: { message: 'jwt expired' } })
    await expect(
      upsertTanningPlan('user-1', {
        goalLevel: 'bronze',
        currentLevel: 'natural',
        startDate: '2026-06-15',
      })
    ).rejects.toThrow('La sesión ha caducado. Vuelve a iniciar sesión.')
  })
})

describe('deleteTanningPlan', () => {
  it('resolves on success', async () => {
    mockDeleteEq.mockResolvedValueOnce({ error: null })
    await expect(deleteTanningPlan('user-1')).resolves.toBeUndefined()
    expect(mockDeleteEq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('throws a mapped error on failure', async () => {
    mockDeleteEq.mockResolvedValueOnce({ error: { message: 'fetch failed' } })
    await expect(deleteTanningPlan('user-1')).rejects.toThrow('No se ha podido conectar')
  })
})
