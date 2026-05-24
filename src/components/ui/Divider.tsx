import React from 'react'
import { StyleSheet, View } from 'react-native'
import { colors, spacing } from '@/design'

type Props = {
  vertical?: boolean
  marginVertical?: number
}

export function Divider({ vertical = false, marginVertical = spacing.md }: Props) {
  if (vertical) {
    return <View style={styles.vertical} />
  }
  return <View style={[styles.horizontal, { marginVertical }]} />
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
  vertical: {
    width: 1,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
    marginHorizontal: spacing.sm,
  },
})
