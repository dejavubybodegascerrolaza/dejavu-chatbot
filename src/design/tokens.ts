export const colors = {
  background: '#FAF5ED',
  backgroundMuted: '#F3E8D8',
  surface: '#FFFDF8',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1E1712',
  textSecondary: '#5C5147',
  textMuted: '#8A7B6D',
  border: '#E7D9C8',
  borderStrong: '#CDB89F',
  brand: '#A9652F',
  brandDark: '#7C4A22',
  brandSoft: '#F4E0CB',
  bronze: '#B8793E',
  bronzeSoft: '#F1DCC5',
  warning: '#B7791F',
  warningSoft: '#F8E7BF',
  danger: '#B45145',
  dangerDark: '#7F2F28',
  dangerSoft: '#F6D6D2',
  success: '#6B7A4F',
  successSoft: '#E2E8D4',
  white: '#FFFFFF',
  black: '#000000',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const

export const typographyScale = {
  display: { fontSize: 36, lineHeight: 42, fontWeight: '700' as const },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
} as const

export const shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
} as const

export type ColorToken = keyof typeof colors
export type SpacingToken = keyof typeof spacing
export type RadiusToken = keyof typeof radius
export type TextVariant = keyof typeof typographyScale
