import {
  mapProfileRowToProfile,
  mapSetupInputToInsert,
  mapSetupInputToUpdate,
} from './profile.mapper'
import type { Tables } from '@/types/database.types'

const mockRow: Tables<'profiles'> = {
  id: 'user-uuid-1',
  alias: 'Alex',
  main_goal: 'gradual_bronze',
  sun_sensitivity: 'medium',
  skin_type: 3,
  onboarding_completed: true,
  disclaimer_accepted_at: '2026-05-25T10:00:00.000Z',
  created_at: '2026-05-25T09:00:00.000Z',
  updated_at: '2026-05-25T10:00:00.000Z',
}

describe('mapProfileRowToProfile', () => {
  it('maps snake_case row to camelCase Profile', () => {
    const profile = mapProfileRowToProfile(mockRow)
    expect(profile.id).toBe('user-uuid-1')
    expect(profile.alias).toBe('Alex')
    expect(profile.mainGoal).toBe('gradual_bronze')
    expect(profile.sunSensitivity).toBe('medium')
    expect(profile.skinType).toBe(3)
    expect(profile.onboardingCompleted).toBe(true)
    expect(profile.disclaimerAcceptedAt).toBe('2026-05-25T10:00:00.000Z')
    expect(profile.createdAt).toBe('2026-05-25T09:00:00.000Z')
    expect(profile.updatedAt).toBe('2026-05-25T10:00:00.000Z')
  })

  it('maps null skin_type to null skinType', () => {
    const row = { ...mockRow, skin_type: null }
    const profile = mapProfileRowToProfile(row)
    expect(profile.skinType).toBeNull()
  })

  it('maps null disclaimer_accepted_at to null disclaimerAcceptedAt', () => {
    const row = { ...mockRow, disclaimer_accepted_at: null, onboarding_completed: false }
    const profile = mapProfileRowToProfile(row)
    expect(profile.disclaimerAcceptedAt).toBeNull()
    expect(profile.onboardingCompleted).toBe(false)
  })
})

describe('mapSetupInputToInsert', () => {
  const input = {
    alias: 'Alex',
    mainGoal: 'gradual_bronze' as const,
    sunSensitivity: 'medium' as const,
    skinType: 3 as const,
    disclaimerAcceptedAt: '2026-05-25T10:00:00.000Z',
  }

  it('maps camelCase input to snake_case insert object', () => {
    const insert = mapSetupInputToInsert('user-uuid-1', input)
    expect(insert.id).toBe('user-uuid-1')
    expect(insert.alias).toBe('Alex')
    expect(insert.main_goal).toBe('gradual_bronze')
    expect(insert.sun_sensitivity).toBe('medium')
    expect(insert.skin_type).toBe(3)
    expect(insert.onboarding_completed).toBe(true)
    expect(insert.disclaimer_accepted_at).toBe('2026-05-25T10:00:00.000Z')
  })

  it('maps null skinType to null skin_type', () => {
    const insert = mapSetupInputToInsert('user-uuid-1', { ...input, skinType: null })
    expect(insert.skin_type).toBeNull()
  })

  it('maps undefined skinType to null skin_type', () => {
    const insert = mapSetupInputToInsert('user-uuid-1', { ...input, skinType: undefined })
    expect(insert.skin_type).toBeNull()
  })
})

describe('mapSetupInputToUpdate', () => {
  const input = {
    alias: 'Alex',
    mainGoal: 'track_sessions' as const,
    sunSensitivity: 'high' as const,
    skinType: null,
    disclaimerAcceptedAt: '2026-05-25T10:00:00.000Z',
  }

  it('maps camelCase input to snake_case update object', () => {
    const update = mapSetupInputToUpdate(input)
    expect(update.alias).toBe('Alex')
    expect(update.main_goal).toBe('track_sessions')
    expect(update.sun_sensitivity).toBe('high')
    expect(update.skin_type).toBeNull()
    expect(update.onboarding_completed).toBe(true)
    expect(update.disclaimer_accepted_at).toBe('2026-05-25T10:00:00.000Z')
    // no id in update
    expect('id' in update).toBe(false)
  })
})
