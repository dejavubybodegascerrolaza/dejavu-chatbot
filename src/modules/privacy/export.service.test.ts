// Prevent supabase client initialisation (env check) when repository modules load
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }))

jest.mock('@/modules/sessions/session.repository')
jest.mock('@/modules/profile/profile.repository')
jest.mock('@/modules/plan/plan.repository')

import { buildUserDataExport } from './export.service'
import * as SessionRepository from '@/modules/sessions/session.repository'
import * as ProfileRepository from '@/modules/profile/profile.repository'
import * as PlanRepository from '@/modules/plan/plan.repository'

const mockGetSessions = SessionRepository.getSessionsByUserId as jest.MockedFunction<
  typeof SessionRepository.getSessionsByUserId
>
const mockGetProfile = ProfileRepository.getProfileByUserId as jest.MockedFunction<
  typeof ProfileRepository.getProfileByUserId
>
const mockGetPlan = PlanRepository.getTanningPlanByUserId as jest.MockedFunction<
  typeof PlanRepository.getTanningPlanByUserId
>

const MOCK_PROFILE = {
  id: 'user-1',
  alias: 'Test',
  mainGoal: 'gradual_bronze' as const,
  sunSensitivity: 'medium' as const,
  skinType: 2 as const,
  onboardingCompleted: true,
  disclaimerAcceptedAt: '2026-06-01T10:00:00.000Z',
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
}

const MOCK_SESSION = {
  id: 'session-1',
  userId: 'user-1',
  sessionDate: '2026-06-15',
  durationMinutes: 30,
  context: 'beach' as const,
  uvIndexManual: 7,
  protectionLevel: 'medium' as const,
  sensationAfter: 'normal' as const,
  notes: null,
  createdAt: '2026-06-15T11:00:00.000Z',
  updatedAt: '2026-06-15T11:00:00.000Z',
}

const MOCK_PLAN = {
  id: 'plan-1',
  userId: 'user-1',
  goalLevel: 'golden' as const,
  currentLevel: 'natural' as const,
  startDate: '2026-06-01',
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetProfile.mockResolvedValue(MOCK_PROFILE)
  mockGetSessions.mockResolvedValue([MOCK_SESSION])
  mockGetPlan.mockResolvedValue(MOCK_PLAN)
})

describe('buildUserDataExport', () => {
  it('calls each repository with the correct userId', async () => {
    await buildUserDataExport('user-1')
    expect(mockGetProfile).toHaveBeenCalledWith('user-1')
    expect(mockGetSessions).toHaveBeenCalledWith('user-1')
    expect(mockGetPlan).toHaveBeenCalledWith('user-1')
  })

  it('includes profile, sessions and plan in the export', async () => {
    const result = await buildUserDataExport('user-1')
    expect(result.profile).toEqual(MOCK_PROFILE)
    expect(result.sessions).toEqual([MOCK_SESSION])
    expect(result.plan).toEqual(MOCK_PLAN)
  })

  it('exportedAt is a valid ISO timestamp string', async () => {
    const result = await buildUserDataExport('user-1')
    expect(typeof result.exportedAt).toBe('string')
    expect(() => new Date(result.exportedAt)).not.toThrow()
    expect(new Date(result.exportedAt).toISOString()).toBe(result.exportedAt)
  })

  it('handles null profile gracefully', async () => {
    mockGetProfile.mockResolvedValueOnce(null)
    const result = await buildUserDataExport('user-1')
    expect(result.profile).toBeNull()
    expect(result.sessions).toBeDefined()
    expect(result.plan).toBeDefined()
  })

  it('handles null plan gracefully', async () => {
    mockGetPlan.mockResolvedValueOnce(null)
    const result = await buildUserDataExport('user-1')
    expect(result.plan).toBeNull()
    expect(result.profile).toBeDefined()
    expect(result.sessions).toBeDefined()
  })

  it('handles empty sessions array gracefully', async () => {
    mockGetSessions.mockResolvedValueOnce([])
    const result = await buildUserDataExport('user-1')
    expect(result.sessions).toEqual([])
  })

  it('propagates profile repository errors', async () => {
    mockGetProfile.mockRejectedValueOnce(
      new Error('La sesión ha caducado. Vuelve a iniciar sesión.')
    )
    await expect(buildUserDataExport('user-1')).rejects.toThrow('La sesión ha caducado.')
  })

  it('propagates sessions repository errors', async () => {
    mockGetSessions.mockRejectedValueOnce(
      new Error('No se ha podido conectar. Inténtalo de nuevo.')
    )
    await expect(buildUserDataExport('user-1')).rejects.toThrow('No se ha podido conectar.')
  })

  it('propagates plan repository errors', async () => {
    mockGetPlan.mockRejectedValueOnce(
      new Error('No se ha podido guardar tu plan. Inténtalo de nuevo.')
    )
    await expect(buildUserDataExport('user-1')).rejects.toThrow('No se ha podido guardar tu plan.')
  })
})
