import { supabase } from '@/lib/supabase'
import type { DataDeletionRequest } from './privacy.types'
import { mapDeletionRequestRowToRequest } from './privacy.mapper'

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
  return 'No se ha podido registrar la solicitud. Inténtalo de nuevo.'
}

export async function createDeletionRequest(userId: string): Promise<DataDeletionRequest> {
  const { data, error } = await supabase
    .from('deletion_requests')
    .insert({ user_id: userId, status: 'pending' })
    .select()
    .single()

  if (error) throw new Error(mapRepositoryError(error))
  if (!data) throw new Error('No se ha podido registrar la solicitud. Inténtalo de nuevo.')
  return mapDeletionRequestRowToRequest(data)
}

export async function getDeletionRequestsByUserId(userId: string): Promise<DataDeletionRequest[]> {
  const { data, error } = await supabase
    .from('deletion_requests')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })

  if (error) throw new Error(mapRepositoryError(error))
  return (data ?? []).map(mapDeletionRequestRowToRequest)
}
