import * as PlanRepository from './plan.repository'
import type { TanningPlan, TanningPlanInput } from './plan.types'

export async function loadTanningPlan(userId: string): Promise<TanningPlan | null> {
  return PlanRepository.getTanningPlanByUserId(userId)
}

export async function saveTanningPlan(
  userId: string,
  input: TanningPlanInput
): Promise<TanningPlan> {
  return PlanRepository.upsertTanningPlan(userId, input)
}

export async function deleteTanningPlan(userId: string): Promise<void> {
  return PlanRepository.deleteTanningPlan(userId)
}
