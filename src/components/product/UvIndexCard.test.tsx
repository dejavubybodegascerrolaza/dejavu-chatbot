import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { UvIndexCard } from './UvIndexCard'
import type { UvForecast } from '@/modules/uv'

function buildForecast(overrides?: Partial<UvForecast>): UvForecast {
  return {
    coordinates: { latitude: 40.4, longitude: -3.7 },
    current: { time: '2026-06-15T13:00', uvIndex: 9 },
    hourly: [],
    maxToday: 9,
    peakWindow: { startHour: 11, endHour: 16, maxUvIndex: 9 },
    fetchedAt: '2026-06-15T13:05:00.000Z',
    ...overrides,
  }
}

describe('UvIndexCard', () => {
  it('renders the current UV index value', () => {
    render(<UvIndexCard forecast={buildForecast()} />)
    expect(screen.getByText('9')).toBeTruthy()
  })

  it('shows the very-high category label for a UV of 9', () => {
    render(<UvIndexCard forecast={buildForecast()} />)
    expect(screen.getByText('Muy alto')).toBeTruthy()
  })

  it('renders the peak window', () => {
    render(<UvIndexCard forecast={buildForecast()} />)
    expect(screen.getByText(/de 11:00 a 16:00/)).toBeTruthy()
  })

  it('formats a decimal UV index', () => {
    render(
      <UvIndexCard
        forecast={buildForecast({ current: { time: '2026-06-15T10:00', uvIndex: 4.5 } })}
      />
    )
    expect(screen.getByText('4.5')).toBeTruthy()
    expect(screen.getByText('Moderado')).toBeTruthy()
  })
})
