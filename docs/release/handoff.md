# Bronze IQ — Punto de retomada (checkpoint de sesión)

> **Fecha del checkpoint:** 2026-06-16
> Estado de un vistazo para retomar sin releer el historial. Guía completa:
> [`testflight-runbook.md`](./testflight-runbook.md).

## Objetivo

Instalar Bronze IQ (ya construida) en el iPhone vía **TestFlight**, apuntando a un
backend de **staging** aislado.

## ✅ Hecho

- **Repo listo para release** (rama `claude/bronze-iq-mvp-architecture-uioho`):
  - Código en verde: `typecheck`, `lint`, `test` (856 tests).
  - `version = 1.0.0`; `ios.config.usesNonExemptEncryption = false`.
  - `eas.json`: perfiles cableados a su `environment`.
  - Assets verificados (icono 1024² RGB sin alpha).
  - Runbook de TestFlight creado.
- **Backend staging (Supabase) operativo:**
  - 4 tablas migradas con RLS (`profiles`, `exposure_sessions`,
    `tanning_plans`, `deletion_requests`).
  - Proveedor **Email** activo.
  - Usuario de prueba `e2e@bronzeiq.test` creado y **confirmado**.
  - Seed aplicado: perfil (`onboarding_completed=true`) + plan activo
    (`goal_level=bronze`). Verificado.
- **Variables en EAS (Expo) configuradas** vía web (Environment Variables,
  entorno **Production**), apuntando al proyecto staging
  `lrmyljxjevvpqxexhukb`:
  - `EXPO_PUBLIC_SUPABASE_URL` = `https://lrmyljxjevvpqxexhukb.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = anon/public key del proyecto staging

> **Todo lo que no depende de Apple está HECHO.** Solo queda el Día D.

## 🍏 Bloqueado por Apple (Día D) — única acción pendiente

Apple Developer pagado el 2026-06-15 (~24h); **comprobar activación** en
developer.apple.com/account (Membership → Team activo). Cuando esté lista:

```bash
eas login
eas build --platform ios --profile production
eas submit --platform ios --latest
```

Luego: App Store Connect → TestFlight → Internal Testing → añadirse como tester →
instalar app TestFlight en el iPhone → instalar Bronze IQ → ejecutar el guion de
QA (`../qa/RC-2-iPhone-integration-checklist.md`).
