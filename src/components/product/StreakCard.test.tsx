import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { StreakCard } from './StreakCard'

describe('StreakCard', () => {
  it('renders the streak number and plural message', () => {
    render(<StreakCard streak={12} />)
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getByText('12 días cuidando tu piel')).toBeTruthy()
  })

  it('encourages starting when the streak is 0', () => {
    render(<StreakCard streak={0} />)
    expect(screen.getByText('Empieza hoy a cuidar tu piel')).toBeTruthy()
  })

  it('zero-streak subtext does not imply sessions are safe', () => {
    render(<StreakCard streak={0} />)
    const subtextNode = screen.getByText('Anota tu exposición de hoy o tómate un descanso.')
    expect(subtextNode).toBeTruthy()
    // Must not use "sesión segura" — that wording implies sessions can be labelled safe.
    expect(subtextNode.props.children).not.toMatch(/sesi[oó]n segura/i)
  })
})
