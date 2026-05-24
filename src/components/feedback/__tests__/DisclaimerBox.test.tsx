import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { DisclaimerBox } from '../DisclaimerBox'

describe('DisclaimerBox', () => {
  it('renders full disclaimer text by default', () => {
    render(<DisclaimerBox />)
    expect(screen.getByText(/orienta, no diagnostica/)).toBeTruthy()
  })

  it('renders compact text when compact=true', () => {
    render(<DisclaimerBox compact />)
    expect(screen.getByText(/Orientación general, no médica/)).toBeTruthy()
  })
})
