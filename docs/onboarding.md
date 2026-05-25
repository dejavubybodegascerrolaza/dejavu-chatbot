# Bronze IQ — Onboarding

> Flujo completo del wizard de onboarding para usuarios nuevos.
> Ruta: `app/(onboarding)/index.tsx`

---

## Flujo completo

```
Usuario autenticado sin perfil completo
  ↓
app/(onboarding)/index.tsx (wizard de 8 pasos)
  ↓ completeOnboarding() en paso 7
profiles table (INSERT o UPDATE)
  ↓
Guard detecta profileStatus = 'ready'
  ↓
app/(app)/index.tsx (placeholder)
```

---

## Pasos del wizard

| Paso | Tipo       | Título                                     | Obligatorio          |
| ---- | ---------- | ------------------------------------------ | -------------------- |
| 0    | Intro      | Menos improvisación. Más control.          | —                    |
| 1    | Intro      | Una guía prudente, no una garantía médica. | —                    |
| 2    | Intro      | Escucha las señales de tu piel.            | —                    |
| 3    | Disclaimer | Antes de empezar                           | Checkbox obligatorio |
| 4    | Campo      | ¿Cómo quieres que te llamemos?             | alias (2-30 chars)   |
| 5    | Selección  | ¿Qué buscas controlar mejor?               | mainGoal             |
| 6    | Selección  | ¿Cómo suele reaccionar tu piel al sol?     | sunSensitivity       |
| 7    | Selección  | Fototipo de piel                           | skinType (opcional)  |

---

## Campos recogidos

| Campo                  | Tipo             | Obligatorio | Descripción                                                           |
| ---------------------- | ---------------- | ----------- | --------------------------------------------------------------------- |
| `alias`                | string           | Sí          | 2-30 caracteres. No nombre real.                                      |
| `mainGoal`             | MainGoal         | Sí          | gradual_bronze, avoid_overexposure, track_sessions, conscious_routine |
| `sunSensitivity`       | SunSensitivity   | Sí          | low, medium, high, very_high                                          |
| `skinType`             | SkinType \| null | No          | 1-6 (Fitzpatrick). null si no se indica.                              |
| `disclaimerAcceptedAt` | ISO datetime     | Sí          | Timestamp del momento de aceptación del checkbox.                     |

---

## Copies principales

### Paso 3 — Disclaimer

> Bronze IQ ofrece orientación general para ayudarte a registrar y entender mejor tu exposición solar. No es una herramienta médica, no diagnostica condiciones de la piel y no sustituye el consejo de un profesional sanitario. La exposición solar puede implicar riesgos. Usa protección adecuada, evita excesos y consulta con un profesional si tienes dudas, antecedentes, lesiones, quemaduras frecuentes o condiciones de sensibilidad.

Checkbox: _He leído y entiendo los límites de Bronze IQ._

### Paso 7 — Fototipo (opcional)

Botón secundario: _No lo sé / Prefiero no indicarlo_ → guarda con `skinType: null`.

---

## Validaciones

| Campo                | Regla                     | Mensaje de error                                                                        |
| -------------------- | ------------------------- | --------------------------------------------------------------------------------------- |
| alias                | 2-30 caracteres           | "El alias debe tener al menos 2 caracteres" / "El alias no puede superar 30 caracteres" |
| disclaimer           | checkbox marcado          | Botón bloqueado si no marcado                                                           |
| mainGoal             | selección requerida       | Botón Continuar desactivado                                                             |
| sunSensitivity       | selección requerida       | Botón Continuar desactivado                                                             |
| disclaimerAcceptedAt | ISO datetime válido (Zod) | Validado en service                                                                     |

---

## Qué se guarda en `profiles`

```sql
-- INSERT en step 7 (primer onboarding)
id                    = auth.uid()
alias                 = 'Alex'
main_goal             = 'gradual_bronze'
sun_sensitivity       = 'medium'
skin_type             = 3           -- o NULL
onboarding_completed  = true
disclaimer_accepted_at = '2026-05-25T10:00:00.000Z'

-- Si el usuario tenía un profile incompleto, se hace UPDATE con los mismos campos
```

La lógica de create vs update vive en `profile.service.ts::completeOnboarding`.

---

## Prueba manual

1. Crear cuenta o iniciar sesión.
2. Si no hay profile (o `onboarding_completed = false`), la app redirige a `/(onboarding)`.
3. Avanzar por los 3 pasos de intro (Continuar, Lo entiendo, Continuar).
4. En el disclaimer: intentar pulsar "Aceptar y continuar" sin marcar checkbox → debe estar desactivado.
5. Marcar checkbox → botón se activa.
6. Introducir alias válido (≥ 2 chars).
7. Intentar Continuar con alias de 1 char → botón desactivado + error inline.
8. Elegir objetivo principal.
9. Elegir sensibilidad al sol.
10. En fototipo: elegir uno o pulsar "No lo sé / Prefiero no indicarlo".
11. Verificar en Supabase Dashboard → Table Editor → `profiles`:
    - `onboarding_completed = true`
    - `disclaimer_accepted_at` no es null
    - `skin_type` puede ser null
12. La app debe navegar automáticamente a `/(app)`.
13. Cerrar app y abrir de nuevo → el usuario va directamente a `/(app)` (sin onboarding).
14. Cerrar sesión → iniciar sesión de nuevo → va a `/(app)` sin onboarding.

---

## Riesgos conocidos

| Riesgo                     | Mitigación                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| Loop de navegación         | Guard usa `replace` + chequea el segmento actual antes de redirigir                              |
| Doble submit (StrictMode)  | `isSubmitting` bloquea el botón durante la llamada                                               |
| Perfil duplicado           | `completeOnboarding` en el service hace GET primero y elige create o update                      |
| Confirmación de email      | El wizard es accesible para usuarios ya autenticados (session activa). Sin impacto.              |
| Pérdida de wizard al rotar | El estado del wizard es local (useState). Se pierde al remontar la pantalla. Aceptable para MVP. |
| Prueba real en dispositivo | Requiere proyecto Supabase configurado con credenciales en `.env.local`.                         |

---

## Relación con otros módulos

- `useAuthStore` — proporciona `user.id` al llamar `completeOnboarding`
- `useProfileStore` — orquesta `loadProfile` y `completeOnboarding`
- `profile.service.ts` — valida con `profileSetupSchema` + lógica create/update
- `profile.repository.ts` — acceso a tabla `profiles`
- `profile.mapper.ts` — convierte snake_case ↔ camelCase
