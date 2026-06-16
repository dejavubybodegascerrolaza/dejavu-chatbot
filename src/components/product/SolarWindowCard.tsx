import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText, Card } from '@/components/ui'
import { spacing } from '@/design'
import type { SolarWindow } from '@/modules/uv/uv.window'

type Props = {
  solarWindow: SolarWindow
}

export function SolarWindowCard({ solarWindow }: Props) {
  if (solarWindow.status === 'insufficient_data' || solarWindow.status === 'conservative_now') {
    return null
  }

  const label = solarWindow.status === 'avoid_peak' ? 'PICO UV ACTIVO' : 'HORA MÁS TRANQUILA'

  return (
    <Card variant="outlined">
      <View style={styles.labelRow}>
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
      </View>
      <AppText variant="body" color="textPrimary" style={styles.note}>
        {solarWindow.note}
      </AppText>
    </Card>
  )
}

const styles = StyleSheet.create({
  labelRow: {
    marginBottom: spacing.xs,
  },
  note: {
    lineHeight: 22,
  },
})
