import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { SafetyNote } from './SafetyNote'

describe('SafetyNote', () => {
  it('renders the safety disclaimer text', () => {
    render(<SafetyNote />)
    expect(screen.getByText(/orientación general, no médica/i)).toBeTruthy()
  })

  it('does not use prohibited language', () => {
    render(<SafetyNote />)
    const el = screen.getByText(/orientación general/i)
    expect(el.props.children).not.toMatch(/seguro|sin riesgo|garantizado/)
  })
})
