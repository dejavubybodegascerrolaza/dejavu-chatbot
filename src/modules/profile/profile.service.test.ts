import { loadProfile, completeOnboarding, updateProfileSettings } from './profile.service'
import * as ProfileRepository from './profile.repository'

jest.mock('./profile.repository', () => ({
  getProfileByUserId: jest.fn(),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
  updateProfileSettings: jest.fn(),
}))

const mockGetProfile = ProfileRepository.getProfileByUserId as jest.MockedFunction<
  typeof ProfileRepository.getProfileByUserId
>
const mockCreateProfile = ProfileRepository.createProfile as jest.MockedFunction<
  typeof ProfileRepository.createProfile
>
const mockUpdateProfile = ProfileRepository.updateProfile as jest.MockedFunction<
  typeof ProfileRepository.updateProfile
>
const mockUpdateProfileSettings = ProfileRepository.updateProfileSettings as jest.MockedFunction<
  typeof ProfileRepository.updateProfileSettings
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

beforeEach(() => jest.clearAllMocks())

describe('loadProfile', () => {
  it('returns profile when exists', async () => {
    mockGetProfile.mockResolvedValueOnce(mockProfile)
    const result = await loadProfile('user-uuid-1')
    expect(result).toEqual(mockProfile)
    expect(mockGetProfile).toHaveBeenCalledWith('user-uuid-1')
  })

  it('returns null when no profile exists', async () => {
    mockGetProfile.mockResolvedValueOnce(null)
    const result = await loadProfile('user-uuid-1')
    expect(result).toBeNull()
  })
})

describe('completeOnboarding', () => {
  it('creates profile if none exists', async () => {
    mockGetProfile.mockResolvedValueOnce(null)
    mockCreateProfile.mockResolvedValueOnce(mockProfile)
    const result = await completeOnboarding('user-uuid-1', validInput)
    expect(mockCreateProfile).toHaveBeenCalledWith('user-uuid-1', validInput)
    expect(mockUpdateProfile).not.toHaveBeenCalled()
    expect(result).toEqual(mockProfile)
  })

  it('updates profile if one already exists (incomplete onboarding)', async () => {
    mockGetProfile.mockResolvedValueOnce({ ...mockProfile, onboardingCompleted: false })
    mockUpdateProfile.mockResolvedValueOnce(mockProfile)
    const result = await completeOnboarding('user-uuid-1', validInput)
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-uuid-1', validInput)
    expect(mockCreateProfile).not.toHaveBeenCalled()
    expect(result).toEqual(mockProfile)
  })

  it('throws Zod error for invalid alias (too short)', async () => {
    await expect(completeOnboarding('user-uuid-1', { ...validInput, alias: 'X' })).rejects.toThrow()
  })

  it('throws Zod error when disclaimerAcceptedAt is empty string', async () => {
    await expect(
      completeOnboarding('user-uuid-1', { ...validInput, disclaimerAcceptedAt: '' })
    ).rejects.toThrow()
  })

  it('allows null skinType', async () => {
    mockGetProfile.mockResolvedValueOnce(null)
    mockCreateProfile.mockResolvedValueOnce({ ...mockProfile, skinType: null })
    const result = await completeOnboarding('user-uuid-1', { ...validInput, skinType: null })
    expect(result.skinType).toBeNull()
  })
})

describe('updateProfileSettings', () => {
  it('delegates to repository with valid input and returns updated profile', async () => {
    const updatedProfile = { ...mockProfile, alias: 'NewAlias' }
    mockUpdateProfileSettings.mockResolvedValueOnce(updatedProfile)
    const result = await updateProfileSettings('user-uuid-1', { alias: 'NewAlias' })
    expect(mockUpdateProfileSettings).toHaveBeenCalledWith('user-uuid-1', { alias: 'NewAlias' })
    expect(result).toEqual(updatedProfile)
  })

  it('propagates repository errors', async () => {
    mockUpdateProfileSettings.mockRejectedValueOnce(
      new Error('No se ha podido guardar tu perfil. Inténtalo de nuevo.')
    )
    await expect(updateProfileSettings('user-uuid-1', { alias: 'NewAlias' })).rejects.toThrow(
      'No se ha podido guardar tu perfil. Inténtalo de nuevo.'
    )
  })

  it('passes through partial updates (only mainGoal)', async () => {
    const updatedProfile = { ...mockProfile, mainGoal: 'track_sessions' as const }
    mockUpdateProfileSettings.mockResolvedValueOnce(updatedProfile)
    const result = await updateProfileSettings('user-uuid-1', { mainGoal: 'track_sessions' })
    expect(mockUpdateProfileSettings).toHaveBeenCalledWith('user-uuid-1', {
      mainGoal: 'track_sessions',
    })
    expect(result.mainGoal).toBe('track_sessions')
  })

  it('accepts skinType: null to clear the field', async () => {
    const updatedProfile = { ...mockProfile, skinType: null }
    mockUpdateProfileSettings.mockResolvedValueOnce(updatedProfile)
    const result = await updateProfileSettings('user-uuid-1', { skinType: null })
    expect(result.skinType).toBeNull()
  })
})
