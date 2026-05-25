import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { WeeklySummaryCard } from './WeeklySummaryCard'

describe('WeeklySummaryCard', () => {
  it('renders session count', () => {
    render(
      <WeeklySummaryCard
        sessionsCount={3}
        totalMinutes={120}
        lastSensationLabel="Normal"
        recommendationLevel="low"
      />
    )
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('renders total minutes', () => {
    render(
      <WeeklySummaryCard
        sessionsCount={2}
        totalMinutes={90}
        lastSensationLabel={null}
        recommendationLevel="moderate"
      />
    )
    expect(screen.getByText('90 min')).toBeTruthy()
  })

  it('shows em dash when no minutes registered', () => {
    render(
      <WeeklySummaryCard
        sessionsCount={0}
        totalMinutes={0}
        lastSensationLabel={null}
        recommendationLevel="low"
      />
    )
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('renders last sensation label', () => {
    render(
      <WeeklySummaryCard
        sessionsCount={1}
        totalMinutes={45}
        lastSensationLabel="Piel caliente o tirante"
        recommendationLevel="caution"
      />
    )
    expect(screen.getByText('Piel caliente o tirante')).toBeTruthy()
  })

  it('renders Sin datos when no last sensation', () => {
    render(
      <WeeklySummaryCard
        sessionsCount={0}
        totalMinutes={0}
        lastSensationLabel={null}
        recommendationLevel="low"
      />
    )
    expect(screen.getByText('Sin datos')).toBeTruthy()
  })

  it('renders recommendation level label', () => {
    render(
      <WeeklySummaryCard
        sessionsCount={5}
        totalMinutes={200}
        lastSensationLabel="Bien"
        recommendationLevel="rest"
      />
    )
    expect(screen.getByText('Descanso recomendado')).toBeTruthy()
  })
})
