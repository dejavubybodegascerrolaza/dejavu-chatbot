import { TextStyle } from 'react-native'
import { typographyScale, TextVariant } from './tokens'

export function getTextStyle(variant: TextVariant): TextStyle {
  return typographyScale[variant]
}

export type { TextVariant }
