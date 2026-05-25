import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors, radius, spacing } from '@/design'

type Props = {
  label: string
  description?: string | undefined
  selected: boolean
  onPress: () => void
}

export function ProfileOptionCard({ label, description, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected ? styles.selected : styles.unselected]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      accessibilityHint={description}
    >
      <View style={[styles.indicator, selected ? styles.indicatorSelected : styles.indicatorIdle]}>
        {selected ? <View style={styles.dot} /> : null}
      </View>
      <View style={styles.text}>
        <AppText variant="bodyStrong" color={selected ? 'brand' : 'textPrimary'}>
          {label}
        </AppText>
        {description !== undefined ? (
          <AppText variant="caption" color="textMuted" style={styles.description}>
            {description}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
  },
  selected: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSelected: {
    borderColor: colors.brand,
  },
  indicatorIdle: {
    borderColor: colors.borderStrong,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  description: {
    marginTop: 2,
  },
})
