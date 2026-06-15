import { mapPlanInputToUpsert, mapTanningPlanRowToPlan } from './plan.mapper'

const ROW = {
  id: 'plan-1',
  user_id: 'user-1',
  goal_level: 'bronze',
  current_level: 'golden',
  start_date: '2026-06-15',
  created_at: '2026-06-15T10:00:00.000Z',
  updated_at: '2026-06-15T11:00:00.000Z',
}

describe('mapTanningPlanRowToPlan', () => {
  it('maps a row to the domain plan', () => {
    expect(mapTanningPlanRowToPlan(ROW)).toEqual({
      id: 'plan-1',
      userId: 'user-1',
      goalLevel: 'bronze',
      currentLevel: 'golden',
      startDate: '2026-06-15',
      createdAt: '2026-06-15T10:00:00.000Z',
      updatedAt: '2026-06-15T11:00:00.000Z',
    })
  })
})

describe('mapPlanInputToUpsert', () => {
  it('maps domain input to a snake_case upsert row', () => {
    expect(
      mapPlanInputToUpsert('user-1', {
        goalLevel: 'bronze',
        currentLevel: 'natural',
        startDate: '2026-06-15',
      })
    ).toEqual({
      user_id: 'user-1',
      goal_level: 'bronze',
      current_level: 'natural',
      start_date: '2026-06-15',
    })
  })
})
