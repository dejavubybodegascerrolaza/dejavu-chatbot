import { loadTodaySessions, loadSessions, createExposureSession } from './session.service'
import * as SessionRepository from './session.repository'

jest.mock('./session.repository', () => ({
  getSessionsByUserId: jest.fn(),
  getTodaySessionsByUserId: jest.fn(),
  createSession: jest.fn(),
}))

const mockGetSessions = SessionRepository.getSessionsByUserId as jest.MockedFunction<
  typeof SessionRepository.getSessionsByUserId
>
const mockGetToday = SessionRepository.getTodaySessionsByUserId as jest.MockedFunction<
  typeof SessionRepository.getTodaySessionsByUserId
>
const mockCreate = SessionRepository.createSession as jest.MockedFunction<
  typeof SessionRepository.createSession
>

const mockSession = {
  id: 'session-uuid-1',
  userId: 'user-uuid-1',
  sessionDate: '2026-05-25',
  durationMinutes: 45,
  context: 'beach' as const,
  uvIndexManual: null,
  protectionLevel: 'medium' as const,
  sensationAfter: 'normal' as const,
  notes: null,
  createdAt: '2026-05-25T10:00:00.000Z',
  updatedAt: '2026-05-25T10:00:00.000Z',
}

const validInput = {
  sessionDate: '2026-05-25',
  durationMinutes: 45,
  context: 'beach' as const,
  uvIndexManual: null,
  protectionLevel: 'medium' as const,
  sensationAfter: 'normal' as const,
  notes: null,
}

beforeEach(() => jest.clearAllMocks())

describe('loadTodaySessions', () => {
  it('delegates to repository with userId and today', async () => {
    mockGetToday.mockResolvedValueOnce([mockSession])
    const result = await loadTodaySessions('user-uuid-1', '2026-05-25')
    expect(result).toEqual([mockSession])
    expect(mockGetToday).toHaveBeenCalledWith('user-uuid-1', '2026-05-25')
  })

  it('returns empty array when no sessions', async () => {
    mockGetToday.mockResolvedValueOnce([])
    const result = await loadTodaySessions('user-uuid-1', '2026-05-25')
    expect(result).toEqual([])
  })
})

describe('loadSessions', () => {
  it('delegates to repository with userId', async () => {
    mockGetSessions.mockResolvedValueOnce([mockSession])
    const result = await loadSessions('user-uuid-1')
    expect(result).toEqual([mockSession])
    expect(mockGetSessions).toHaveBeenCalledWith('user-uuid-1')
  })
})

describe('createExposureSession', () => {
  it('validates and creates session', async () => {
    mockCreate.mockResolvedValueOnce(mockSession)
    const result = await createExposureSession('user-uuid-1', validInput)
    expect(result).toEqual(mockSession)
    expect(mockCreate).toHaveBeenCalledWith('user-uuid-1', validInput)
  })

  it('normalizes empty string notes to null', async () => {
    mockCreate.mockResolvedValueOnce(mockSession)
    await createExposureSession('user-uuid-1', { ...validInput, notes: '' })
    expect(mockCreate).toHaveBeenCalledWith('user-uuid-1', expect.objectContaining({ notes: null }))
  })

  it('preserves non-empty notes', async () => {
    mockCreate.mockResolvedValueOnce({ ...mockSession, notes: 'Nice session' })
    await createExposureSession('user-uuid-1', { ...validInput, notes: 'Nice session' })
    expect(mockCreate).toHaveBeenCalledWith(
      'user-uuid-1',
      expect.objectContaining({ notes: 'Nice session' })
    )
  })

  it('rejects duration 0', async () => {
    await expect(
      createExposureSession('user-uuid-1', { ...validInput, durationMinutes: 0 })
    ).rejects.toThrow()
  })

  it('rejects duration 301', async () => {
    await expect(
      createExposureSession('user-uuid-1', { ...validInput, durationMinutes: 301 })
    ).rejects.toThrow()
  })

  it('rejects uvIndexManual 12', async () => {
    await expect(
      createExposureSession('user-uuid-1', { ...validInput, uvIndexManual: 12 })
    ).rejects.toThrow()
  })
})
