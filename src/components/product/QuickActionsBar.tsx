import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors, radius, spacing } from '@/design'

export type QuickAction = {
  label: string
  onPress: () => void
  accessibilityLabel: string
  testID?: string | undefined
}

type Props = {
  actions: readonly QuickAction[]
}

export function QuickActionsBar({ actions }: Props) {
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          testID={action.testID}
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
        >
          <AppText variant="label" color="brand" style={styles.tileLabel}>
            {action.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tilePressed: {
    backgroundColor: colors.bronzeSoft,
  },
  tileLabel: {
    textAlign: 'center',
  },
})
