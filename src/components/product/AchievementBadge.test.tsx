import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { AchievementBadge } from './AchievementBadge'

describe('AchievementBadge', () => {
  it('shows a check mark and label when unlocked', () => {
    render(
      <AchievementBadge
        achievement={{ id: 'first_session', unlocked: true, current: 1, target: 1 }}
      />
    )
    expect(screen.getByText('Primera sesión')).toBeTruthy()
    expect(screen.getByText('✓')).toBeTruthy()
  })

  it('shows progress when locked', () => {
    render(
      <AchievementBadge
        achievement={{ id: 'consistency', unlocked: false, current: 4, target: 10 }}
      />
    )
    expect(screen.getByText('Constante')).toBeTruthy()
    expect(screen.getByText('4/10')).toBeTruthy()
  })
})
