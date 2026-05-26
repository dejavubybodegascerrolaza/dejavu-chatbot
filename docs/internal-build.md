# Bronze IQ — Build Interno

Guía para generar builds instalables en dispositivo físico mediante EAS Build.

---

## Objetivo

Obtener un binario instalable (`.apk` en Android, `.ipa` ad-hoc en iOS) de Bronze IQ para pruebas internas en dispositivo real, sin publicar en App Store ni Google Play.

---

## Perfiles EAS

Definidos en `eas.json`:

| Perfil        | Propósito                                        | Distribución                                     |
| ------------- | ------------------------------------------------ | ------------------------------------------------ |
| `development` | Build con Expo Dev Client para desarrollo activo | Internal (requiere app instalada)                |
| `preview`     | Build instalable directamente en dispositivo     | Internal — APK en Android, ad-hoc en iOS         |
| `production`  | Build para submission a tiendas                  | Store — **no ejecutar sin aprobación explícita** |

### `development`

Incluye el Expo Dev Client. Permite conectar al servidor de desarrollo con hot reload. Útil para desarrollo, no para QA final.

### `preview`

El perfil para distribución interna. En Android genera un `.apk` directamente instalable. En iOS genera un `.ipa` ad-hoc (requiere registro del UDID del dispositivo en Apple Developer).

### `production`

Preparado pero **no se debe ejecutar** hasta aprobación explícita. Genera el binario optimizado para submission a App Store y Google Play.

---

## Prerrequisitos

### Todos los builds

- [ ] Cuenta en [expo.dev](https://expo.dev) (gratis para empezar)
- [ ] EAS CLI instalado: `npm install -g eas-cli`
- [ ] Login: `eas login`
- [ ] Proyecto vinculado: `eas build:configure` (genera `extra.eas.projectId` en app.config.ts)
- [ ] Variables de entorno en `.env.local` (ver `.env.example`)
- [ ] Las variables `EXPO_PUBLIC_*` deben configurarse también en EAS si se usan en builds cloud:
  ```
  eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
  eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
  ```

### Build Android (preview)

- [ ] Sin requisitos adicionales para `.apk`
- [ ] Habilitar "Instalar apps de fuentes desconocidas" en el dispositivo Android si se distribuye el APK por enlace directo

### Build iOS (preview)

- [ ] Apple Developer Account (pago, $99/año)
- [ ] UDID del dispositivo iOS registrado en [developer.apple.com](https://developer.apple.com)
- [ ] EAS puede gestionar el provisioning profile automáticamente con `--auto-submit-with-apple-id` o de forma interactiva
- [ ] Alternativamente: distribución interna via Expo Dev Client si se prefiere evitar Apple Developer

---

## Comandos

```bash
# 1. Login en Expo
eas login

# 2. Vincular proyecto (solo primera vez — añade projectId a app.config.ts)
eas build:configure

# 3. Build Android preview (genera APK instalable)
eas build --platform android --profile preview

# 4. Build iOS preview (requiere Apple Developer + dispositivo registrado)
eas build --platform ios --profile preview

# 5. Build ambas plataformas a la vez
eas build --platform all --profile preview
```

O usando los scripts de `package.json`:

```bash
npm run build:preview:android
npm run build:preview:ios
npm run build:preview:all
```

> **No ejecutar:** `eas submit` ni `eas build --profile production` sin aprobación explícita.

---

## Variables de entorno en EAS

Las variables `EXPO_PUBLIC_*` están incluidas en el bundle del cliente (no son secretas). Para builds cloud, deben configurarse en EAS:

```bash
# Configurar secrets en EAS (una vez, por proyecto)
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://tu-proyecto.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-anon-key"
```

> `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** debe añadirse al cliente ni a los builds móviles.

---

## Assets provisionales

Los siguientes assets son provisionales para build interno. Deben sustituirse por diseño final antes de submission formal:

| Asset                         | Ruta                                 | Tamaño    | Estado      |
| ----------------------------- | ------------------------------------ | --------- | ----------- |
| Icono app                     | `assets/icon.png`                    | 1024×1024 | Provisional |
| Splash screen                 | `assets/splash-icon.png`             | 1024×1024 | Provisional |
| Android adaptive (foreground) | `assets/android-icon-foreground.png` | 512×512   | Provisional |
| Android adaptive (monochrome) | `assets/android-icon-monochrome.png` | 432×432   | Provisional |

---

## Bundle / Package Identifiers

Configurados en `app.config.ts`:

- iOS: `com.bronzeiq.app`
- Android: `com.bronzeiq.app`

> Estos identificadores son provisionales. Deben confirmarse antes de submission formal a App Store y Google Play. Una vez publicado con un Bundle ID, **no puede cambiarse**.

---

## Checklist de prueba en dispositivo físico

Una vez instalado el build de preview, verificar en orden:

### Flujo completo

1. [ ] Abrir app desde cero (cold start)
2. [ ] Splash screen visible durante la carga inicial
3. [ ] Sin sesión previa → pantalla de bienvenida
4. [ ] Crear cuenta nueva con email/password
5. [ ] Completar onboarding completo (disclaimer → alias → objetivo → sensibilidad → fototipo)
6. [ ] Llegar a Home con recomendación generada
7. [ ] Registrar una sesión de exposición (todos los campos)
8. [ ] Verificar que la sesión aparece en "Hoy" en Home
9. [ ] Pull-to-refresh en Home → recarga sin errores
10. [ ] Ir a Historial
11. [ ] Pull-to-refresh en Historial → recarga lista
12. [ ] Abrir el detalle de una sesión
13. [ ] Header nativo visible con botón back
14. [ ] Eliminar la sesión con confirmación
15. [ ] Volver al historial → sesión eliminada
16. [ ] Ir a Ajustes
17. [ ] Editar alias/perfil → cambio visible en Settings
18. [ ] Abrir Disclaimer → texto visible
19. [ ] Abrir Eliminar mis datos → confirmar solicitud
20. [ ] Cerrar sesión
21. [ ] Reabrir app → pantalla de bienvenida (sesión no persistida)
22. [ ] Login con cuenta existente → Home carga correctamente
23. [ ] Reabrir app sin cerrar sesión → Home carga directamente (SecureStore OK)

### Casos específicos de dispositivo

24. [ ] Safe Area en iPhone con notch / Dynamic Island — sin solapamientos
25. [ ] Safe Area en Android con perforación de cámara
26. [ ] Teclado en formularios — no cubre campos activos
27. [ ] Orientación portrait bloqueada correctamente
28. [ ] Sin conexión — error state visible, no crash
29. [ ] Vuelta a conexión — datos cargan correctamente
30. [ ] Modo oscuro del sistema — app mantiene light mode (userInterfaceStyle: 'light')

---

## Riesgos conocidos

| Riesgo                               | Detalle                                                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **RLS sin test automatizado real**   | Las políticas SQL existen pero no se ha verificado con JWT real de usuario B vs usuario A en entorno de producción    |
| **Eliminación real no implementada** | `deletion_requests` registra la intención pero no ejecuta el borrado. Requiere Edge Function con `service_role`       |
| **Apple Privacy Nutrition Label**    | Pendiente antes de submission formal a App Store                                                                      |
| **Assets provisionales**             | Icono y splash actuales son para build interno, no para publicación                                                   |
| **iOS requiere Apple Developer**     | Build preview iOS necesita cuenta de pago y registro de dispositivo                                                   |
| **Android fuentes externas**         | El APK preview puede requerir habilitar instalación desde fuentes externas                                            |
| **`consent_log` ausente**            | El consentimiento se registra en `profiles.disclaimer_accepted_at` pero no en tabla append-only separada (base legal) |
| **Historial sin paginación**         | Con muchas sesiones, `getSessionsByUserId` carga todas sin límite                                                     |

---

## Siguiente paso: Fase 11B

Una vez aprobada la Fase 11A, la Fase 11B ejecuta los builds reales:

1. `eas login` con cuenta Expo del proyecto
2. `eas build:configure` para vincular proyecto (añade `projectId`)
3. Configurar secrets en EAS (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
4. `eas build --platform android --profile preview` → obtener APK
5. Instalar APK en dispositivo Android y ejecutar checklist
6. Si iOS: registrar UDID, `eas build --platform ios --profile preview`
7. Instalar IPA y ejecutar checklist en iOS
