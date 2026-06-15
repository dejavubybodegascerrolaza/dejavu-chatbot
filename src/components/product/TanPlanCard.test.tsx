import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { TanPlanCard } from './TanPlanCard'
import type { TanPlanResult } from '@/modules/plan'

const PLAN: TanPlanResult = {
  status: 'ok',
  goalLevel: 'bronze',
  reachableLevel: 'bronze',
  etaDate: '2026-07-12',
  totalDays: 27,
  sessionDays: 19,
  dailySafeMinutes: 22,
  milestones: [],
}

describe('TanPlanCard', () => {
  it('invites the user to create a plan when there is none', () => {
    render(<TanPlanCard plan={null} onPress={() => {}} />)
    expect(screen.getByText('Crea tu plan de bronceado')).toBeTruthy()
  })

  it('renders the goal and ETA when a plan exists', () => {
    render(<TanPlanCard plan={PLAN} onPress={() => {}} />)
    expect(screen.getByText('Meta: Bronceado')).toBeTruthy()
    expect(screen.getByText('12/07/2026')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    render(<TanPlanCard plan={PLAN} onPress={onPress} />)
    fireEvent.press(screen.getByLabelText('Ver mi plan'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('shows a congratulatory message when the goal is already reached', () => {
    render(<TanPlanCard plan={{ ...PLAN, status: 'goal_below_current' }} onPress={() => {}} />)
    expect(screen.getByText(/Ya has alcanzado este tono/)).toBeTruthy()
  })
})
