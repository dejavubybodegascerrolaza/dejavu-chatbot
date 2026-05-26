import { requestDataDeletion } from './privacy.service'
import * as PrivacyRepository from './privacy.repository'

jest.mock('./privacy.repository', () => ({
  createDeletionRequest: jest.fn(),
  getDeletionRequestsByUserId: jest.fn(),
}))

const mockCreateDeletionRequest = PrivacyRepository.createDeletionRequest as jest.MockedFunction<
  typeof PrivacyRepository.createDeletionRequest
>

const mockRequest = {
  id: 'req-uuid-1',
  userId: 'user-uuid-1',
  requestedAt: '2026-05-26T10:00:00.000Z',
  status: 'pending' as const,
  processedAt: null,
}

beforeEach(() => jest.clearAllMocks())

describe('requestDataDeletion', () => {
  it('delegates to createDeletionRequest and returns the result', async () => {
    mockCreateDeletionRequest.mockResolvedValueOnce(mockRequest)
    const result = await requestDataDeletion('user-uuid-1')
    expect(mockCreateDeletionRequest).toHaveBeenCalledWith('user-uuid-1')
    expect(result).toEqual(mockRequest)
  })

  it('propagates repository errors', async () => {
    mockCreateDeletionRequest.mockRejectedValueOnce(
      new Error('No se ha podido registrar la solicitud. Inténtalo de nuevo.')
    )
    await expect(requestDataDeletion('user-uuid-1')).rejects.toThrow(
      'No se ha podido registrar la solicitud. Inténtalo de nuevo.'
    )
  })
})
