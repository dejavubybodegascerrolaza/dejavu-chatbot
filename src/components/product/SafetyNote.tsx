import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors, radius, spacing } from '@/design'

export function SafetyNote() {
  return (
    <View style={styles.container}>
      <AppText variant="caption" color="textMuted" style={styles.text}>
        Bronze IQ ofrece orientación general, no médica. No garantiza seguridad frente a la
        exposición solar.
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
