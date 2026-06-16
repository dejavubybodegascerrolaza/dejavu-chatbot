# Bronze IQ — App Privacy Inventory

**Status:** Internal draft · RC-2S audit  
**Purpose:** Basis for App Store Connect privacy label and Google Play data safety form  
**Scope:** Reflects only what is actually implemented in the codebase at this revision.  
Do not add items that are not confirmed by the source code.

---

## Data Collected

### 1. Account Credentials

| Attribute      | Detail                                             |
| -------------- | -------------------------------------------------- |
| Data type      | Email address + password (hashed by Supabase Auth) |
| Collection     | User-provided at sign-up                           |
| Purpose        | Authentication only                                |
| Linked to user | Yes (auth.users table, managed by Supabase Auth)   |
| Used for ads   | No                                                 |
| Retention      | Until deletion request is processed (max 30 days)  |
| Third parties  | Supabase (processor, not controller)               |

---

### 2. User Profile

| Attribute      | Detail                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Data type      | Alias (optional), main goal (enum), sun sensitivity (enum), skin type / Fitzpatrick (optional, 1–6) |
| Collection     | User-provided during onboarding and edit-profile                                                    |
| Purpose        | Personalising conservative exposure estimates; adjusting guidance thresholds                        |
| Linked to user | Yes (profiles table, keyed on user ID)                                                              |
| Used for ads   | No                                                                                                  |
| Health data    | Skin type / Fitzpatrick is a biometric proxy. Treated as sensitive. No clinical interpretation.     |
| Retention      | Until deletion request is processed                                                                 |

---

### 3. Exposure Sessions

| Attribute       | Detail                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Data type       | Date, duration (minutes), protection level (enum), UV bucket (enum), skin response after (enum), exposure context (enum), optional free-text notes (max 500 chars) |
| Collection      | User-provided (manual log or prefilled from live session timer)                                                                                                    |
| Purpose         | Powering the safety streak, adherence tracking, conservative plan adjustment, history insights                                                                     |
| Linked to user  | Yes (exposure_sessions table)                                                                                                                                      |
| Used for ads    | No                                                                                                                                                                 |
| Free-text notes | Stored as entered. Never sent to external services. Never used for algorithmic decisions.                                                                          |
| Retention       | Until deletion request is processed                                                                                                                                |

---

### 4. Tanning Plan

| Attribute      | Detail                                                       |
| -------------- | ------------------------------------------------------------ |
| Data type      | Goal tan level (enum), current level (enum), start date      |
| Collection     | User-provided in the Plan screen                             |
| Purpose        | Generating conservative ETA estimates and adherence tracking |
| Linked to user | Yes (tanning_plans table)                                    |
| Used for ads   | No                                                           |
| Retention      | Until deletion request is processed                          |

---

### 5. Location (Coarse)

| Attribute      | Detail                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------- |
| Data type      | Latitude / longitude at session load time                                                    |
| Collection     | Device-derived, requires iOS "While Using" permission                                        |
| Purpose        | Fetching the UV index for the user's approximate area from a weather/UV API                  |
| Stored         | **Not stored.** Coordinates are used in-memory to query UV; not persisted to Supabase.       |
| Linked to user | No — coordinates are transient                                                               |
| Used for ads   | No                                                                                           |
| Tracking       | No                                                                                           |
| Notes          | Permission string: "Bronze IQ usa tu ubicación para mostrarte el índice UV real de tu zona." |

---

### 6. UV Forecast Data

| Attribute      | Detail                                                                |
| -------------- | --------------------------------------------------------------------- |
| Data type      | UV index, forecast window (fetched from UV API)                       |
| Collection     | Device-derived via location + UV API                                  |
| Stored         | **Not stored.** Held in in-memory Zustand store; cleared on sign-out. |
| Linked to user | No                                                                    |

---

### 7. Deletion Requests

| Attribute        | Detail                                                            |
| ---------------- | ----------------------------------------------------------------- |
| Data type        | User ID, requested-at timestamp, status (pending / processed)     |
| Collection       | Created when user submits a deletion request                      |
| Purpose          | Tracking compliance with GDPR/App Store data deletion obligations |
| Linked to user   | Yes (deletion_requests table)                                     |
| Processing time  | Manual — maximum 30 days per in-app disclosure                    |
| Instant deletion | No — request-based only                                           |

---

### 8. Consent Log

| Attribute      | Detail                                           |
| -------------- | ------------------------------------------------ |
| Data type      | Disclaimer acceptance timestamp + version        |
| Collection     | Recorded at onboarding completion                |
| Purpose        | Legal basis for processing; App Store compliance |
| Linked to user | Yes (stored in profiles.consent_given_at)        |
| Deletion       | Anonymised (not deleted) to maintain audit trail |

---

## Data NOT Collected

The following are **not collected** in the current codebase:

| Item                          | Confirmation                                                            |
| ----------------------------- | ----------------------------------------------------------------------- |
| Photos or camera images       | Camera API never called; NSCameraUsageDescription removed               |
| Device identifier (IDFA/IDFV) | No analytics SDK; no ad network                                         |
| Health app / HealthKit data   | Not integrated                                                          |
| Precise GPS tracking          | Location used once per session load, not tracked over time              |
| Payment or financial data     | No payment flow in MVP                                                  |
| Contacts or address book      | Not accessed                                                            |
| Microphone or audio           | Not accessed                                                            |
| Biometric authentication data | Not used (SecureStore holds JWT, not biometrics)                        |
| Push notification tokens      | Tokens managed locally by expo-notifications; not sent to custom server |

---

## Third Parties

| Service    | Role                                       | Data shared                                                   | Privacy policy       |
| ---------- | ------------------------------------------ | ------------------------------------------------------------- | -------------------- |
| Supabase   | Backend / Auth (BaaS)                      | Auth credentials, profile, sessions, plans, deletion requests | supabase.com/privacy |
| Expo / EAS | App distribution (dev/preview builds only) | Build artifacts, not user data                                | expo.dev/privacy     |

No analytics SDK, advertising network, crash-reporting SDK, or data-broker is integrated.

---

## App Store Connect Privacy Label — Open Questions

Before completing the App Store privacy label, confirm the following:

1. **UV data source**: Which UV API does the app query? Is it a first-party Supabase Edge Function or a third-party API? If third-party, add it to the Third Parties table above.

2. **Supabase data residency**: Which Supabase region hosts this project? Relevant for GDPR adequacy.

3. **Skin type as sensitive health data**: Apple may classify Fitzpatrick skin type as health/fitness data. Confirm the privacy label category. Current position: it is "user-provided wellness preference," not a medical record.

4. **Deletion SLA**: The app says "máximo 30 días." This must match the actual processing commitment. Currently manual — document the process owner.

5. **Session notes free text**: Notes are user-entered and stored. Confirm they are never indexed, searched, or sent to any external service (currently confirmed by code review).

6. **Notification content**: Notification bodies include streak count (a derived behavioural metric). Confirm this does not constitute "sensitive" data under GDPR / CCPA.

---

## App Store Privacy Label Summary (draft)

Based on the inventory above, Bronze IQ should declare:

| Category                     | Collected | Linked to identity | Used for tracking |
| ---------------------------- | --------- | ------------------ | ----------------- |
| Name (alias)                 | Yes       | Yes                | No                |
| Email address                | Yes       | Yes                | No                |
| Health & Fitness (skin type) | Yes       | Yes                | No                |
| User content (notes)         | Yes       | Yes                | No                |
| Identifiers (user ID)        | Yes       | Yes                | No                |
| Location (coarse, transient) | Yes       | No                 | No                |
| Usage data (session metrics) | Yes       | Yes                | No                |

**Tracking:** No. No cross-app tracking, no advertising.  
**Data sale:** No.

---

_Last updated: RC-2S audit — 2026-06-16_
