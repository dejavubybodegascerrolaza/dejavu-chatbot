# Bronze IQ — Domain Model

## Entidades principales

### Profile

Perfil del usuario. Una fila por cuenta de usuario (1:1 con `auth.users`).

| Campo                     | Tipo TypeScript    | Notas                                                            |
| ------------------------- | ------------------ | ---------------------------------------------------------------- |
| `id`                      | `UUID`             | Igual a `auth.users.id`                                          |
| `alias`                   | `string`           | 2-30 chars, opcional en onboarding pero requerido antes del home |
| `mainGoal`                | `MainGoal`         | Por qué usa la app                                               |
| `sunSensitivity`          | `SunSensitivity`   | Autoevaluación del usuario                                       |
| `skinType`                | `SkinType \| null` | Fitzpatrick 1-6, opcional                                        |
| `onboardingCompleted`     | `boolean`          | Flag de acceso a la app principal                                |
| `disclaimerAcceptedAt`    | `string \| null`   | ISO datetime del momento de aceptación                           |
| `createdAt` / `updatedAt` | `string`           | ISO datetime                                                     |

**Decisión de diseño:** el email no es parte de `Profile`. Pertenece a `auth.users` y se obtiene desde la sesión de Supabase Auth.

**Decisión de diseño:** no existe `ConsentLog` como entidad persistente en el MVP. El consentimiento del disclaimer se registra en `disclaimerAcceptedAt`. Si en el futuro se requiere auditoría de consentimientos (e.g., GDPR avanzado, cambios de versión de disclaimer), se creará una tabla `consent_log` append-only.

---

### ExposureSession

Sesión de exposición solar registrada por el usuario.

| Campo                     | Tipo TypeScript   | Notas                                        |
| ------------------------- | ----------------- | -------------------------------------------- |
| `id`                      | `UUID`            |                                              |
| `userId`                  | `UUID`            | FK → `auth.users.id`                         |
| `sessionDate`             | `ISODateString`   | `YYYY-MM-DD`, sin hora (suficiente para MVP) |
| `durationMinutes`         | `number`          | Entero 1-300                                 |
| `context`                 | `ExposureContext` | Tipo de lugar                                |
| `uvIndexManual`           | `number \| null`  | Entero 0-11, opcional                        |
| `protectionLevel`         | `ProtectionLevel` | Protección declarada                         |
| `sensationAfter`          | `SensationAfter`  | Cómo notó la piel el usuario                 |
| `notes`                   | `string \| null`  | Máximo 500 chars                             |
| `createdAt` / `updatedAt` | `string`          | ISO datetime                                 |

---

### DataDeletionRequest

Solicitud de eliminación de datos del usuario. Procesamiento manual para el MVP.

| Campo         | Tipo TypeScript             | Notas                          |
| ------------- | --------------------------- | ------------------------------ |
| `id`          | `UUID`                      |                                |
| `userId`      | `UUID`                      |                                |
| `requestedAt` | `string`                    | ISO datetime                   |
| `status`      | `DataDeletionRequestStatus` | `pending` o `processed`        |
| `processedAt` | `string \| null`            | ISO datetime cuando se procesa |

El texto en la app indica: "procesaremos tu solicitud en un máximo de 30 días."

---

## Enums

### MainGoal

```
gradual_bronze       → Bronceado gradual y controlado
avoid_overexposure   → Evitar exceso de exposición
track_sessions       → Llevar registro de sesiones
conscious_routine    → Construir una rutina más consciente
```

### SunSensitivity

```
low        → Piel poco sensible
medium     → Sensibilidad normal
high       → Bastante sensible
very_high  → Muy sensible al sol
```

### SkinType

Escala Fitzpatrick: `1` (más clara) a `6` (más oscura). Siempre opcional.

### ExposureContext

```
beach         → Playa
pool          → Piscina
urban         → Ciudad / terraza urbana
terrace_garden → Terraza o jardín privado
outdoor_sport → Deporte al aire libre
other         → Otro
```

### ProtectionLevel

```
high      → Protección alta (SPF 50+)
medium    → Protección media (SPF 15-30)
none      → Sin protección
unknown   → No sabe / no recuerda
not_sure  → No está seguro
```

### SensationAfter

```
great        → Muy bien, sin señales
normal       → Normal, sin molestias
warm_tight   → Piel caliente o tirante
slightly_red → Algo enrojecida
burned       → Quemadura clara
```

---

## Motor de Recomendación

### Principios

- **Determinista:** misma entrada → misma salida. Sin aleatoriedad, sin IA.
- **Auditable:** todos los factores están documentados en `recommendation.rules.ts`.
- **Prudente por defecto:** en caso de duda, se recomienda menos exposición.
- **Sin diagnóstico:** las recomendaciones son orientativas. Nunca usan lenguaje como "seguro", "sin riesgo" o "garantizado".
- **Disclaimer obligatorio:** todo output incluye el texto fijo de aviso.

### Fórmula de exposure load por sesión

```
exposure_load = duration_minutes
              × uv_factor
              × sensitivity_factor
              × skin_type_factor
              × context_factor
              × protection_factor
```

`weeklyExposureLoad` es la suma de las cargas de las sesiones de los últimos 7 días. Es un **índice interno**, no una medida médica ni radiológica. No debe presentarse al usuario como "riesgo" ni como "tiempo seguro".

### Factores

| Factor                                        | Rango                      |
| --------------------------------------------- | -------------------------- |
| UV null                                       | 1.1                        |
| UV 0-2                                        | 0.7                        |
| UV 3-5                                        | 1.0                        |
| UV 6-7                                        | 1.3                        |
| UV 8-10                                       | 1.7                        |
| UV 11                                         | 2.0                        |
| Sensibilidad low/medium/high/very_high        | 0.85/1.0/1.25/1.5          |
| Fototipo 1/2/3/4/5/6                          | 1.6/1.35/1.15/1.0/0.9/0.85 |
| Fototipo desconocido                          | 1.2                        |
| Contexto beach/pool/urban/terrace/sport/other | 1.25/1.2/0.8/1.0/1.25/1.0  |
| Protección high/medium/unknown/not_sure/none  | 0.85/1.0/1.1/1.15/1.35     |

### Reglas prioritarias (en orden)

1. **Burned** (últimos 7 días) → `rest`
2. **Slightly red** (últimas 48h) → `high_caution`
3. **Warm tight** (últimas 48h) → `caution`
4. **UV >= 8 hoy** → nivel mínimo forzado a `high_caution` (se combina con carga semanal)

### Umbrales de carga semanal

| Rango   | Nivel          |
| ------- | -------------- |
| 0-50    | `low`          |
| 51-110  | `moderate`     |
| 111-180 | `caution`      |
| 181-260 | `high_caution` |
| > 260   | `rest`         |

### Niveles

```
low          → Puedes empezar con prudencia
moderate     → Mantén un ritmo gradual
caution      → Hoy conviene ir con calma
high_caution → Prudencia alta
rest         → Mejor descansar de exposición directa
```

### Disclaimer fijo (siempre presente en el output)

> Orientación general, no médica. Bronze IQ no garantiza seguridad frente a la exposición solar.

---

## Validaciones Zod

Todos los schemas viven en `src/modules/<feature>/<feature>.schema.ts`.

| Schema                        | Validaciones clave                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `profileSetupSchema`          | alias 2-30 chars, enums exactos, disclaimerAcceptedAt datetime obligatorio            |
| `profileUpdateSchema`         | todo opcional, mismas restricciones de alias si se provee                             |
| `createExposureSessionSchema` | duration 1-300, UV 0-11 o null, notes max 500 o null, enums exactos, fecha YYYY-MM-DD |
| `dataDeletionRequestSchema`   | UUIDs válidos, status enum, processedAt datetime o null                               |

---

## Decisiones de diseño

- **Zod antes de Supabase:** los schemas Zod son la fuente de verdad de los contratos de datos. Las migraciones SQL se derivan de ellos, no al revés.
- **Tipos en camelCase:** los tipos TypeScript usan camelCase. La transformación snake_case ↔ camelCase se hace en los repositorios (capa de datos), no en los servicios ni en la UI.
- **ConsentLog fuera del MVP:** el consentimiento del disclaimer se registra en `Profile.disclaimerAcceptedAt`. Una tabla `consent_log` separada es posible para futuras versiones con múltiples versiones de disclaimer.
- **`weeklyExposureLoad` es interno:** no se presenta al usuario como una cifra de riesgo. Es un valor de diagnóstico interno para que el motor derive el nivel de recomendación.
- **`now` inyectado en el motor:** `generateRecommendation` acepta `now?: Date` para hacer el motor 100% testeable sin mocks de `Date`.
