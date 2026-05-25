import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui'
import { spacing } from '@/design'

type Props = {
  title?: string | undefined
  description?: string | undefined
  children: React.ReactNode
}

export function FormSection({ title, description, children }: Props) {
  return (
    <View style={styles.container}>
      {title !== undefined ? <AppText variant="heading">{title}</AppText> : null}
      {description !== undefined ? (
        <AppText variant="body" color="textSecondary" style={styles.description}>
          {description}
        </AppText>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  description: {
    marginTop: 2,
  },
  content: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
})
