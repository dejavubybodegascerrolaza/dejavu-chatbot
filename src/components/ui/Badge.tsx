import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { colors, radius, spacing } from '@/design'
import { AppText } from './AppText'

export type BadgeLevel = 'low' | 'moderate' | 'high' | 'avoid'

type Props = {
  level: BadgeLevel
  label?: string
}

const levelConfig: Record<
  BadgeLevel,
  { background: keyof typeof colors; text: keyof typeof colors; defaultLabel: string }
> = {
  low: { background: 'successSoft', text: 'success', defaultLabel: 'Bajo' },
  moderate: { background: 'warningSoft', text: 'warning', defaultLabel: 'Moderado' },
  high: { background: 'bronzeSoft', text: 'bronze', defaultLabel: 'Alto' },
  avoid: { background: 'dangerSoft', text: 'danger', defaultLabel: 'Evitar' },
}

export function Badge({ level, label }: Props) {
  const config = levelConfig[level]
  const displayLabel = label ?? config.defaultLabel

  const containerStyle: ViewStyle = {
    backgroundColor: colors[config.background],
  }

  return (
    <View style={[styles.base, containerStyle]}>
      <AppText variant="caption" color={config.text} style={styles.text}>
        {displayLabel}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: { fontWeight: '600' },
})
