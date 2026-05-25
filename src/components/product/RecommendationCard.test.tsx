import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { RecommendationCard } from './RecommendationCard'

const defaultProps = {
  title: 'Puedes empezar con prudencia',
  message:
    'No tienes una acumulación elevada. Si decides exponerte, hazlo de forma gradual con protección adecuada.',
  level: 'low' as const,
  reasons: ['low_weekly_load'],
  ctaLabel: 'Registrar sesión',
  onCtaPress: jest.fn(),
}

describe('RecommendationCard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders title and message', () => {
    render(<RecommendationCard {...defaultProps} />)
    expect(screen.getByText('Puedes empezar con prudencia')).toBeTruthy()
    expect(screen.getByText(/acumulación elevada/)).toBeTruthy()
  })

  it('renders CTA label', () => {
    render(<RecommendationCard {...defaultProps} />)
    expect(screen.getByText('Registrar sesión')).toBeTruthy()
  })

  it('calls onCtaPress when CTA is pressed', () => {
    render(<RecommendationCard {...defaultProps} />)
    fireEvent.press(screen.getByText('Registrar sesión'))
    expect(defaultProps.onCtaPress).toHaveBeenCalledTimes(1)
  })

  it('renders reason label for known reason', () => {
    render(<RecommendationCard {...defaultProps} reasons={['low_weekly_load']} />)
    expect(screen.getByText(/acumulación reciente es baja/i)).toBeTruthy()
  })

  it('renders fallback for unknown reason', () => {
    render(<RecommendationCard {...defaultProps} reasons={['completely_unknown_reason']} />)
    expect(screen.getByText(/historial reciente/i)).toBeTruthy()
  })

  it('renders no reasons section when reasons array is empty', () => {
    render(<RecommendationCard {...defaultProps} reasons={[]} />)
    expect(screen.queryByText(/acumulación reciente es baja/i)).toBeNull()
  })

  it('renders with rest level without alarmist language in reasons', () => {
    render(
      <RecommendationCard
        {...defaultProps}
        level="rest"
        title="Mejor descansar de exposición directa"
        reasons={['burned_recently']}
      />
    )
    const title = screen.getByText('Mejor descansar de exposición directa')
    expect(title).toBeTruthy()
    // Should not use forbidden words
    expect(screen.queryByText(/sin riesgo/i)).toBeNull()
    expect(screen.queryByText(/garantizado/i)).toBeNull()
  })

  it('renders burned_recently reason with human label', () => {
    render(<RecommendationCard {...defaultProps} reasons={['burned_recently']} />)
    expect(screen.getByText(/señal clara de exceso/i)).toBeTruthy()
  })
})
