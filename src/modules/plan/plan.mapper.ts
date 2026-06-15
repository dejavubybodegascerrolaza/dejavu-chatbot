import type { Inserts, Tables } from '@/types/database.types'
import type { TanLevel, TanningPlan, TanningPlanInput } from './plan.types'

type TanningPlanRow = Tables<'tanning_plans'>

export function mapTanningPlanRowToPlan(row: TanningPlanRow): TanningPlan {
  return {
    id: row.id,
    userId: row.user_id,
    goalLevel: row.goal_level as TanLevel,
    currentLevel: row.current_level as TanLevel,
    startDate: row.start_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapPlanInputToUpsert(
  userId: string,
  input: TanningPlanInput
): Inserts<'tanning_plans'> {
  return {
    user_id: userId,
    goal_level: input.goalLevel,
    current_level: input.currentLevel,
    start_date: input.startDate,
  }
}
