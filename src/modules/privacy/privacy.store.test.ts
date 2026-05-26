import { act } from '@testing-library/react-native'
import { usePrivacyStore } from './privacy.store'
import * as PrivacyService from './privacy.service'

jest.mock('./privacy.service', () => ({
  requestDataDeletion: jest.fn(),
}))

const mockRequestDataDeletion = PrivacyService.requestDataDeletion as jest.MockedFunction<
  typeof PrivacyService.requestDataDeletion
>

const mockRequest = {
  id: 'req-uuid-1',
  userId: 'user-uuid-1',
  requestedAt: '2026-05-26T10:00:00.000Z',
  status: 'pending' as const,
  processedAt: null,
}

beforeEach(() => {
  usePrivacyStore.setState({ status: 'idle', request: null, error: null })
  jest.clearAllMocks()
})

describe('usePrivacyStore — requestDeletion', () => {
  it('sets status success and stores request on success', async () => {
    mockRequestDataDeletion.mockResolvedValueOnce(mockRequest)
    let result: boolean = false
    await act(async () => {
      result = await usePrivacyStore.getState().requestDeletion('user-uuid-1')
    })
    const state = usePrivacyStore.getState()
    expect(result).toBe(true)
    expect(state.status).toBe('success')
    expect(state.request).toEqual(mockRequest)
    expect(state.error).toBeNull()
  })

  it('sets status error on failure and returns false', async () => {
    mockRequestDataDeletion.mockRejectedValueOnce(
      new Error('No se ha podido registrar la solicitud. Inténtalo de nuevo.')
    )
    let result: boolean = true
    await act(async () => {
      result = await usePrivacyStore.getState().requestDeletion('user-uuid-1')
    })
    const state = usePrivacyStore.getState()
    expect(result).toBe(false)
    expect(state.status).toBe('error')
    expect(state.error).toBe('No se ha podido registrar la solicitud. Inténtalo de nuevo.')
  })

  it('guards against double-submit when already submitting', async () => {
    usePrivacyStore.setState({ status: 'submitting' })
    let result: boolean = true
    await act(async () => {
      result = await usePrivacyStore.getState().requestDeletion('user-uuid-1')
    })
    expect(result).toBe(false)
    expect(mockRequestDataDeletion).not.toHaveBeenCalled()
  })

  it('uses generic error message for non-Error throws', async () => {
    mockRequestDataDeletion.mockRejectedValueOnce('string error')
    await act(async () => {
      await usePrivacyStore.getState().requestDeletion('user-uuid-1')
    })
    expect(usePrivacyStore.getState().error).toBe(
      'No se ha podido registrar la solicitud. Inténtalo de nuevo.'
    )
  })
})

describe('usePrivacyStore — clearPrivacyState', () => {
  it('resets all state to idle', () => {
    usePrivacyStore.setState({ status: 'success', request: mockRequest, error: null })
    usePrivacyStore.getState().clearPrivacyState()
    const state = usePrivacyStore.getState()
    expect(state.status).toBe('idle')
    expect(state.request).toBeNull()
    expect(state.error).toBeNull()
  })
})

describe('usePrivacyStore — clearError', () => {
  it('clears error field only', () => {
    usePrivacyStore.setState({ status: 'error', error: 'some error' })
    usePrivacyStore.getState().clearError()
    const state = usePrivacyStore.getState()
    expect(state.error).toBeNull()
    expect(state.status).toBe('error')
  })
})
