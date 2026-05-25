import { act } from '@testing-library/react-native'
import { useAuthStore } from './auth.store'
import * as AuthService from './auth.service'

jest.mock('./auth.service', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChange: jest.fn(() => () => undefined),
}))

const mockSignIn = AuthService.signIn as jest.MockedFunction<typeof AuthService.signIn>
const mockSignUp = AuthService.signUp as jest.MockedFunction<typeof AuthService.signUp>
const mockSignOut = AuthService.signOut as jest.MockedFunction<typeof AuthService.signOut>

const mockUser = { id: 'user-uuid-1', email: 'user@example.com' }

beforeEach(() => {
  useAuthStore.setState({
    status: 'unauthenticated',
    user: null,
    error: null,
    isSubmitting: false,
    pendingEmailConfirmation: false,
  })
  jest.clearAllMocks()
})

describe('useAuthStore — initial state', () => {
  it('has correct initial shape after reset', () => {
    const state = useAuthStore.getState()
    expect(state.status).toBe('unauthenticated')
    expect(state.user).toBeNull()
    expect(state.error).toBeNull()
    expect(state.isSubmitting).toBe(false)
  })
})

describe('useAuthStore — login', () => {
  it('sets authenticated + user on success', async () => {
    mockSignIn.mockResolvedValueOnce(mockUser)
    await act(async () => {
      await useAuthStore.getState().login({ email: 'user@example.com', password: 'password123' })
    })
    const state = useAuthStore.getState()
    expect(state.status).toBe('authenticated')
    expect(state.user).toEqual(mockUser)
    expect(state.error).toBeNull()
    expect(state.isSubmitting).toBe(false)
  })

  it('sets error message on failure', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Email o contraseña incorrectos.'))
    await act(async () => {
      await useAuthStore.getState().login({ email: 'user@example.com', password: 'wrong' })
    })
    const state = useAuthStore.getState()
    expect(state.status).toBe('unauthenticated')
    expect(state.user).toBeNull()
    expect(state.error).toBe('Email o contraseña incorrectos.')
    expect(state.isSubmitting).toBe(false)
  })
})

describe('useAuthStore — register', () => {
  it('sets authenticated + user when email confirmation is not required', async () => {
    mockSignUp.mockResolvedValueOnce({ user: mockUser, emailConfirmationRequired: false })
    await act(async () => {
      await useAuthStore.getState().register({
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
    })
    const state = useAuthStore.getState()
    expect(state.status).toBe('authenticated')
    expect(state.user).toEqual(mockUser)
  })

  it('sets pendingEmailConfirmation when confirmation required', async () => {
    mockSignUp.mockResolvedValueOnce({ user: mockUser, emailConfirmationRequired: true })
    await act(async () => {
      await useAuthStore.getState().register({
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
    })
    const state = useAuthStore.getState()
    expect(state.pendingEmailConfirmation).toBe(true)
    expect(state.status).toBe('unauthenticated')
  })

  it('sets error on failure', async () => {
    mockSignUp.mockRejectedValueOnce(new Error('Ya existe una cuenta con este email.'))
    await act(async () => {
      await useAuthStore.getState().register({
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
    })
    expect(useAuthStore.getState().error).toBe('Ya existe una cuenta con este email.')
  })
})

describe('useAuthStore — logout', () => {
  it('clears user and sets unauthenticated on success', async () => {
    useAuthStore.setState({ status: 'authenticated', user: mockUser })
    mockSignOut.mockResolvedValueOnce(undefined)
    await act(async () => {
      await useAuthStore.getState().logout()
    })
    const state = useAuthStore.getState()
    expect(state.status).toBe('unauthenticated')
    expect(state.user).toBeNull()
    expect(state.error).toBeNull()
  })
})

describe('useAuthStore — clearError', () => {
  it('clears the error field', () => {
    useAuthStore.setState({ error: 'some error' })
    useAuthStore.getState().clearError()
    expect(useAuthStore.getState().error).toBeNull()
  })
})
