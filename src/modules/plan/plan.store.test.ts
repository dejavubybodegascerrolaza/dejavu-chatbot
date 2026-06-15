jest.mock('./plan.service', () => ({
  loadTanningPlan: jest.fn(),
  saveTanningPlan: jest.fn(),
  deleteTanningPlan: jest.fn(),
}))

import { usePlanStore } from './plan.store'
import * as PlanService from './plan.service'
import type { TanningPlan } from './plan.types'

const mockLoad = PlanService.loadTanningPlan as jest.MockedFunction<
  typeof PlanService.loadTanningPlan
>
const mockSave = PlanService.saveTanningPlan as jest.MockedFunction<
  typeof PlanService.saveTanningPlan
>
const mockDelete = PlanService.deleteTanningPlan as jest.MockedFunction<
  typeof PlanService.deleteTanningPlan
>

const PLAN: TanningPlan = {
  id: 'plan-1',
  userId: 'user-1',
  goalLevel: 'bronze',
  currentLevel: 'natural',
  startDate: '2026-06-15',
  createdAt: '2026-06-15T10:00:00.000Z',
  updatedAt: '2026-06-15T10:00:00.000Z',
}

describe('usePlanStore', () => {
  beforeEach(() => {
    usePlanStore.getState().reset()
    jest.clearAllMocks()
  })

  it('starts with no goal and a natural current level', () => {
    const state = usePlanStore.getState()
    expect(state.goalLevel).toBeNull()
    expect(state.currentLevel).toBe('natural')
    expect(state.status).toBe('idle')
  })

  it('loads a persisted plan', async () => {
    mockLoad.mockResolvedValue(PLAN)
    await usePlanStore.getState().loadPlan('user-1')
    const state = usePlanStore.getState()
    expect(state.status).toBe('ready')
    expect(state.goalLevel).toBe('bronze')
    expect(state.userId).toBe('user-1')
  })

  it('stays ready with no goal when there is no persisted plan', async () => {
    mockLoad.mockResolvedValue(null)
    await usePlanStore.getState().loadPlan('user-1')
    const state = usePlanStore.getState()
    expect(state.status).toBe('ready')
    expect(state.goalLevel).toBeNull()
  })

  it('records an error when loading fails', async () => {
    mockLoad.mockRejectedValue(new Error('boom'))
    await usePlanStore.getState().loadPlan('user-1')
    expect(usePlanStore.getState().status).toBe('error')
  })

  it('sets the goal optimistically and persists it', async () => {
    mockLoad.mockResolvedValue(null)
    mockSave.mockResolvedValue(PLAN)
    const save = mockSave
    await usePlanStore.getState().loadPlan('user-1')

    await usePlanStore.getState().setGoal('bronze')
    expect(usePlanStore.getState().goalLevel).toBe('bronze')
    expect(save).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ goalLevel: 'bronze', currentLevel: 'natural' })
    )
  })

  it('does not persist when there is no user', async () => {
    const save = mockSave
    await usePlanStore.getState().setGoal('golden')
    expect(usePlanStore.getState().goalLevel).toBe('golden')
    expect(save).not.toHaveBeenCalled()
  })

  it('clears and deletes the plan', async () => {
    mockLoad.mockResolvedValue(PLAN)
    mockDelete.mockResolvedValue()
    const del = mockDelete
    await usePlanStore.getState().loadPlan('user-1')

    await usePlanStore.getState().clearPlan()
    expect(usePlanStore.getState().goalLevel).toBeNull()
    expect(del).toHaveBeenCalledWith('user-1')
  })

  it('reset returns to initial state', () => {
    usePlanStore.setState({ goalLevel: 'deep_bronze', userId: 'user-1', status: 'ready' })
    usePlanStore.getState().reset()
    const state = usePlanStore.getState()
    expect(state.goalLevel).toBeNull()
    expect(state.userId).toBeNull()
    expect(state.status).toBe('idle')
  })
})
