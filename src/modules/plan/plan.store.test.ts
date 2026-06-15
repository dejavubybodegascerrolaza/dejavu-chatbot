import { usePlanStore } from './plan.store'

describe('usePlanStore', () => {
  beforeEach(() => {
    usePlanStore.setState({ goalLevel: null, currentLevel: 'natural' })
  })

  it('starts with no goal and a natural current level', () => {
    const state = usePlanStore.getState()
    expect(state.goalLevel).toBeNull()
    expect(state.currentLevel).toBe('natural')
  })

  it('sets the goal level', () => {
    usePlanStore.getState().setGoal('bronze')
    expect(usePlanStore.getState().goalLevel).toBe('bronze')
  })

  it('sets the current level', () => {
    usePlanStore.getState().setCurrentLevel('golden')
    expect(usePlanStore.getState().currentLevel).toBe('golden')
  })

  it('clears back to defaults', () => {
    usePlanStore.setState({ goalLevel: 'deep_bronze', currentLevel: 'bronze' })
    usePlanStore.getState().clearPlan()
    const state = usePlanStore.getState()
    expect(state.goalLevel).toBeNull()
    expect(state.currentLevel).toBe('natural')
  })
})
