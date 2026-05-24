import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('shows default label for low level', () => {
    render(<Badge level="low" />)
    expect(screen.getByText('Bajo')).toBeTruthy()
  })

  it('shows default label for avoid level', () => {
    render(<Badge level="avoid" />)
    expect(screen.getByText('Evitar')).toBeTruthy()
  })

  it('renders custom label override', () => {
    render(<Badge level="moderate" label="Cuidado" />)
    expect(screen.getByText('Cuidado')).toBeTruthy()
  })
})
