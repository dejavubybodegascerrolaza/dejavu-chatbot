# Bronze IQ

A mobile app for iOS and Android that helps users make informed, responsible decisions about sun exposure and tanning. Built with React Native + Expo, TypeScript, and Supabase.

> **Important:** Bronze IQ is a wellness tool, not a medical product. It does not provide medical advice, diagnosis, or treatment. Always consult a healthcare professional for skin health concerns.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v22+ (use [nvm](https://github.com/nvm-sh/nvm))
- [Expo Go](https://expo.dev/go) app on your device or a simulator
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local database)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Supabase)

---

## Quick Start

```bash
nvm use                        # switch to Node 22
npm install                    # install dependencies
cp .env.example .env.local     # copy and fill in environment variables
npm run dev                    # start the Expo development server
```

Open the app with [Expo Go](https://expo.dev/go) by scanning the QR code, or press `i` for iOS Simulator / `a` for Android Emulator.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

| Variable                         | Required | Description                                      |
| -------------------------------- | -------- | ------------------------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`       | Yes      | Your Supabase project URL                        |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`  | Yes      | Your Supabase anon public key                    |
| `EXPO_PUBLIC_APP_ENV`            | No       | `development` / `preview` / `production`         |
| `EXPO_PUBLIC_DISCLAIMER_VERSION` | No       | Version of the disclaimer text (default: `v1.0`) |

> **Security:** Variables prefixed with `EXPO_PUBLIC_` are bundled into the client app. Never put secrets in these variables. The Supabase `service_role` key is never used in the mobile app — only in Edge Functions.

---

## Development Commands

```bash
npm run dev          # start Expo dev server
npm run lint         # run ESLint
npm run lint:fix     # run ESLint with auto-fix
npm run format       # run Prettier on all files
npm run typecheck    # run TypeScript type checking
npm run test         # run Jest test suite
npm run test:coverage  # run tests with coverage report
```

---

## Project Structure

```
app/               Expo Router file-based routes (routing only, no business logic)
  (auth)/          Unauthenticated screens (welcome, sign-in, sign-up, onboarding)
  (app)/           Authenticated screens (home, sessions, settings)
src/
  components/      Shared UI components (atoms, molecules, feedback)
  features/        Feature modules (auth, profile, sessions, recommendations)
  services/        Domain/business logic — pure TypeScript, no React
  repositories/    Data access layer — Supabase abstraction + mock implementations
  lib/             Core library setup (Supabase client, env validation)
  types/           Zod schemas (source of truth) + inferred TypeScript types
  hooks/           Shared cross-feature hooks
  utils/           Pure utility functions
  constants/       Design tokens, Fitzpatrick data, routes, config
  design-system/   Theme, typography, spacing definitions
supabase/
  migrations/      SQL migration files (numbered, checked into git)
  functions/       Supabase Edge Functions
__tests__/
  unit/            Unit tests for services and utilities
  integration/     Integration tests against local Supabase
```

---

## Supabase Setup (Local)

```bash
supabase start           # start local Postgres + Auth + Studio
supabase db push         # apply migrations
supabase db seed         # load seed data
```

Local Supabase Studio is available at `http://localhost:54323`.

To reset to a clean state:

```bash
supabase db reset
```

---

## Architecture

Bronze IQ uses a strict layered architecture with one-directional dependency flow:

```
Screen → Hook → Service → Repository → Supabase
```

Screens never call Supabase directly. This allows the data layer to be mocked in tests without touching any screen or business logic code.

See the [technical plan](/root/.claude/plans/prompt-1-arranque-goofy-dahl.md) for the full architecture documentation.

---

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add exposure session logging
fix: correct SPF picker value mapping
chore: update dependencies
docs: improve setup instructions
test: add recommendation service unit tests
```

Commits that do not follow this format are rejected by the pre-commit hook.

---

## Security & Privacy

- User data is protected by PostgreSQL Row Level Security (RLS) at the database layer
- Auth tokens are stored in `expo-secure-store`, never in AsyncStorage
- No sensitive data (skin type, session notes) appears in production logs
- The Supabase `service_role` key is never used in the mobile app
- Users can request full data deletion from within the app (Settings → Privacy)

---

## License

Proprietary — all rights reserved.
