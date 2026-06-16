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

## ⏳ Pendiente — siguiente acción inmediata

**Paso 7 del runbook (variables en EAS).** Falta confirmar:

```bash
eas env:list --environment production
```

→ debe mostrar `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`
(valores = Project URL + anon key del proyecto **staging**). Si no están, crearlas:

```bash
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --environment production
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --environment production
```

## 🍏 Bloqueado por Apple (Día D)

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
