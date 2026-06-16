# Bronze IQ — E2E Critical Flows

**Phase:** RC-2Z — E2E Critical Flow Readiness v1
**Date:** 2026-06-16
**Branch:** claude/bronze-iq-mvp-architecture-uioho

---

## E2E Strategy

### Framework choice: Maestro

Maestro was chosen over Detox for the following reasons:

|                                    | Maestro                                 | Detox                             |
| ---------------------------------- | --------------------------------------- | --------------------------------- |
| Expo managed workflow              | ✅ No config change                     | ❌ Requires plugin/ejection       |
| Install method                     | `brew install maestro` (standalone CLI) | npm dev dependency + native build |
| Flow format                        | YAML (readable by non-engineers)        | JavaScript/TypeScript             |
| Physical device support            | ✅                                      | ✅                                |
| Simulator support                  | ✅                                      | ✅                                |
| CI readiness                       | Yes (Maestro Cloud or self-hosted)      | Yes (requires native build)       |
| Setup risk before first TestFlight | Low                                     | High                              |

Maestro does not need to be installed as an npm dependency. It is a standalone CLI tool managed separately from the project.

### Current status: testID-ready, flows scaffolded

- **testIDs** are now on all critical interactive elements across auth, onboarding, live session, and settings screens.
- **Maestro flow files** are in `.maestro/` and are syntactically valid. They require a physical device or simulator and a connected Supabase project to run.
- **No Maestro dependency** has been added to `package.json`. Install separately when ready.

---

## How to Install Maestro

```bash
# macOS
brew tap mobile-dev-inc/tap
brew install maestro

# Verify
maestro --version
```

Or download from: https://maestro.mobile.dev

---

## Required Environment

| Item         | Requirement                                                |
| ------------ | ---------------------------------------------------------- |
| Device       | Physical iPhone (iOS 16+) or iOS Simulator                 |
| Build        | EAS Development Build or Preview Build (`expo-dev-client`) |
| Supabase     | A real Supabase project with dev/staging data              |
| Test account | A pre-confirmed email+password account in Supabase Auth    |
| Location     | Grant when prompted (for flows that test UV data)          |
| Onboarding   | Completed onboarding for session/privacy flows             |

### Test account setup

Create a confirmed test account in your Supabase dashboard:

1. Supabase dashboard → Authentication → Users → Add user
2. Set email and password; mark as confirmed
3. Store credentials in environment variables (never commit them):
   - `BRONZE_IQ_TEST_EMAIL`
   - `BRONZE_IQ_TEST_PASSWORD`

---

## How to Run Flows

```bash
# Run a single flow
maestro test .maestro/01-smoke-login-to-home.yaml \
  -e BRONZE_IQ_TEST_EMAIL=test@example.com \
  -e BRONZE_IQ_TEST_PASSWORD=yourpassword

# Run all flows in sequence
maestro test .maestro/ \
  -e BRONZE_IQ_TEST_EMAIL=test@example.com \
  -e BRONZE_IQ_TEST_PASSWORD=yourpassword

# Run with a connected device (USB or same Wi-Fi)
maestro test .maestro/01-smoke-login-to-home.yaml --device-id <udid>
```

---

## Critical Flows

### Flow 01 — Login to Home (`01-smoke-login-to-home.yaml`)

**Risk covered:** Auth regression, Home loads without crash

| Step                                    | Expected                             |
| --------------------------------------- | ------------------------------------ |
| Launch app                              | Welcome screen visible               |
| Tap "Ya tengo cuenta" (`welcome-login`) | Login screen                         |
| Enter email + password                  | Fields filled                        |
| Tap "Entrar" (`login-submit`)           | Auth succeeds                        |
| Location prompt (iOS)                   | Allow → UV loads                     |
| Home                                    | "Hola" + "Sesión en directo" visible |

**Failure evidence:** Screenshot at failure step, Supabase Auth logs

---

### Flow 02 — Session Log (`02-smoke-session-log.yaml`)

**Risk covered:** Core value loop — session saved and Home acknowledges

| Step                                                    | Expected                       |
| ------------------------------------------------------- | ------------------------------ |
| From Home, tap "Registrar"                              | Session Log screen             |
| Fill duration (30), context (Playa), protection (Media) | Fields set                     |
| Select skin response (Normal)                           | Selected                       |
| Tap "Guardar sesión de exposición"                      | Session saved                  |
| Return to Home                                          | Acknowledgement banner visible |

**Failure evidence:** Screenshot before/after save, check Supabase `exposure_sessions` table

---

### Flow 03 — Live Session Loop (`03-smoke-live-session.yaml`)

**Risk covered:** Timer starts, pauses, finishes, prefills Session Log

| Step                                                            | Expected                                           |
| --------------------------------------------------------------- | -------------------------------------------------- |
| From Home, tap "Sesión en directo" (`home-live-session-button`) | Live session screen                                |
| UV forecast available                                           | Timer visible, no "Necesitamos el índice UV" error |
| Tap "Empezar" (`live-session-control`)                          | Timer running                                      |
| Wait a moment                                                   | Timer increments                                   |
| Tap "Pausar" (`live-session-control`)                           | Timer paused                                       |
| Tap "Finalizar y registrar" (`live-session-finish`)             | Session Log opens prefilled                        |

**Note:** If UV forecast is unavailable, the live session screen shows an error. Test the UV-unavailable path separately (flow 05).

---

### Flow 04 — New User Onboarding (`04-smoke-onboarding.yaml`)

**Risk covered:** Full new-user journey, disclaimer acceptance recorded, profile saved

| Step                                                            | Expected                         |
| --------------------------------------------------------------- | -------------------------------- |
| Launch app (fresh state)                                        | Welcome screen                   |
| Tap "Crear cuenta" (`welcome-create-account`)                   | Register form                    |
| Fill email + password + confirm                                 | Fields filled                    |
| Tap "Crear cuenta" (`register-submit`)                          | Account created                  |
| Onboarding step 0–2 (intro slides)                              | "Continuar" / "Lo entiendo" taps |
| Step 3 — Disclaimer checkbox (`onboarding-disclaimer-checkbox`) | Checkbox checked                 |
| Step 3 — Accept (`onboarding-disclaimer-accept`)                | Advances                         |
| Step 4 — Alias (`onboarding-alias-input`)                       | "TestUser" entered               |
| Step 4 — Continue (`onboarding-alias-continue`)                 | Advances                         |
| Step 5 — Main goal selected + Continue                          | Advances                         |
| Step 6 — Sensitivity selected + Continue                        | Advances                         |
| Step 7 — Skip skin type (`onboarding-skip-skin-type`)           | Profile saved                    |
| Home                                                            | "Hola" visible                   |

**Prerequisite:** Email confirmation must be disabled in Supabase Auth (dev environment) OR the test email must be pre-confirmed.

---

### Flow 05 — Resilience: Location Denied (`05-smoke-resilience-location-denied.yaml`)

**Risk covered:** App doesn't crash when location/UV unavailable; shows conservative fallback

| Step                                     | Expected                                                     |
| ---------------------------------------- | ------------------------------------------------------------ |
| Device has location denied for Bronze IQ | Setting confirmed before run                                 |
| Launch app                               | Home loads                                                   |
| UV card                                  | "Índice UV no disponible" shown, or location-needed guidance |
| Navigation                               | "Sesión en directo" still visible and tappable               |

**How to deny location (iOS Simulator):**
Settings → Privacy & Security → Location Services → Bronze IQ → Never

---

## TestID Reference

All `testID` values added for Maestro addressability:

| Screen            | Element                             | testID                            |
| ----------------- | ----------------------------------- | --------------------------------- |
| Welcome           | "Crear cuenta" button               | `welcome-create-account`          |
| Welcome           | "Ya tengo cuenta" button            | `welcome-login`                   |
| Login             | Email input                         | `login-email-input`               |
| Login             | Password input                      | `login-password-input`            |
| Login             | "Entrar" button                     | `login-submit`                    |
| Register          | Email input                         | `register-email-input`            |
| Register          | Password input                      | `register-password-input`         |
| Register          | Confirm password input              | `register-confirm-password-input` |
| Register          | "Crear cuenta" button               | `register-submit`                 |
| Onboarding step 3 | Disclaimer checkbox                 | `onboarding-disclaimer-checkbox`  |
| Onboarding step 3 | "Aceptar y continuar" button        | `onboarding-disclaimer-accept`    |
| Onboarding step 4 | Alias input                         | `onboarding-alias-input`          |
| Onboarding step 4 | Continue button                     | `onboarding-alias-continue`       |
| Onboarding step 7 | "Guardar" button                    | `onboarding-save-profile`         |
| Onboarding step 7 | "No lo sé / Prefiero no indicarlo"  | `onboarding-skip-skin-type`       |
| Home              | "Sesión en directo" button          | `home-live-session-button`        |
| Live Session      | Start/Pause/Resume button (dynamic) | `live-session-control`            |
| Live Session      | "Finalizar y registrar" button      | `live-session-finish`             |
| Deletion Request  | "Solicitar eliminación" button      | `deletion-request-submit`         |

**SessionForm** save/cancel buttons are found by `accessibilityLabel` in flows:

- Save: `"Guardar sesión de exposición"`
- Cancel: `"Cancelar registro de sesión"`

**ProfileOptionCard** options (onboarding goals, sensitivity, skin type) are found by their `accessibilityLabel` (the option text), since the component does not expose a `testID` prop.

---

## Deferred Flows

These flows are identified but not yet implemented (require additional setup or are lower risk for v1):

| Flow                                                                                                   | Reason deferred                                                             |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Recovery loop (register session with `slightly_red` or `burned`, verify conservative guidance on Home) | Requires saving a specific session first; better suited to integration test |
| Settings → Notifications toggle                                                                        | Toggle state changes are testable but NotificationToggleRow needs testID    |
| Privacy → Export data                                                                                  | Share sheet interaction requires OS-level flow (complex for Maestro v1)     |
| History → Session detail                                                                               | Session cards don't have testIDs yet; findable by date label                |
| Plan screen                                                                                            | Complex state (requires a plan set); lower crash risk                       |
| Password reset                                                                                         | Requires email access in test environment                                   |

---

## Known Limitations

1. **Supabase auth is real** — flows hit the actual Supabase project. A dedicated dev/staging project is strongly recommended to avoid polluting production data.
2. **Email confirmation** — if enabled, the onboarding flow (flow 04) ends at the "Revisa tu email" screen. Either disable confirmation in the test environment, or pre-confirm the test account.
3. **Location permission dialog** — iOS system dialogs appear outside the app. Maestro's `runFlow:when:visible` handles the "Permitir" button, but it may fail if the dialog text is localized or the dialog was already answered.
4. **UV data** — depends on Open-Meteo availability and device having a real location. Mock UV data is not supported in production builds.
5. **Haptics** — live session haptic feedback (Haptics.notificationAsync) cannot be asserted in Maestro flows.
6. **Notification permission** — iOS will ask for notification permission on first launch. Not handled in flows; dismiss manually before running flows, or pre-grant in simulator settings.

---

## Manual Fallback Checklist

When Maestro flows cannot be run (no device, Maestro not installed), use this manual checklist:

### Critical path (must pass before TestFlight)

- [ ] App launches without crash on physical iPhone
- [ ] Register → email confirmation received → login succeeds
- [ ] Onboarding completes all 8 steps, profile saved in Supabase `profiles` table
- [ ] Home loads with profile data (alias visible in greeting)
- [ ] Location permission prompt appears; granting it loads UV card
- [ ] Denying location: Home still loads, "Índice UV no disponible" appears, no crash
- [ ] "Sesión en directo" tap → UV required message if no forecast, OR live session starts
- [ ] Session Log: fill all fields, tap save, Home returns with acknowledgement
- [ ] History screen shows saved session
- [ ] Settings → Ajustes: profile summary visible
- [ ] Settings → Solicitar eliminación: copy says "máximo de 30 días", not immediate
- [ ] Deletion request: after submit, status shows pending / request confirmation
- [ ] Logout: returns to Welcome screen, token cleared

### Safety-critical assertions

- [ ] Home guidance says **nothing** like "sin riesgo", "garantizado", "seguro" or "dosis segura"
- [ ] Deletion request copy does NOT claim data is deleted immediately
- [ ] Recovery guidance appears when test session is saved with `slightly_red` or `burned`
- [ ] Live session shows "Finalizar y registrar" (not a delete/discard option)

---

## Failure Evidence to Capture

When a flow fails on device, capture:

1. **Screenshot** of the failing state
2. **Device logs** via `expo-dev-client` (visible in the Expo DevTools panel or `npx expo start` terminal)
3. **Supabase logs** (Dashboard → Database → API Logs) for any failed DB operations
4. **Test account state** — check `profiles`, `exposure_sessions`, `data_deletion_requests` tables

---

## What Still Requires Real iPhone/TestFlight

The following can only be validated on a physical device or real TestFlight build:

- Haptic feedback (live session state changes)
- `expo-secure-store` token persistence across app kill (cold start)
- Notification delivery (UV peak alerts, session reminders, streak reminders)
- Location accuracy on real GPS (vs. simulator fake location)
- Share sheet for data export (`.share()` API)
- App Store privacy consent flows
- EAS build metadata (version, build number) in `expo-constants`
- Deep link handling (`bronzeiq://` scheme)

---

## Recommended Next Step

1. Install Maestro on the test machine: `brew install maestro`
2. Create a Supabase **staging project** (free tier) separate from production
3. Create a pre-confirmed test account in the staging project
4. Run flow 01 to verify the basic auth path
5. Run flows 02–05 incrementally
6. Add missing `testID` props to `ProfileOptionCard` if selector stability becomes an issue
