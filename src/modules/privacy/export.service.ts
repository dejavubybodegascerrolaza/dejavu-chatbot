import * as SessionRepository from '@/modules/sessions/session.repository'
import * as ProfileRepository from '@/modules/profile/profile.repository'
import * as PlanRepository from '@/modules/plan/plan.repository'
import type { ExposureSession } from '@/modules/sessions/session.types'
import type { Profile } from '@/modules/profile/profile.types'
import type { TanningPlan } from '@/modules/plan/plan.types'

export type UserDataExport = {
  exportedAt: string
  profile: Profile | null
  sessions: ExposureSession[]
  plan: TanningPlan | null
}

/**
 * Fetches all user data from the three core tables and returns it as a
 * structured object suitable for serialisation. Does not include deletion
 * requests, auth credentials, or notification preferences.
 * All queries run under the user's JWT — RLS enforces data isolation.
 */
export async function buildUserDataExport(userId: string): Promise<UserDataExport> {
  const [profile, sessions, plan] = await Promise.all([
    ProfileRepository.getProfileByUserId(userId),
    SessionRepository.getSessionsByUserId(userId),
    PlanRepository.getTanningPlanByUserId(userId),
  ])
  return {
    exportedAt: new Date().toISOString(),
    profile,
    sessions,
    plan,
  }
}
