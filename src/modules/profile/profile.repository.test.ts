import { getProfileByUserId, createProfile, updateProfile } from './profile.repository'
import { supabase } from '@/lib/supabase'

// Supabase builder chain mock
const mockChain = {
  select: jest.fn(),
  eq: jest.fn(),
  maybeSingle: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  single: jest.fn(),
}

mockChain.select.mockReturnValue(mockChain)
mockChain.eq.mockReturnValue(mockChain)
mockChain.insert.mockReturnValue(mockChain)
mockChain.update.mockReturnValue(mockChain)

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockChain),
  },
}))

const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>

const mockProfileRow = {
  id: 'user-uuid-1',
  alias: 'Alex',
  main_goal: 'gradual_bronze',
  sun_sensitivity: 'medium',
  skin_type: 3,
  onboarding_completed: true,
  disclaimer_accepted_at: '2026-05-25T10:00:00.000Z',
  created_at: '2026-05-25T09:00:00.000Z',
  updated_at: '2026-05-25T10:00:00.000Z',
}

const mockSetupInput = {
  alias: 'Alex',
  mainGoal: 'gradual_bronze' as const,
  sunSensitivity: 'medium' as const,
  skinType: 3 as const,
  disclaimerAcceptedAt: '2026-05-25T10:00:00.000Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockChain.select.mockReturnValue(mockChain)
  mockChain.eq.mockReturnValue(mockChain)
  mockChain.insert.mockReturnValue(mockChain)
  mockChain.update.mockReturnValue(mockChain)
})

describe('getProfileByUserId', () => {
  it('returns mapped Profile when row exists', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: mockProfileRow, error: null })
    const profile = await getProfileByUserId('user-uuid-1')
    expect(profile).not.toBeNull()
    expect(profile?.alias).toBe('Alex')
    expect(profile?.mainGoal).toBe('gradual_bronze')
    expect(profile?.skinType).toBe(3)
    expect(mockFrom).toHaveBeenCalledWith('profiles')
  })

  it('returns null when no row exists', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const profile = await getProfileByUserId('user-uuid-1')
    expect(profile).toBeNull()
  })

  it('throws mapped error on Supabase error', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'some db error', code: '500' },
    })
    await expect(getProfileByUserId('user-uuid-1')).rejects.toThrow(
      'No se ha podido guardar tu perfil. Inténtalo de nuevo.'
    )
  })

  it('throws session error for JWT-related errors', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'JWT expired', code: '401' },
    })
    await expect(getProfileByUserId('user-uuid-1')).rejects.toThrow(
      'La sesión ha caducado. Vuelve a iniciar sesión.'
    )
  })
})

describe('createProfile', () => {
  it('returns mapped Profile on success', async () => {
    mockChain.single.mockResolvedValueOnce({ data: mockProfileRow, error: null })
    const profile = await createProfile('user-uuid-1', mockSetupInput)
    expect(profile.alias).toBe('Alex')
    expect(profile.onboardingCompleted).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('profiles')
  })

  it('throws error on Supabase failure', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'duplicate key', code: '23505' },
    })
    await expect(createProfile('user-uuid-1', mockSetupInput)).rejects.toThrow(
      'No se ha podido guardar tu perfil. Inténtalo de nuevo.'
    )
  })
})

describe('updateProfile', () => {
  it('returns mapped Profile on success', async () => {
    mockChain.single.mockResolvedValueOnce({ data: mockProfileRow, error: null })
    const profile = await updateProfile('user-uuid-1', mockSetupInput)
    expect(profile.alias).toBe('Alex')
    expect(mockFrom).toHaveBeenCalledWith('profiles')
  })

  it('throws error on Supabase failure', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed to fetch', code: '0' },
    })
    await expect(updateProfile('user-uuid-1', mockSetupInput)).rejects.toThrow(
      'No se ha podido conectar. Inténtalo de nuevo.'
    )
  })
})
