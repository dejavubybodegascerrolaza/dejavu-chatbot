import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { BurnTimeCard } from './BurnTimeCard'

describe('BurnTimeCard', () => {
  it('renders the safe exposure time for a given UV and skin type', () => {
    // type II MED 250, UV 5 → burn 33 min, safe = round(250*0.6/7.5) = 20 min
    render(<BurnTimeCard skinType={2} uvIndex={5} />)
    expect(screen.getByText('20 min')).toBeTruthy()
  })

  it('renders the burn threshold detail', () => {
    render(<BurnTimeCard skinType={2} uvIndex={5} />)
    expect(screen.getByText('33 min')).toBeTruthy()
  })

  it('shows no practical limit when UV index is 0', () => {
    render(<BurnTimeCard skinType={3} uvIndex={0} />)
    expect(screen.getAllByText('Sin límite práctico').length).toBeGreaterThan(0)
  })
})
