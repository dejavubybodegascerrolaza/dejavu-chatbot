import type { ExpoConfig } from 'expo/config'

// Bundle identifiers — confirm before submitting to App Store or Google Play.
// Current values are provisional for internal distribution builds.
const BUNDLE_ID = 'com.bronzeiq.app'

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
    bundleIdentifier: BUNDLE_ID,
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
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
  // extra.eas.projectId is populated automatically by `eas build:configure`
  // after linking the project to an Expo account. Do not set manually.
}

export default config
