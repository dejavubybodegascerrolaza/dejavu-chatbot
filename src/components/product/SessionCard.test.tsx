import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { SessionCard } from './SessionCard'
import type { ExposureSession } from '@/modules/sessions/session.types'

const baseSession: ExposureSession = {
  id: 'session-uuid-1',
  userId: 'user-uuid-1',
  sessionDate: '2026-05-25',
  durationMinutes: 45,
  context: 'pool',
  uvIndexManual: null,
  protectionLevel: 'high',
  sensationAfter: 'normal',
  notes: null,
  createdAt: '2026-05-25T10:00:00.000Z',
  updatedAt: '2026-05-25T10:00:00.000Z',
}

describe('SessionCard', () => {
  it('renders duration', () => {
    render(<SessionCard session={baseSession} />)
    expect(screen.getByText(/45 min/)).toBeTruthy()
  })

  it('renders context label in Spanish', () => {
    render(<SessionCard session={baseSession} />)
    expect(screen.getByText(/Piscina/)).toBeTruthy()
  })

  it('renders sensation label in Spanish', () => {
    render(<SessionCard session={baseSession} />)
    expect(screen.getByText(/Normal/)).toBeTruthy()
  })

  it('renders UV no indicado when uvIndexManual is null', () => {
    render(<SessionCard session={baseSession} />)
    expect(screen.getByText('UV: No indicado')).toBeTruthy()
  })

  it('renders UV value when uvIndexManual is set', () => {
    render(<SessionCard session={{ ...baseSession, uvIndexManual: 7 }} />)
    expect(screen.getByText('UV: 7')).toBeTruthy()
  })

  it('renders notes when present', () => {
    render(<SessionCard session={{ ...baseSession, notes: 'Estaba nublado' }} />)
    expect(screen.getByText('Estaba nublado')).toBeTruthy()
  })

  it('does not render notes section when notes is null', () => {
    render(<SessionCard session={baseSession} />)
    expect(screen.queryByText(/Estaba/)).toBeNull()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    render(<SessionCard session={baseSession} onPress={onPress} />)
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders without Pressable when onPress is not provided', () => {
    render(<SessionCard session={baseSession} />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
