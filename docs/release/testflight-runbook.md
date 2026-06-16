# Bronze IQ — Runbook de TestFlight (instalar en iPhone vía App Store)

La guía única "haz esto en orden" para llevar la app **ya construida** a tu iPhone a
través de **TestFlight** (el canal oficial de Apple para probar la app desde la
infraestructura de la App Store, sin revisión pública pesada).

Todo lo que necesitas está aquí o enlazado. No deberías necesitar el historial de
chat.

- **Build interno / perfiles EAS**: [`../internal-build.md`](../internal-build.md)
- **Checklist de QA en iPhone (guion de pruebas)**: [`../qa/RC-2-iPhone-integration-checklist.md`](../qa/RC-2-iPhone-integration-checklist.md)
- **Setup del backend de staging**: [`../qa/e2e-staging-setup.md`](../qa/e2e-staging-setup.md)
- **Semilla de datos de staging**: [`../qa/e2e-staging-seed.md`](../qa/e2e-staging-seed.md)

---

## Decisiones fijadas

| Decisión             | Valor                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Canal de instalación | **TestFlight** (no App Store pública todavía)                         |
| Plataforma           | **iOS** (el objetivo "instalar desde la App Store")                   |
| Backend              | **Staging** (proyecto Supabase aislado — no toca datos de producción) |
| Bundle ID            | `com.bronzeiq.app` (en `app.config.ts`)                               |
| Versión              | `1.0.0` (`app.config.ts`); buildNumber lo auto-incrementa EAS         |

**Por qué staging garantiza paridad total:** la app solo usa 4 tablas
(`profiles`, `exposure_sessions`, `tanning_plans`, `deletion_requests`) + auth
email/password. No usa RPC, Storage, Realtime ni invoca Edge Functions desde el
cliente. Con las 2 migraciones aplicadas, staging tiene **todo** lo que la app
necesita. El resto (UV, ubicación, notificaciones, recomendaciones, plan,
recovery, logros…) es cálculo en cliente o capacidades del dispositivo, idénticos
sea cual sea el backend.

---

## Estado del repo (verde, requisito previo)

Antes de cualquier build, estos tres deben pasar (ya verificado):

```bash
npm run typecheck   # exit 0
npm run lint        # exit 0
npm test            # 856 tests / 79 suites, todos pasan
```

Si alguno falla tras un cambio, **no construyas** hasta arreglarlo.

---

## Fase B — Cuentas (una sola vez)

- [ ] **Apple Developer Program** activo ($99/año). Comprobar en
      [developer.apple.com/account](https://developer.apple.com/account):
      sección **Membership** con un _Team_ activo. La activación tras el pago
      puede tardar **24–48h**.
- [ ] Acceso a [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
      (aquí aparece TestFlight).
- [ ] **EAS CLI** instalado y logueado (comandos abajo).
- [ ] **UDID no es necesario** para builds de App Store / TestFlight (eso era
      solo para builds ad-hoc `preview`). TestFlight instala sin registrar el
      dispositivo.

```bash
npm install -g eas-cli
eas --version      # ≥ 13.0.0
eas login
eas whoami         # debe devolver: enriquecerrolaza
```

---

## Fase C — Backend de staging conectado a la build

### 1. Staging operativo

Completa, en este orden, lo de
[`e2e-staging-setup.md`](../qa/e2e-staging-setup.md) y
[`e2e-staging-seed.md`](../qa/e2e-staging-seed.md):

- [ ] Proyecto Supabase de staging creado (separado de producción).
- [ ] Las 2 migraciones aplicadas → 4 tablas con RLS.
- [ ] **Authentication → Providers → Email** habilitado.
- [ ] Usuario de prueba creado y **confirmado**
      (Authentication → Add user → _Auto Confirm_).
- [ ] Perfil + plan sembrados (seed) para que la app tenga estado al entrar.

### 2. Variables de entorno en EAS (entorno `production`)

`eas secret:create` está **deprecado**. Usa `eas env:create` (pide el valor de
forma interactiva; no se imprime en logs):

```bash
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --environment production
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --environment production
```

Pega como valores el **Project URL** y el **anon public key** del proyecto de
**staging** (Settings → API en el dashboard de Supabase).

> El perfil `production` de `eas.json` añade `EXPO_PUBLIC_APP_ENV=production`
> automáticamente. **Nunca** pongas `SUPABASE_SERVICE_ROLE_KEY` en EAS ni en el
> cliente.

Verifica que quedaron registradas:

```bash
eas env:list --environment production
```

---

## Fase D — Build y subida a TestFlight

### 1. Compilar el binario de App Store (en la nube de EAS)

```bash
eas build --platform ios --profile production
```

- La primera vez, EAS pregunta por las credenciales de Apple y **genera el
  certificado de distribución y el provisioning profile automáticamente**
  (deja que EAS los gestione — opción recomendada).
- El build corre en la nube; tarda ~10–20 min. Sigue el progreso en
  [expo.dev/builds](https://expo.dev/builds) o en la terminal.

### 2. Subir a App Store Connect / TestFlight

```bash
eas submit --platform ios --latest
```

- La primera vez, EAS pregunta el **Apple ID** y, si no existe, puede **crear la
  app en App Store Connect** automáticamente (acepta).
- Tras subir, App Store Connect **procesa** el build (~5–30 min). Recibirás un
  email cuando esté listo en TestFlight.

> Opcional: tras el primer `submit`, puedes guardar `ascAppId` / `appleTeamId` en
> `eas.json` (sección `submit.production.ios`) para que las siguientes subidas no
> pregunten nada.

---

## Fase E — Instalar en el iPhone y probar

1. App Store Connect → tu app → pestaña **TestFlight**.
2. Si pide **información de cumplimiento de exportación (encryption)**: la app no
   usa criptografía no exenta → responde **No**.
3. **Internal Testing** → añade tu Apple ID como tester (los testers internos no
   requieren revisión de Apple; disponibles en minutos).
4. En el iPhone: instala la app **TestFlight** desde la App Store → acepta la
   invitación (llega por email) → **Instala Bronze IQ**.
5. Abre Bronze IQ y ejecuta el guion de pruebas:
   [`RC-2-iPhone-integration-checklist.md`](../qa/RC-2-iPhone-integration-checklist.md)
   (Secciones 1–12).

---

## Criterio de "instalada de 10" (Go)

- [ ] La app se instala desde TestFlight sin errores.
- [ ] Arranque en frío → Welcome sin crash.
- [ ] Alta + onboarding completo → llega a Home (fila en `profiles` de staging).
- [ ] Registrar sesión → aparece en Historial (fila en `exposure_sessions`).
- [ ] Recomendación, plan, recovery y logros se renderizan.
- [ ] Permisos de ubicación y notificaciones se piden y se gestionan sin crash.
- [ ] Sesión persiste tras cerrar y reabrir (SecureStore).
- [ ] Sin copy no permitido ("dosis segura", "sin riesgo", "diagnóstico", etc.).

Si algo falla: captura la evidencia (Sección "What to Capture" del checklist de
QA) y se arregla en una pasada de fix sobre la rama, luego se repite Fase D.

---

## Errores frecuentes → dónde mirar

| Síntoma                                 | Causa / arreglo                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `eas build` "You are not logged in"     | `eas login` y reintenta.                                                                 |
| Build falla pidiendo credenciales Apple | Apple Developer aún no activo (24–48h) o Apple ID sin acceso al Team.                    |
| `Network request failed` en la app      | Variables EAS `production` sin poner, o proyecto Supabase en pausa (Free se auto-pausa). |
| El build no aparece en TestFlight       | App Store Connect aún procesando; espera el email. Revisa "Encryption compliance".       |
| App entra pero sin datos                | Falta seed del perfil/plan en staging (ver `e2e-staging-seed.md`).                       |

Más troubleshooting detallado en
[`../qa/RC-2-iPhone-integration-checklist.md`](../qa/RC-2-iPhone-integration-checklist.md).
