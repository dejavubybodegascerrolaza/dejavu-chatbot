import { signIn, signUp, signOut, mapAuthError } from './auth.service'
import { supabase } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}))

const mockSignIn = supabase.auth.signInWithPassword as jest.MockedFunction<
  typeof supabase.auth.signInWithPassword
>
const mockSignUp = supabase.auth.signUp as jest.MockedFunction<typeof supabase.auth.signUp>
const mockSignOut = supabase.auth.signOut as jest.MockedFunction<typeof supabase.auth.signOut>

const mockUser = { id: 'user-uuid-1', email: 'user@example.com' }

describe('mapAuthError', () => {
  it('maps invalid credentials error', () => {
    expect(mapAuthError(new Error('Invalid login credentials'))).toBe(
      'Email o contraseña incorrectos.'
    )
  })

  it('maps email not confirmed error', () => {
    expect(mapAuthError(new Error('Email not confirmed'))).toBe(
      'Revisa tu email para confirmar la cuenta antes de iniciar sesión.'
    )
  })

  it('maps user already registered error', () => {
    expect(mapAuthError(new Error('User already registered'))).toBe(
      'Ya existe una cuenta con este email.'
    )
  })

  it('maps network errors', () => {
    expect(mapAuthError(new Error('Failed to fetch'))).toBe(
      'No se ha podido conectar. Inténtalo de nuevo.'
    )
  })

  it('returns generic message for unknown errors', () => {
    expect(mapAuthError(new Error('some unknown error xyz'))).toBe(
      'No se ha podido completar la acción. Inténtalo de nuevo.'
    )
  })

  it('handles non-Error values', () => {
    expect(mapAuthError('string error')).toBe(
      'No se ha podido completar la acción. Inténtalo de nuevo.'
    )
  })
})

describe('signIn', () => {
  it('returns AuthUser on success', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { user: mockUser, session: { access_token: 'tok' } },
      error: null,
    } as never)
    const result = await signIn({ email: 'user@example.com', password: 'password123' })
    expect(result).toEqual({ id: mockUser.id, email: mockUser.email })
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    })
  })

  it('throws mapped error on auth failure', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: {
        message: 'Invalid login credentials',
        __isAuthError: true,
        status: 400,
        name: 'AuthApiError',
      },
    } as never)
    await expect(signIn({ email: 'user@example.com', password: 'wrong' })).rejects.toThrow(
      'Email o contraseña incorrectos.'
    )
  })
})

describe('signUp', () => {
  it('returns user and emailConfirmationRequired=false when session is present', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: mockUser, session: { access_token: 'tok' } },
      error: null,
    } as never)
    const result = await signUp({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.user).toEqual({ id: mockUser.id, email: mockUser.email })
    expect(result.emailConfirmationRequired).toBe(false)
  })

  it('returns emailConfirmationRequired=true when session is null', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: mockUser, session: null },
      error: null,
    } as never)
    const result = await signUp({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.emailConfirmationRequired).toBe(true)
  })

  it('throws mapped error on failure', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: {
        message: 'User already registered',
        __isAuthError: true,
        status: 422,
        name: 'AuthApiError',
      },
    } as never)
    await expect(
      signUp({ email: 'user@example.com', password: 'password123', confirmPassword: 'password123' })
    ).rejects.toThrow('Ya existe una cuenta con este email.')
  })
})

describe('signOut', () => {
  it('calls supabase signOut', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })
    await expect(signOut()).resolves.toBeUndefined()
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('throws mapped error on failure', async () => {
    mockSignOut.mockResolvedValueOnce({
      error: {
        message: 'Failed to fetch',
        __isAuthError: true,
        status: 0,
        name: 'AuthApiError',
      } as never,
    })
    await expect(signOut()).rejects.toThrow('No se ha podido conectar. Inténtalo de nuevo.')
  })
})
