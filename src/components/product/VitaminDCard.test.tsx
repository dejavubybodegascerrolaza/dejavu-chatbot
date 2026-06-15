import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { VitaminDCard } from './VitaminDCard'

describe('VitaminDCard', () => {
  it('renders an IU estimate for a typical exposure', () => {
    render(<VitaminDCard skinType={3} uvIndex={6} minutes={20} exposure="arms_legs" />)
    expect(screen.getByText(/UI/)).toBeTruthy()
  })

  it('shows the no-synthesis message when there is no exposure', () => {
    render(<VitaminDCard skinType={3} uvIndex={6} minutes={0} exposure="arms_legs" />)
    expect(screen.getByText('Sin síntesis estimada')).toBeTruthy()
  })

  it('shows the saturation note when synthesis plateaus', () => {
    render(<VitaminDCard skinType={3} uvIndex={9} minutes={90} exposure="full_body" />)
    expect(screen.getByText(/síntesis máxima práctica/)).toBeTruthy()
  })
})
