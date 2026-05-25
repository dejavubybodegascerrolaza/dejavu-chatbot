# Sessions — Módulo de Exposición Solar

## Objetivo

Permite al usuario registrar sesiones de exposición solar y ver las sesiones del día actual. Es el primer flujo funcional real después del onboarding.

---

## Campos del formulario

| Campo             | Tipo                  | Validación              | Notas                                                   |
| ----------------- | --------------------- | ----------------------- | ------------------------------------------------------- |
| `sessionDate`     | `string` (YYYY-MM-DD) | Obligatorio, regex date | Default: hoy                                            |
| `durationMinutes` | `number`              | 1–300, entero           | Entrada como string en formulario, conversión en submit |
| `context`         | `ExposureContext`     | Obligatorio             | Ninguna opción preseleccionada                          |
| `uvIndexManual`   | `number \| null`      | 0–11 o null             | Opcional; vacío = null                                  |
| `protectionLevel` | `ProtectionLevel`     | Obligatorio             | Default: `'unknown'`                                    |
| `sensationAfter`  | `SensationAfter`      | Obligatorio             | Ninguna opción preseleccionada                          |
| `notes`           | `string \| null`      | Max 500 chars           | String vacío normalizado a null en service              |

---

## Enums y labels

### ExposureContext

| Valor            | Label            |
| ---------------- | ---------------- |
| `beach`          | Playa            |
| `pool`           | Piscina          |
| `urban`          | Ciudad / paseo   |
| `terrace_garden` | Terraza / jardín |
| `outdoor_sport`  | Deporte exterior |
| `other`          | Otro             |

### ProtectionLevel

| Valor      | Label                |
| ---------- | -------------------- |
| `unknown`  | No indicado          |
| `high`     | Sí, protección alta  |
| `medium`   | Sí, protección media |
| `none`     | No                   |
| `not_sure` | No lo recuerdo       |

### SensationAfter

| Valor          | Label                      |
| -------------- | -------------------------- |
| `great`        | Bien                       |
| `normal`       | Normal                     |
| `warm_tight`   | Piel caliente o tirante    |
| `slightly_red` | Ligero enrojecimiento      |
| `burned`       | Quemadura o molestia clara |

---

## Tabla Supabase: `exposure_sessions`

| Columna            | Tipo              | Notas                        |
| ------------------ | ----------------- | ---------------------------- |
| `id`               | uuid PK           | Auto-generado por Supabase   |
| `user_id`          | uuid FK           | → `auth.users.id`            |
| `session_date`     | date              | Formato YYYY-MM-DD           |
| `duration_minutes` | smallint          | 1–300                        |
| `context`          | text              | Enum: ExposureContext values |
| `uv_index_manual`  | smallint nullable | 0–11                         |
| `protection_level` | text              | Enum: ProtectionLevel values |
| `sensation_after`  | text              | Enum: SensationAfter values  |
| `notes`            | text nullable     | Max 500 chars                |
| `created_at`       | timestamptz       | Auto-managed                 |
| `updated_at`       | timestamptz       | Auto-managed por trigger     |

---

## Qué se guarda

- Todos los campos del formulario tal como los introduce el usuario
- `user_id` tomado del auth store (nunca del formulario)
- `created_at` y `updated_at` gestionados por Supabase

## Qué NO se guarda

- `exposureLoad` — Es un dato derivado calculado en cliente por el motor de recomendaciones (`RecommendationService`). Se usa para la lógica de recomendación pero **nunca se persiste en la tabla**.
- Ningún dato de recomendación
- Geolocalización real (solo contexto general elegido por el usuario)

---

## Decisión: exposureLoad como dato derivado

El motor de recomendaciones (`src/modules/recommendations/recommendation.service.ts`) calcula `weeklyExposureLoad` a partir de las sesiones de los últimos 7 días. Este cálculo se hace en cliente en el momento de renderizar la recomendación. No hay columna `exposure_score`, `exposure_load` ni `risk_score` en la tabla `exposure_sessions`. Esta decisión mantiene la tabla simple y permite evolucionar el algoritmo sin migraciones.

---

## Arquitectura del módulo

```
app/(app)/session-log.tsx     →  useSessionStore + SessionForm
SessionForm.tsx               →  useForm (RHF + Zod) → onSave prop
useSessionStore               →  session.service
session.service               →  createExposureSessionSchema (Zod) + session.repository
session.repository            →  supabase client + session.mapper
session.mapper                →  camelCase ↔ snake_case
session.labels                →  enum values → texto visible en español
```

---

## Prueba manual — Checklist

### Flujo principal

1. Iniciar sesión con usuario con onboarding completo
2. Verificar que llega a mini Home con empty state en "Hoy"
3. Pulsar "Registrar exposición"
4. Verificar que aparece el formulario de registro
5. La fecha ya tiene el valor de hoy por defecto
6. Introducir duración: `45`
7. Seleccionar contexto: Piscina
8. Dejar UV sin seleccionar (debe quedar "No indicado" seleccionado por defecto)
9. Seleccionar protección: No indicado
10. Seleccionar sensación: Normal
11. Pulsar "Guardar sesión"
12. Verificar que vuelve a la Home
13. Verificar que la sesión aparece en "Hoy"
14. Verificar en Supabase Dashboard → `exposure_sessions`: la fila existe con `user_id` correcto

### Validaciones

15. Intentar guardar sin seleccionar contexto → error "Selecciona el contexto de la sesión"
16. Intentar guardar sin seleccionar sensación → error "Selecciona cómo te sentiste"
17. Introducir duración `0` → error "La duración mínima es 1 minuto"
18. Introducir duración `301` → error "La duración debe estar entre 1 y 300 minutos"
19. Introducir duración `190` → aviso amarillo no bloqueante (duración elevada)

### Seguridad

20. Cerrar sesión
21. Iniciar sesión con otro usuario
22. Verificar que la mini Home está vacía (no ve sesiones del primer usuario)
23. Verificar en Supabase que RLS impide SELECT de rows con `user_id` diferente

---

## Riesgos conocidos

| Riesgo                                   | Mitigación actual                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| RLS entre usuarios                       | RLS configurado en migración. Test manual recomendado contra Supabase real.              |
| UX de fecha sin date picker nativo       | Input de texto simple (YYYY-MM-DD). Pendiente mejorar con date picker en fase de polish. |
| `exposureLoad` nunca sincronizado con DB | Por diseño. El motor siempre recalcula desde las sesiones cargadas.                      |
| Sesiones pasadas registradas como hoy    | El campo `sessionDate` es editable. RLS no valida fechas.                                |
