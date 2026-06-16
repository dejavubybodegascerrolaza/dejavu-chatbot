#!/usr/bin/env node
/**
 * check-e2e-env.mjs
 *
 * Pre-flight check before running Maestro E2E smoke tests.
 * Validates that required env vars are set and non-placeholder.
 *
 * Safe by design:
 *   - Never prints secret values
 *   - Never connects to Supabase
 *   - Never uses service_role key
 *   - Read-only — no side effects
 *
 * Usage:
 *   npm run e2e:check
 *   node scripts/check-e2e-env.mjs
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Load .env.local (if present) ─────────────────────────────────────────────
// CI environments inject vars directly; .env.local is for local dev.
// Maestro credentials (BRONZE_IQ_TEST_*) must be passed via -e flags to maestro,
// not stored in any file.
try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const eqIdx = trimmed.indexOf('=')
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && val && !process.env[key]) {
      process.env[key] = val
    }
  }
} catch {
  // .env.local is optional — CI injects vars without it
}

// ── Placeholder detection ─────────────────────────────────────────────────────
const PLACEHOLDER_TOKENS = ['your-', 'your_', 'placeholder', 'example', 'change-me', 'xxx']

function isPlaceholder(val) {
  const lower = val.toLowerCase()
  return PLACEHOLDER_TOKENS.some((t) => lower.includes(t))
}

// ── Checker ───────────────────────────────────────────────────────────────────
let allOk = true

function checkVar(name, { optional = false } = {}) {
  const val = process.env[name]
  if (!val) {
    if (optional) {
      console.log(`  ○ ${name} — not set (optional)`)
    } else {
      console.error(`  ✗ ${name} — NOT SET`)
      allOk = false
    }
    return null
  }
  if (isPlaceholder(val)) {
    console.warn(`  ⚠ ${name} — looks like a placeholder (update with real staging value)`)
    allOk = false
    return null
  }
  // Print only first 4 chars of potentially sensitive values, masked
  const hint =
    name.toLowerCase().includes('key') || name.toLowerCase().includes('url')
      ? ` (${val.slice(0, 12)}…)`
      : ''
  console.log(`  ✓ ${name}${hint} — set`)
  return val
}

// ── App env vars ──────────────────────────────────────────────────────────────
console.log('\n── App env vars (.env.local → staging Supabase) ───────────────')
const supabaseUrl = checkVar('EXPO_PUBLIC_SUPABASE_URL')
checkVar('EXPO_PUBLIC_SUPABASE_ANON_KEY')
checkVar('EXPO_PUBLIC_APP_ENV', { optional: true })

// ── Staging safety check ──────────────────────────────────────────────────────
console.log('\n── Staging safety check ────────────────────────────────────────')
if (supabaseUrl) {
  const lowerUrl = supabaseUrl.toLowerCase()
  const looksStaging = ['staging', 'test', 'dev', 'e2e', 'qa'].some((t) => lowerUrl.includes(t))
  if (looksStaging) {
    console.log('  ✓ Supabase URL contains a staging/test/dev indicator — looks correct')
  } else {
    console.warn('  ⚠ Supabase URL does not contain "staging", "test", "dev", "e2e", or "qa"')
    console.warn('    Confirm this is NOT the production project before running E2E tests.')
    console.warn('    If this is intentional, ignore this warning.')
  }
}

// ── Maestro credentials note ──────────────────────────────────────────────────
console.log('\n── Maestro credentials ─────────────────────────────────────────')
console.log('  Maestro test credentials (BRONZE_IQ_TEST_EMAIL / BRONZE_IQ_TEST_PASSWORD)')
console.log('  must be passed via -e flags at runtime — never stored in files.')
console.log('  Example:')
console.log('    maestro test .maestro/01-smoke-login-to-home.yaml \\')
console.log('      -e BRONZE_IQ_TEST_EMAIL=e2e@bronzeiq.test \\')
console.log('      -e BRONZE_IQ_TEST_PASSWORD=YourStagingPassword!')

// ── Result ────────────────────────────────────────────────────────────────────
console.log('\n── Result ──────────────────────────────────────────────────────')
if (allOk) {
  console.log('  ✅ App env is ready. Run the smoke flow as shown above.\n')
  process.exit(0)
} else {
  console.error('  ❌ Some vars are missing or invalid. Fix the issues above,')
  console.error('     then re-run: npm run e2e:check\n')
  process.exit(1)
}
