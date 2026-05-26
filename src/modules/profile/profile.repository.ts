import { supabase } from '@/lib/supabase'
import type { Profile } from './profile.types'
import type { ProfileSetupInput, ProfileUpdateInput } from './profile.schema'
import {
  mapProfileRowToProfile,
  mapSetupInputToInsert,
  mapSetupInputToUpdate,
  mapUpdateInputToUpdate,
} from './profile.mapper'

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
  return 'No se ha podido guardar tu perfil. Inténtalo de nuevo.'
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (error) throw new Error(mapRepositoryError(error))
  if (!data) return null
  return mapProfileRowToProfile(data)
}

export async function createProfile(userId: string, input: ProfileSetupInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(mapSetupInputToInsert(userId, input))
    .select()
    .single()

  if (error) throw new Error(mapRepositoryError(error))
  if (!data) throw new Error('No se ha podido guardar tu perfil. Inténtalo de nuevo.')
  return mapProfileRowToProfile(data)
}

export async function updateProfile(userId: string, input: ProfileSetupInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(mapSetupInputToUpdate(input))
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new Error(mapRepositoryError(error))
  if (!data) throw new Error('No se ha podido actualizar tu perfil. Inténtalo de nuevo.')
  return mapProfileRowToProfile(data)
}

export async function updateProfileSettings(
  userId: string,
  input: ProfileUpdateInput
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(mapUpdateInputToUpdate(input))
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new Error(mapRepositoryError(error))
  if (!data) throw new Error('No se han podido guardar los cambios. Inténtalo de nuevo.')
  return mapProfileRowToProfile(data)
}
