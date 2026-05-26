import React from 'react'
import { render } from '@testing-library/react-native'
import { ProfileSummaryCard } from './ProfileSummaryCard'

describe('ProfileSummaryCard', () => {
  const defaultProps = {
    alias: 'Alex',
    goalLabel: 'Mantener un bronceado gradual',
    sensitivityLabel: 'Normalmente tolero exposiciones moderadas',
    skinTypeLabel: 'III — Intermedia',
  }

  it('renders alias', () => {
    const { getByText } = render(<ProfileSummaryCard {...defaultProps} />)
    expect(getByText('Alex')).toBeTruthy()
  })

  it('renders goal label', () => {
    const { getByText } = render(<ProfileSummaryCard {...defaultProps} />)
    expect(getByText('Mantener un bronceado gradual')).toBeTruthy()
  })

  it('renders sensitivity label', () => {
    const { getByText } = render(<ProfileSummaryCard {...defaultProps} />)
    expect(getByText('Normalmente tolero exposiciones moderadas')).toBeTruthy()
  })

  it('renders skin type label', () => {
    const { getByText } = render(<ProfileSummaryCard {...defaultProps} />)
    expect(getByText('III — Intermedia')).toBeTruthy()
  })

  it('renders "No indicado" for null skin type label', () => {
    const { getByText } = render(
      <ProfileSummaryCard {...defaultProps} skinTypeLabel="No indicado" />
    )
    expect(getByText('No indicado')).toBeTruthy()
  })
})
