import { act } from '@testing-library/react-native'
import { useProfileStore } from './profile.store'
import * as ProfileService from './profile.service'

jest.mock('./profile.service', () => ({
  loadProfile: jest.fn(),
  completeOnboarding: jest.fn(),
}))

const mockLoadProfile = ProfileService.loadProfile as jest.MockedFunction<
  typeof ProfileService.loadProfile
>
const mockCompleteOnboarding = ProfileService.completeOnboarding as jest.MockedFunction<
  typeof ProfileService.completeOnboarding
>

const mockProfile = {
  id: 'user-uuid-1',
  alias: 'Alex',
  mainGoal: 'gradual_bronze' as const,
  sunSensitivity: 'medium' as const,
  skinType: 3 as const,
  onboardingCompleted: true,
  disclaimerAcceptedAt: '2026-05-25T10:00:00.000Z',
  createdAt: '2026-05-25T09:00:00.000Z',
  updatedAt: '2026-05-25T10:00:00.000Z',
}

const validInput = {
  alias: 'Alex',
  mainGoal: 'gradual_bronze' as const,
  sunSensitivity: 'medium' as const,
  skinType: 3 as const,
  disclaimerAcceptedAt: '2026-05-25T10:00:00.000Z',
}

beforeEach(() => {
  useProfileStore.setState({ status: 'idle', profile: null, error: null, isSubmitting: false })
  jest.clearAllMocks()
})

describe('useProfileStore — loadProfile', () => {
  it('sets status ready when profile exists and onboarding complete', async () => {
    mockLoadProfile.mockResolvedValueOnce(mockProfile)
    await act(async () => {
      await useProfileStore.getState().loadProfile('user-uuid-1')
    })
    const state = useProfileStore.getState()
    expect(state.status).toBe('ready')
    expect(state.profile).toEqual(mockProfile)
    expect(state.error).toBeNull()
  })

  it('sets status missing when profile is null', async () => {
    mockLoadProfile.mockResolvedValueOnce(null)
    await act(async () => {
      await useProfileStore.getState().loadProfile('user-uuid-1')
    })
    const state = useProfileStore.getState()
    expect(state.status).toBe('missing')
    expect(state.profile).toBeNull()
  })

  it('sets status missing when profile exists but onboarding incomplete', async () => {
    mockLoadProfile.mockResolvedValueOnce({ ...mockProfile, onboardingCompleted: false })
    await act(async () => {
      await useProfileStore.getState().loadProfile('user-uuid-1')
    })
    expect(useProfileStore.getState().status).toBe('missing')
  })

  it('sets status error on failure', async () => {
    mockLoadProfile.mockRejectedValueOnce(
      new Error('No se ha podido conectar. Inténtalo de nuevo.')
    )
    await act(async () => {
      await useProfileStore.getState().loadProfile('user-uuid-1')
    })
    const state = useProfileStore.getState()
    expect(state.status).toBe('error')
    expect(state.error).toBe('No se ha podido conectar. Inténtalo de nuevo.')
  })
})

describe('useProfileStore — completeOnboarding', () => {
  it('sets status ready and stores profile on success', async () => {
    mockCompleteOnboarding.mockResolvedValueOnce(mockProfile)
    await act(async () => {
      await useProfileStore.getState().completeOnboarding('user-uuid-1', validInput)
    })
    const state = useProfileStore.getState()
    expect(state.status).toBe('ready')
    expect(state.profile).toEqual(mockProfile)
    expect(state.isSubmitting).toBe(false)
    expect(state.error).toBeNull()
  })

  it('sets error on failure without changing status to ready', async () => {
    useProfileStore.setState({ status: 'missing' })
    mockCompleteOnboarding.mockRejectedValueOnce(
      new Error('No se ha podido guardar tu perfil. Inténtalo de nuevo.')
    )
    await act(async () => {
      await useProfileStore.getState().completeOnboarding('user-uuid-1', validInput)
    })
    const state = useProfileStore.getState()
    expect(state.status).toBe('missing')
    expect(state.error).toBe('No se ha podido guardar tu perfil. Inténtalo de nuevo.')
    expect(state.isSubmitting).toBe(false)
  })
})

describe('useProfileStore — clearProfile', () => {
  it('resets all state to idle', () => {
    useProfileStore.setState({ status: 'ready', profile: mockProfile, error: null })
    useProfileStore.getState().clearProfile()
    const state = useProfileStore.getState()
    expect(state.status).toBe('idle')
    expect(state.profile).toBeNull()
    expect(state.error).toBeNull()
  })
})

describe('useProfileStore — clearError', () => {
  it('clears error field', () => {
    useProfileStore.setState({ error: 'some error' })
    useProfileStore.getState().clearError()
    expect(useProfileStore.getState().error).toBeNull()
  })
})
