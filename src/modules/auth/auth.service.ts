import { supabase } from '@/lib/supabase'
import type { AuthUser, LoginInput, RegisterInput } from './auth.types'

export function mapAuthError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error)
  const msg = raw.toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Email o contraseña incorrectos.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Revisa tu email para confirmar la cuenta antes de iniciar sesión.'
  }
  if (msg.includes('user already registered') || msg.includes('email_exists')) {
    return 'Ya existe una cuenta con este email.'
  }
  if (msg.includes('weak_password') || msg.includes('password should be')) {
    return 'La contraseña debe tener al menos 8 caracteres.'
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    return 'No se ha podido conectar. Inténtalo de nuevo.'
  }

  return 'No se ha podido completar la acción. Inténtalo de nuevo.'
}

function toAuthUser(user: { id: string; email?: string | null }): AuthUser {
  return { id: user.id, email: user.email ?? null }
}

export async function signIn(input: LoginInput): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })
  if (error) throw new Error(mapAuthError(error))
  if (!data.user) throw new Error('No se ha podido completar la acción. Inténtalo de nuevo.')
  return toAuthUser(data.user)
}

export type SignUpResult = {
  user: AuthUser | null
  emailConfirmationRequired: boolean
}

export async function signUp(input: RegisterInput): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  })
  if (error) throw new Error(mapAuthError(error))

  // session is null when email confirmation is required
  const emailConfirmationRequired = data.user !== null && data.session === null

  return {
    user: data.user ? toAuthUser(data.user) : null,
    emailConfirmationRequired,
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(mapAuthError(error))
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  return toAuthUser(data.user)
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? toAuthUser(session.user) : null)
  })
  return () => data.subscription.unsubscribe()
}
