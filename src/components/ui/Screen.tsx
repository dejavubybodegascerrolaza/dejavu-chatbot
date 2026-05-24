import React from 'react'
import { ScrollView, StyleSheet, View, ViewProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing } from '@/design'

type Props = ViewProps & {
  scroll?: boolean
  padded?: boolean
}

export function Screen({ scroll = false, padded = true, style, children, ...rest }: Props) {
  const paddingStyle = padded ? styles.padded : undefined

  if (scroll) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, paddingStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.inner, paddingStyle, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { flex: 1 },
  padded: { padding: spacing.md },
})
