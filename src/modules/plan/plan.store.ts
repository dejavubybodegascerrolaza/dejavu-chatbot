import { create } from 'zustand'
import type { TanLevel } from './plan.types'

/**
 * Holds the user's chosen tanning goal so Home and the Plan screen stay in sync.
 * The plan itself is derived from this + the profile via generateTanPlan; only
 * the user's choices live here. Persistence to Supabase is a future step.
 */
type PlanStore = {
  goalLevel: TanLevel | null
  currentLevel: TanLevel
  setGoal: (level: TanLevel) => void
  setCurrentLevel: (level: TanLevel) => void
  clearPlan: () => void
}

export const usePlanStore = create<PlanStore>((set) => ({
  goalLevel: null,
  currentLevel: 'natural',
  setGoal: (level) => set({ goalLevel: level }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
  clearPlan: () => set({ goalLevel: null, currentLevel: 'natural' }),
}))
