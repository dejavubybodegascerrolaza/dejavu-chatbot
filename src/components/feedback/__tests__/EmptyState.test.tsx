import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Sin sesiones" />)
    expect(screen.getByText('Sin sesiones')).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="Vacío" description="Aún no tienes sesiones." />)
    expect(screen.getByText('Aún no tienes sesiones.')).toBeTruthy()
  })

  it('renders CTA button when label and handler are provided', () => {
    const onCta = jest.fn()
    render(<EmptyState title="Vacío" ctaLabel="Registrar" onCta={onCta} />)
    fireEvent.press(screen.getByText('Registrar'))
    expect(onCta).toHaveBeenCalled()
  })

  it('does not render CTA when handler is missing', () => {
    render(<EmptyState title="Vacío" ctaLabel="Registrar" />)
    expect(screen.queryByText('Registrar')).toBeNull()
  })
})
