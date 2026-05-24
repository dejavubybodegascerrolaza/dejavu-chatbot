import { colors, spacing, radius, typographyScale, shadows } from './tokens'

export const theme = {
  colors,
  spacing,
  radius,
  typography: typographyScale,
  shadows,
} as const

export type Theme = typeof theme
