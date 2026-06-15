# RC-2 — iPhone Integration Test Checklist

**Build type:** EAS Development Build (expo-dev-client)
**Target device:** Physical iPhone (iOS 16+)
**Date:** 2026-06-15
**Branch:** claude/bronze-iq-mvp-architecture-uioho

---

## Prerequisites

### Workstation

- [ ] Node 20 installed (`node --version` → `v20.x.x`)
- [ ] EAS CLI installed globally: `npm install -g eas-cli`
- [ ] EAS CLI version ≥ 13.0.0: `eas --version`
- [ ] Logged in to Expo account: `eas whoami` → returns your Expo username
- [ ] iPhone connected via USB (or same Wi-Fi network)
- [ ] iPhone trusted the computer (prompt accepted on device)
- [ ] iOS 16.0 or later on the test iPhone

### Expo / EAS Account

- [ ] Project linked to EAS: `eas.json` present at repo root with `build.development` profile
- [ ] Apple Developer Program membership active (required for device builds)
- [ ] UDID of the test iPhone registered in Apple Developer Portal
  - Get UDID: Finder → select iPhone → click device name until UDID appears → copy
  - Register at: developer.apple.com → Devices → Add Device

### Repository

- [ ] On branch `claude/bronze-iq-mvp-architecture-uioho`
- [ ] All changes committed and pushed
- [ ] `npm install` runs cleanly: `rm -rf node_modules && npm install`
- [ ] `npm run typecheck` → exit 0
- [ ] `npm run lint` → exit 0
- [ ] `npm test` → exit 0

---

## Environment Variables

### Variables required to run the app

| Variable                        | Where to set                    | Notes                                                  |
| ------------------------------- | ------------------------------- | ------------------------------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`      | EAS Environment Variables       | Your Supabase project URL (`https://xxxx.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | EAS Environment Variables       | Public anon key — safe to include in client bundle     |
| `EXPO_PUBLIC_APP_ENV`           | Set automatically by `eas.json` | `development` for dev builds                           |

### How to set EAS Environment Variables

```bash
# Create each variable interactively (prompts for value, keeps it secret in logs)
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --environment development
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --environment development
```

Alternatively, set them from the Expo dashboard: expo.dev → your project → Environment Variables.

**Never** use `eas secret:create` — that API is deprecated in EAS CLI ≥ 13.
**Never** commit actual values to any file. `.env.local` is in `.gitignore`.

### Local `.env.local` for `expo start` (development only)

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_APP_ENV=development
```

---

## Supabase Cloud Setup Checklist

Before building, verify the Supabase project is configured correctly.

- [ ] Project created at supabase.com (Free tier is sufficient)
- [ ] Both migration files applied in order (`supabase/migrations/`):
  - `20260525000000_initial_schema.sql`
  - `20260615120000_tanning_plans.sql`
- [ ] The 4 tables exist, each with RLS enabled:
  - `profiles` (consent stored here as `consent_given_at` / `consent_version` columns)
  - `exposure_sessions`
  - `deletion_requests`
  - `tanning_plans`
- [ ] Authentication → Email provider enabled
- [ ] Authentication → Site URL set (can be `bronzeiq://` for native)
- [ ] RLS sanity check: In Supabase SQL editor, confirm `SELECT * FROM profiles` as anon returns 0 rows (no bypass)
- [ ] RLS isolation check: Two separate test accounts — JWT of user B cannot read rows of user A in any table

### Verify RLS isolation (required before shipping)

```sql
-- Run as user A's JWT → should return user A's rows only
SELECT id FROM profiles WHERE id = auth.uid();

-- Run as user B's JWT → should return 0 rows (not user A's data)
SELECT * FROM profiles WHERE id = '<user-A-uuid>';
```

---

## EAS Build Commands

### Build a Development Build (for physical iPhone)

```bash
# Ensure EAS env vars are configured first (see above)
npm run build:dev:ios
# Equivalent: eas build --platform ios --profile development
```

This produces a `.ipa` with expo-dev-client embedded. It cannot be opened in Expo Go.

### Build a Preview Build (standalone, no dev client)

```bash
npm run build:preview:ios
# Equivalent: eas build --platform ios --profile preview
```

Use this for a clean standalone install without the dev menu.

### Check build status

```bash
eas build:list --platform ios --limit 5
```

---

## iPhone Installation Steps

### Method A: Install via Expo dashboard link (recommended)

1. Complete the EAS build — wait for "Build finished" in terminal or expo.dev/builds
2. EAS sends an install link to your registered email
3. Open the link on the iPhone (Safari — not Chrome, Chrome cannot install IPAs)
4. Tap "Install" on the manifest page
5. Go to iOS Settings → General → VPN & Device Management → trust the developer certificate
6. Open Bronze IQ from the home screen

### Method B: Install via `eas build:run`

```bash
# After build completes, run directly on connected iPhone
eas build:run --platform ios --latest
```

### Method C: Manual install via Xcode

1. Download the `.ipa` from expo.dev/builds
2. Open Xcode → Window → Devices and Simulators
3. Select your connected iPhone
4. Drag the `.ipa` file onto the installed apps list

### First launch

On first open, expo-dev-client displays the "Select a bundle" screen. Enter the LAN address shown by `expo start` or press the home button to use the embedded bundle.

```bash
# Start the dev server after installing the build on device
expo start --dev-client
```

---

## Manual Test Script

**Legend:** ✅ Pass | ❌ Fail | ⚠️ Partial | — Not tested

### Section 1 — App Launch & Boot

| #   | Test                             | Expected                                                | Result | Notes |
| --- | -------------------------------- | ------------------------------------------------------- | ------ | ----- |
| 1.1 | Cold launch (first ever install) | Splash screen appears, transitions to Welcome screen    |        |       |
| 1.2 | Splash screen timing             | Splash disappears within 3 seconds                      |        |       |
| 1.3 | No crash on launch               | App reaches Welcome screen without white flash or crash |        |       |
| 1.4 | Portrait lock                    | Rotating device does not change orientation             |        |       |

### Section 2 — Auth: Sign Up

| #   | Test                | Expected                                                        | Result | Notes |
| --- | ------------------- | --------------------------------------------------------------- | ------ | ----- |
| 2.1 | Navigate to sign-up | Tap "Crear cuenta" on Welcome → Sign Up screen appears          |        |       |
| 2.2 | Empty submit        | Both fields empty, tap Submit → inline validation errors appear |        |       |
| 2.3 | Invalid email       | `notanemail` in email field → email format error shown          |        |       |
| 2.4 | Short password      | Password under 8 characters → error shown                       |        |       |
| 2.5 | Valid sign-up       | Valid email + password ≥ 8 chars → navigates to Onboarding      |        |       |
| 2.6 | Duplicate email     | Same email twice → friendly error, not crash                    |        |       |
| 2.7 | Keyboard dismiss    | Tap outside field or "Done" on keyboard → keyboard closes       |        |       |

### Section 3 — Onboarding

| #   | Test                       | Expected                                                                                   | Result | Notes |
| --- | -------------------------- | ------------------------------------------------------------------------------------------ | ------ | ----- |
| 3.1 | Disclaimer screen          | Disclaimer text visible, checkbox or "Acepto" button present                               |        |       |
| 3.2 | Cannot skip disclaimer     | Proceeding without accepting → blocked with message                                        |        |       |
| 3.3 | Profile setup: alias       | Optional alias field accepts text                                                          |        |       |
| 3.4 | Profile setup: age range   | Picker/selector shows 4 options (18-25, 26-35, 36-50, 51+)                                 |        |       |
| 3.5 | Profile setup: Fitzpatrick | All 6 skin types selectable with visual feedback                                           |        |       |
| 3.6 | Profile setup: sensitivity | Sun sensitivity slider/picker 1-5 responds to touch                                        |        |       |
| 3.7 | Complete onboarding        | Submit → navigates to Home tab                                                             |        |       |
| 3.8 | Supabase rows created      | After 3.7: `profiles` row exists with `consent_given_at` and `onboarding_completed_at` set |        |       |

### Section 4 — Home Screen

| #   | Test                         | Expected                                                              | Result | Notes |
| --- | ---------------------------- | --------------------------------------------------------------------- | ------ | ----- |
| 4.1 | Home loads without crash     | Home screen visible with user's daily status                          |        |       |
| 4.2 | Loading state                | Brief skeleton/spinner before data appears (not blank screen)         |        |       |
| 4.3 | Recommendation card shows    | Recommended minutes and SPF visible                                   |        |       |
| 4.4 | Risk indicator               | Low/moderate/high/avoid badge shows with icon + text (not color only) |        |       |
| 4.5 | "Cómo funciona" modal        | Tap info icon → modal explains algorithm in plain language            |        |       |
| 4.6 | Disclaimer visible           | At least one disclaimer note visible on Home                          |        |       |
| 4.7 | No "garantía/seguro" in copy | Scan all Home text — none of those words present                      |        |       |

### Section 5 — Location Permission

| #   | Test                        | Expected                                                                                | Result | Notes |
| --- | --------------------------- | --------------------------------------------------------------------------------------- | ------ | ----- |
| 5.1 | Location prompt fires       | On first Home load → iOS permission prompt appears with Spanish description             |        |       |
| 5.2 | Permission description text | Prompt reads: "Bronze IQ usa tu ubicación para mostrarte el índice UV real de tu zona." |        |       |
| 5.3 | Grant permission → UV data  | After granting → Home updates with UV-based recommendation                              |        |       |
| 5.4 | Deny permission → graceful  | Deny → Home shows fallback message, does not crash                                      |        |       |
| 5.5 | Re-open after deny          | App reopens → no repeated prompt (iOS respects prior denial)                            |        |       |

### Section 6 — Notification Permission

| #   | Test                      | Expected                                                                                 | Result | Notes |
| --- | ------------------------- | ---------------------------------------------------------------------------------------- | ------ | ----- |
| 6.1 | Notification prompt fires | After location granted → iOS notification permission prompt appears                      |        |       |
| 6.2 | Grant notifications       | Grant → no crash, Settings shows toggle controls enabled                                 |        |       |
| 6.3 | Deny notifications        | Deny → Settings shows "Activar notificaciones" message with link to Settings             |        |       |
| 6.4 | Notifications scheduled   | After grant + active plan + streak > 0 → notifications appear in iOS Notification Center |        |       |

### Section 7 — Session Registration

| #    | Test                       | Expected                                                     | Result | Notes |
| ---- | -------------------------- | ------------------------------------------------------------ | ------ | ----- |
| 7.1  | Navigate to new session    | Tap "+" or "Nueva sesión" → form appears                     |        |       |
| 7.2  | Required fields validation | Submit empty → validation errors on required fields          |        |       |
| 7.3  | Duration field             | Accepts 1–300, rejects 0 and 301+                            |        |       |
| 7.4  | SPF picker                 | Options: 0, 15, 30, 50, 50+ — all selectable                 |        |       |
| 7.5  | Body coverage              | minimal/partial/full — all selectable                        |        |       |
| 7.6  | Location type              | beach/pool/urban/mountain/other — all selectable             |        |       |
| 7.7  | Notes field (optional)     | Accepts text up to 500 chars                                 |        |       |
| 7.8  | Submit valid session       | Navigates back, session appears in history                   |        |       |
| 7.9  | Supabase row created       | `exposure_sessions` has new row with correct `user_id`       |        |       |
| 7.10 | Home updates               | After session, Home recommendation reflects today's exposure |        |       |

### Section 8 — Session History

| #   | Test                       | Expected                                                     | Result | Notes |
| --- | -------------------------- | ------------------------------------------------------------ | ------ | ----- |
| 8.1 | History tab shows sessions | All recorded sessions visible in reverse-chronological order |        |       |
| 8.2 | Empty state                | No sessions → friendly empty state message + CTA             |        |       |
| 8.3 | Pull to refresh            | Pull down → data refreshes                                   |        |       |
| 8.4 | Session card content       | Each card shows: date, duration, SPF, location type          |        |       |

### Section 9 — Settings

| #   | Test                              | Expected                                                                      | Result | Notes |
| --- | --------------------------------- | ----------------------------------------------------------------------------- | ------ | ----- |
| 9.1 | Settings tab loads                | All sections visible without crash                                            |        |       |
| 9.2 | Edit profile                      | Tap "Editar perfil" → profile form pre-filled with current values             |        |       |
| 9.3 | Save profile changes              | Change alias → save → new alias reflected everywhere                          |        |       |
| 9.4 | Notification toggles (if granted) | UV alert, session reminder, streak reminder — each toggle works independently |        |       |
| 9.5 | Toggle off cancels notification   | Toggle UV alerts off → OS notification for that channel cancelled             |        |       |
| 9.6 | Notification toggles persist      | Kill and reopen app → toggle state preserved                                  |        |       |
| 9.7 | Sign out                          | Tap "Cerrar sesión" → confirm → navigates to Welcome screen                   |        |       |
| 9.8 | Cannot reach app after sign-out   | Back gesture or direct navigation to Home → redirected to Welcome             |        |       |

### Section 10 — Privacy & Data Deletion

| #    | Test                           | Expected                                                                             | Result | Notes |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------ | ------ | ----- |
| 10.1 | Privacy screen accessible      | Settings → Privacy → screen loads                                                    |        |       |
| 10.2 | "Solicitar eliminación" button | Visible and tappable                                                                 |        |       |
| 10.3 | Confirmation dialog            | Tap button → modal asks for confirmation before proceeding                           |        |       |
| 10.4 | Deletion request created       | Confirm → row in `deletion_requests` with `status: pending`                          |        |       |
| 10.5 | Success message                | "La procesaremos en un máximo de 30 días conforme a nuestra política de privacidad." |        |       |
| 10.6 | Sign-out after request         | App signs out user after deletion request                                            |        |       |
| 10.7 | No "durante el MVP" in copy    | Scan all Settings/Privacy text — no internal MVP references                          |        |       |

### Section 11 — Session Persistence

| #    | Test                      | Expected                                                                            | Result | Notes |
| ---- | ------------------------- | ----------------------------------------------------------------------------------- | ------ | ----- |
| 11.1 | Force-quit and reopen     | Kill app → reopen → still signed in, no re-login required                           |        |       |
| 11.2 | Background and foreground | Background app 5 min → foreground → session still active                            |        |       |
| 11.3 | Token stored securely     | Tokens in expo-secure-store (verify by absence from AsyncStorage in Expo dev tools) |        |       |

### Section 12 — Edge Cases & Error States

| #    | Test                           | Expected                                                                | Result | Notes |
| ---- | ------------------------------ | ----------------------------------------------------------------------- | ------ | ----- |
| 12.1 | Airplane mode → Home           | Enable airplane mode → open Home → graceful error message, no crash     |        |       |
| 12.2 | Airplane mode → submit session | Try submitting session → error toast, not crash                         |        |       |
| 12.3 | Airplane mode → sign in        | Try signing in → error shown, no spinner stuck forever                  |        |       |
| 12.4 | Error boundary                 | Force an error (if possible) → "Algo salió mal" screen with retry       |        |       |
| 12.5 | Keyboard overlap               | On forms, inputs not hidden behind keyboard                             |        |       |
| 12.6 | Safe area                      | Content not cut off by iPhone notch/Dynamic Island or home indicator    |        |       |
| 12.7 | VoiceOver spot check           | Enable VoiceOver → main interactive elements are labelled and reachable |        |       |

---

## Troubleshooting Guide

### 1. Build fails: "No provisioning profile found"

**Cause:** UDID not registered in Apple Developer Portal.

**Fix:**

1. Connect iPhone, open Finder, copy UDID
2. Register at developer.apple.com → Certificates, IDs & Profiles → Devices → Add Device
3. Re-run `npm run build:dev:ios` — EAS re-creates the provisioning profile automatically

---

### 2. `eas build` fails: "You are not logged in"

**Fix:**

```bash
eas login
# Enter Expo account credentials
eas whoami  # verify
```

---

### 3. Build succeeds but IPA cannot be installed: "Unable to Install"

**Cause:** Certificate not trusted on device.

**Fix:**

1. iOS Settings → General → VPN & Device Management
2. Find the developer certificate → tap "Trust"
3. Re-open Bronze IQ

---

### 4. App opens to expo-dev-client launcher, not Bronze IQ

**Cause:** The dev build embeds expo-dev-client which shows a launcher on first open.

**Fix:**

- Option A: Run `expo start --dev-client` on your workstation and enter the displayed URL in the launcher
- Option B: The launcher shows the last-used bundle automatically on subsequent opens

---

### 5. "Network request failed" on all API calls

**Causes:**

- EAS environment variables not set (`EXPO_PUBLIC_SUPABASE_URL` missing)
- Supabase project paused (Free tier auto-pauses after 7 days idle)

**Fix:**

```bash
# Check vars are set
eas env:list --environment development

# Wake Supabase project
# Go to supabase.com → your project → click "Restore project" if paused
```

---

### 6. Location permission prompt does not appear

**Cause:** iOS caches permission decisions. Once denied, it won't re-prompt.

**Fix:**

- iOS Settings → Privacy & Security → Location Services → Bronze IQ → change to "While Using App"
- Or: delete and reinstall the app to reset permissions

---

### 7. Notification permission prompt does not appear

**Cause:** Same iOS permission caching as above.

**Fix:**

- iOS Settings → Notifications → Bronze IQ → enable "Allow Notifications"
- Or: delete and reinstall the app

---

### 8. Notification toggles appear disabled even after granting permission

**Cause:** `refreshPermission()` runs on Settings mount; if it resolves before the OS state is ready, it reads stale state.

**Fix:**

- Navigate away from Settings and back → permission refreshes on mount
- If still disabled: check `useNotificationStore.getState().permission` in Expo dev tools

---

### 9. `typecheck` fails after pulling latest branch

**Cause:** TypeScript strict mode catches new issues introduced by recent changes.

**Fix:**

```bash
npm run typecheck 2>&1 | head -50
# Read error output, fix the reported files
```

---

### 10. `npm run lint` fails with "no-console" warnings

**Cause:** A `console.log` was left in production code.

**Fix:**

```bash
npm run lint 2>&1 | grep "no-console"
# Remove the offending console.log
```

---

### 11. Jest tests fail with "Native module is null" for AsyncStorage

**Cause:** Missing mock for `@react-native-async-storage/async-storage`.

**Fix:** Verify `jest.config.ts` has:

```typescript
moduleNameMapper: {
  '^@react-native-async-storage/async-storage$': '<rootDir>/src/__mocks__/async-storage.ts',
}
```

---

### 12. "expo-notifications: Native module not found" on device

**Cause:** `expo-notifications` is a native module — it cannot run in Expo Go. It requires a development build.

**Fix:** Confirm you are running the EAS development build (expo-dev-client), not Expo Go. The Expo Go icon is a white background with the Expo logo; the development build has the Bronze IQ app icon.

---

### 13. Session history shows data from another user

**Cause:** RLS policy misconfiguration.

**Fix:**

1. Open Supabase SQL editor
2. Run: `SELECT * FROM exposure_sessions WHERE user_id != auth.uid();`
3. If rows returned → RLS policy is broken. Re-apply the policies from the migration files.
4. This is a critical security issue — do not ship until resolved.

---

## What to Capture When a Bug Appears

For each bug found during testing, capture all of the following before closing the app:

1. **Test ID** — Which step in the manual test script failed (e.g., "7.3")
2. **Device info** — iPhone model, iOS version (Settings → General → About)
3. **Steps to reproduce** — Exact tap sequence from a clean state
4. **Expected vs actual** — What should happen vs what did happen
5. **Screenshot or screen recording** — Use iOS Control Center → Record Screen
6. **Expo logs** — In the expo-dev-client dev menu (shake device → "Show Logs") or from `expo start` terminal output
7. **Supabase logs** — supabase.com → your project → Logs → API logs for any network errors
8. **Network state** — Was airplane mode on? Was the Supabase project active?
9. **Reproducibility** — Does it happen every time or intermittently? On retry?

---

## Known Limitations (RC-2 Scope)

These are intentional gaps for RC-2, not bugs:

| Limitation                                         | Notes                                                                                                                                          |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| No UV real API                                     | Home uses hour-of-day as UV proxy. Real UV integration planned post-MVP.                                                                       |
| No push notifications to device when app is closed | expo-notifications local scheduling only. Background delivery requires APNs server-side token, which requires production build + Apple review. |
| Data deletion is manual                            | `deletion_requests` rows are processed manually. No automated Edge Function yet.                                                               |
| No password reset UI                               | Supabase supports it; UI screen is not built yet.                                                                                              |
| No magic link                                      | Planned but not included in MVP navigation shell.                                                                                              |
| Android not tested in RC-2                         | RC-2 scope is iOS only. Android pass requires a separate Android build.                                                                        |
| No E2E test automation                             | Manual testing only. Detox/Maestro planned post-MVP.                                                                                           |
| Supabase Free Tier auto-pause                      | Project pauses after 7 days of inactivity. Click "Restore" in the dashboard.                                                                   |

---

## RC-2 Sign-off

| Check                                               | Owner       | Status |
| --------------------------------------------------- | ----------- | ------ |
| All Section 1-11 tests passing                      | QA          |        |
| No P0 crashes on cold launch                        | QA          |        |
| RLS isolation verified (test 8 above)               | Engineering |        |
| `typecheck` exit 0                                  | CI          |        |
| `lint` exit 0                                       | CI          |        |
| `test` exit 0                                       | CI          |        |
| No "garantía/seguro/sin riesgo" in user-facing copy | QA          |        |
| No "durante el MVP" in user-facing copy             | QA          |        |
| Notification permissions work on physical device    | QA          |        |
| Session data persists across app restart            | QA          |        |
