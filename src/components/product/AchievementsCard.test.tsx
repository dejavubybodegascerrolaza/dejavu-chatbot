import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { AchievementsCard } from './AchievementsCard'
import type { GamificationSummary } from '@/modules/gamification'

const SUMMARY: GamificationSummary = {
  safetyStreak: 3,
  achievements: [],
  unlockedCount: 2,
  totalCount: 6,
  nextAchievement: { id: 'explorer', unlocked: false, current: 1, target: 3 },
}

describe('AchievementsCard', () => {
  it('renders the unlocked count and next achievement', () => {
    render(<AchievementsCard summary={SUMMARY} onPress={() => {}} />)
    expect(screen.getByText('2/6 ›')).toBeTruthy()
    expect(screen.getByText(/Próximo: Explorador del sol/)).toBeTruthy()
  })

  it('shows a completed message when all achievements are unlocked', () => {
    render(
      <AchievementsCard
        summary={{ ...SUMMARY, unlockedCount: 6, nextAchievement: null }}
        onPress={() => {}}
      />
    )
    expect(screen.getByText('¡Has desbloqueado todos los logros!')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    render(<AchievementsCard summary={SUMMARY} onPress={onPress} />)
    fireEvent.press(screen.getByLabelText('Ver mis logros'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
