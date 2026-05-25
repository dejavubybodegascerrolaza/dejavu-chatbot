import { supabase } from '@/lib/supabase'
import type { ExposureSession } from './session.types'
import type { CreateExposureSessionInput } from './session.schema'
import { mapSessionRowToSession, mapCreateSessionInputToInsert } from './session.mapper'

function mapRepositoryError(error: unknown): string {
  const msg = (
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error)
  ).toLowerCase()

  if (msg.includes('jwt') || msg.includes('auth') || msg.includes('token')) {
    return 'La sesión ha caducado. Vuelve a iniciar sesión.'
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    return 'No se ha podido conectar. Inténtalo de nuevo.'
  }
  return 'No se ha podido guardar la sesión. Inténtalo de nuevo.'
}

export async function getSessionsByUserId(userId: string): Promise<ExposureSession[]> {
  const { data, error } = await supabase
    .from('exposure_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(mapRepositoryError(error))
  return (data ?? []).map(mapSessionRowToSession)
}

export async function getTodaySessionsByUserId(
  userId: string,
  today: string
): Promise<ExposureSession[]> {
  const { data, error } = await supabase
    .from('exposure_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_date', today)
    .order('created_at', { ascending: false })

  if (error) throw new Error(mapRepositoryError(error))
  return (data ?? []).map(mapSessionRowToSession)
}

export async function createSession(
  userId: string,
  input: CreateExposureSessionInput
): Promise<ExposureSession> {
  const { data, error } = await supabase
    .from('exposure_sessions')
    .insert(mapCreateSessionInputToInsert(userId, input))
    .select()
    .single()

  if (error) throw new Error(mapRepositoryError(error))
  if (!data) throw new Error('No se ha podido guardar la sesión. Inténtalo de nuevo.')
  return mapSessionRowToSession(data)
}
