export type AuthUser = {
  id: string
  email: string | null
}

export type AuthSessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthState = {
  status: AuthSessionStatus
  user: AuthUser | null
  error: string | null
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
  confirmPassword: string
}
