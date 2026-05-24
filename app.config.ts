import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Bronze IQ',
  slug: 'bronze-iq',
  version: '0.1.0',
  scheme: 'bronzeiq',
  platforms: ['ios', 'android'],
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.bronzeiq.app',
  },
  android: {
    package: 'com.bronzeiq.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FAF5EE',
    },
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#FAF5EE',
      },
    ],
  ],
}

export default config
