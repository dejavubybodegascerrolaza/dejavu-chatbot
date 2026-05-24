import React from 'react'
import { StyleSheet, View } from 'react-native'
import { colors, radius, spacing } from '@/design'
import { AppText } from '@/components/ui/AppText'

type Props = {
  compact?: boolean
}

const FULL_TEXT =
  'Bronze IQ orienta, no diagnostica. Esta información es de carácter general y no sustituye el criterio de un profesional de la salud. Consulta a un dermatólogo ante cualquier duda sobre tu piel.'

const COMPACT_TEXT = 'Orientación general, no médica. Consulta a un dermatólogo si tienes dudas.'

export function DisclaimerBox({ compact = false }: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="caption" color="textMuted" style={styles.text}>
        {compact ? COMPACT_TEXT : FULL_TEXT}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.bronze,
    padding: spacing.md,
  },
  text: { lineHeight: 18 },
})
