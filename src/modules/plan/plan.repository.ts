import { supabase } from '@/lib/supabase'
import { mapPlanInputToUpsert, mapTanningPlanRowToPlan } from './plan.mapper'
import type { TanningPlan, TanningPlanInput } from './plan.types'

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
  return 'No se ha podido guardar tu plan. Inténtalo de nuevo.'
}

export async function getTanningPlanByUserId(userId: string): Promise<TanningPlan | null> {
  const { data, error } = await supabase
    .from('tanning_plans')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(mapRepositoryError(error))
  if (!data) return null
  return mapTanningPlanRowToPlan(data)
}

export async function upsertTanningPlan(
  userId: string,
  input: TanningPlanInput
): Promise<TanningPlan> {
  const { data, error } = await supabase
    .from('tanning_plans')
    .upsert(mapPlanInputToUpsert(userId, input), { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw new Error(mapRepositoryError(error))
  if (!data) throw new Error('No se ha podido guardar tu plan. Inténtalo de nuevo.')
  return mapTanningPlanRowToPlan(data)
}

export async function deleteTanningPlan(userId: string): Promise<void> {
  const { error } = await supabase.from('tanning_plans').delete().eq('user_id', userId)
  if (error) throw new Error(mapRepositoryError(error))
}
