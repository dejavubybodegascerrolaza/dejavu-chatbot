import { create } from 'zustand'
import { getTodayISODate } from '@/utils/date'
import * as PlanService from './plan.service'
import type { TanLevel } from './plan.types'

export type PlanStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Holds the user's tanning goal and keeps it in sync with Supabase. The plan
 * itself (ETA, milestones) is derived from these choices + the profile via
 * generateTanPlan; only the user's persisted choices live here.
 */
type PlanStore = {
  status: PlanStatus
  userId: string | null
  goalLevel: TanLevel | null
  currentLevel: TanLevel
  startDate: string | null
  error: string | null
  loadPlan: (userId: string) => Promise<void>
  setGoal: (level: TanLevel) => Promise<void>
  setCurrentLevel: (level: TanLevel) => Promise<void>
  clearPlan: () => Promise<void>
  reset: () => void
}

const INITIAL = {
  status: 'idle' as PlanStatus,
  userId: null,
  goalLevel: null,
  currentLevel: 'natural' as TanLevel,
  startDate: null,
  error: null,
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  ...INITIAL,

  loadPlan: async (userId) => {
    set({ status: 'loading', userId, error: null })
    try {
      const plan = await PlanService.loadTanningPlan(userId)
      if (plan === null) {
        set({ status: 'ready' })
      } else {
        set({
          status: 'ready',
          goalLevel: plan.goalLevel,
          currentLevel: plan.currentLevel,
          startDate: plan.startDate,
        })
      }
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'No se ha podido cargar tu plan.',
      })
    }
  },

  setGoal: async (level) => {
    set({ goalLevel: level, error: null })
    await persist(get, set)
  },

  setCurrentLevel: async (level) => {
    set({ currentLevel: level, error: null })
    await persist(get, set)
  },

  clearPlan: async () => {
    const userId = get().userId
    set({ goalLevel: null, currentLevel: 'natural', startDate: null })
    if (userId === null) return
    try {
      await PlanService.deleteTanningPlan(userId)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'No se ha podido borrar tu plan.' })
    }
  },

  reset: () => set({ ...INITIAL }),
}))

/** Persists the current goal to Supabase, with optimistic local state. */
async function persist(
  get: () => PlanStore,
  set: (partial: Partial<PlanStore>) => void
): Promise<void> {
  const { userId, goalLevel, currentLevel, startDate } = get()
  if (userId === null || goalLevel === null) return
  try {
    const plan = await PlanService.saveTanningPlan(userId, {
      goalLevel,
      currentLevel,
      startDate: startDate ?? getTodayISODate(),
    })
    set({
      goalLevel: plan.goalLevel,
      currentLevel: plan.currentLevel,
      startDate: plan.startDate,
    })
  } catch (err) {
    set({ error: err instanceof Error ? err.message : 'No se ha podido guardar tu plan.' })
  }
}
