import { StyleSheet, Text, View } from 'react-native'

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bronze IQ</Text>
      <Text style={styles.subtitle}>Coming soon.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1A1614',
  },
  subtitle: {
    fontSize: 16,
    color: '#7A6E66',
    marginTop: 8,
  },
})
