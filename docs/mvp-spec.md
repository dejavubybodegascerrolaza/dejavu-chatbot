# Bronze IQ — MVP Specification

> Fuente de verdad funcional del MVP. Toda pantalla, flujo, campo y comportamiento definido aquí tiene prioridad sobre cualquier otra fuente.

---

## Navegación y estructura de rutas

```
app/
├── _layout.tsx                    # Root: splash/session check, providers, auth guard
├── (auth)/
│   ├── _layout.tsx
│   ├── welcome.tsx
│   ├── login.tsx
│   └── register.tsx
├── (onboarding)/
│   ├── _layout.tsx
│   ├── step-1.tsx                 # Qué hace Bronze IQ
│   ├── step-2.tsx                 # Qué NO hace
│   ├── step-3.tsx                 # Filosofía de uso
│   └── disclaimer.tsx             # Aceptación obligatoria
├── (profile-setup)/
│   ├── _layout.tsx
│   ├── alias.tsx
│   ├── goal.tsx
│   ├── sensitivity.tsx
│   └── skin-type.tsx
└── (app)/
    ├── _layout.tsx
    ├── (tabs)/
    │   ├── _layout.tsx
    │   ├── index.tsx              # Home
    │   ├── history.tsx            # Historial
    │   └── settings.tsx           # Ajustes
    ├── session-log.tsx            # Registrar sesión
    ├── session-detail/
    │   └── [id].tsx               # Detalle de sesión
    ├── edit-profile.tsx
    ├── disclaimer.tsx             # Disclaimer completo accesible
    └── deletion-request.tsx
```

### Tabs principales

| Tab       | Icono sugerido | Ruta              |
| --------- | -------------- | ----------------- |
| Inicio    | Sol            | `(tabs)/index`    |
| Historial | Reloj/lista    | `(tabs)/history`  |
| Ajustes   | Engranaje      | `(tabs)/settings` |

### Auth guard (root layout)

```typescript
// Lógica de redirección en app/_layout.tsx:
// Sin sesión           → /(auth)/welcome
// Con sesión, sin onboarding completado → /(onboarding)/step-1
// Con sesión, sin perfil completado → /(profile-setup)/alias
// Con sesión, perfil completo → /(app)/(tabs)/
```

---

## Pantallas

### Splash / Loading

**Ruta:** `app/_layout.tsx` (manejo implícito)

**Estados:**

- Cargando sesión
- Usuario no autenticado → `/(auth)/welcome`
- Autenticado sin onboarding → `/(onboarding)/step-1`
- Autenticado sin perfil → `/(profile-setup)/alias`
- Autenticado completo → `/(app)/(tabs)/`

**Copy visible:**

- "Bronze IQ"
- "Preparando tu espacio de control solar…"

---

### Welcome

**Ruta:** `/(auth)/welcome`

**Contenido:**

```
Título:    Bronze IQ
Subtítulo: Bronceado con cabeza.
Texto:     Una forma más consciente de registrar tu exposición solar,
           entender tu historial reciente y tomar decisiones prudentes.
```

**Botones:**

- Principal: `Empezar` → `/(onboarding)/step-1`
- Secundario: `Ya tengo cuenta` → `/(auth)/login`

**Restricciones:** Sin claims médicos. Sin "broncéate sin riesgo".

---

### Onboarding — Paso 1

**Ruta:** `/(onboarding)/step-1`

```
Título:  Menos improvisación. Más control.
Texto:   Bronze IQ te ayuda a registrar tus sesiones de exposición
         solar, revisar tu historial reciente y recibir orientación
         prudente basada en tus propios datos.
Botón:   Continuar
```

---

### Onboarding — Paso 2

**Ruta:** `/(onboarding)/step-2`

```
Título:  Una guía prudente, no una garantía médica.
Texto:   Bronze IQ no diagnostica, no sustituye al dermatólogo y no
         puede garantizar que una exposición sea segura. Sus
         recomendaciones son orientativas y conservadoras.
Botón:   Lo entiendo
```

---

### Onboarding — Paso 3

**Ruta:** `/(onboarding)/step-3`

```
Título:  Escucha las señales de tu piel.
Texto:   La app prioriza la prudencia. Si registras molestias,
         irritación, quemadura o acumulación elevada, Bronze IQ
         te recomendará bajar el ritmo o descansar.
Botón:   Continuar
```

---

### Disclaimer / Aceptación

**Ruta:** `/(onboarding)/disclaimer`

```
Título:  Antes de empezar

Texto:   Bronze IQ ofrece orientación general para ayudarte a
         registrar y entender mejor tu exposición solar. No es una
         herramienta médica, no diagnostica condiciones de la piel y
         no sustituye el consejo de un profesional sanitario. La
         exposición solar puede implicar riesgos. Usa protección
         adecuada, evita excesos y consulta con un profesional si
         tienes dudas, antecedentes, lesiones, quemaduras frecuentes
         o condiciones de sensibilidad.

Checkbox: [obligatorio] He leído y entiendo los límites de Bronze IQ.

Botón:   Aceptar y continuar  (deshabilitado hasta marcar checkbox)
```

**Al aceptar:** guardar `disclaimer_accepted_at` en `profiles`.

---

### Registro

**Ruta:** `/(auth)/register`

**Campos:**

- `email` — validar formato
- `password` — mínimo 8 caracteres
- `confirm_password` — debe coincidir con password

**Botones:**

- Principal: `Crear cuenta`
- Secundario: `Ya tengo cuenta` → `/(auth)/login`

**Mensajes de error (nunca errores técnicos de Supabase):**

- "Introduce un email válido."
- "La contraseña debe tener al menos 8 caracteres."
- "Las contraseñas no coinciden."
- "Este email ya tiene una cuenta. ¿Quieres iniciar sesión?"

**Flujo post-registro:** → `/(onboarding)/step-1`

---

### Login

**Ruta:** `/(auth)/login`

**Campos:**

- `email`
- `password`

**Botones:**

- Principal: `Entrar`
- Secundario: `Crear cuenta` → `/(auth)/register`

**Link:** `He olvidado mi contraseña` (puede ser placeholder en MVP)

**Mensajes de error:**

- "No se pudo iniciar sesión. Comprueba tu email y contraseña." (genérico — no revelar si el email existe)

---

### Profile Setup — Paso 1: Alias

**Ruta:** `/(profile-setup)/alias`

```
Título:  ¿Cómo quieres que te llamemos?
Campo:   alias (texto libre, 2-30 caracteres, obligatorio)
Botón:   Continuar
```

No pedir nombre completo. Permitir alias para privacidad.

---

### Profile Setup — Paso 2: Objetivo

**Ruta:** `/(profile-setup)/goal`

```
Título:  ¿Qué buscas controlar mejor?
Opciones:
  1. Mantener un bronceado gradual         → gradual_bronze
  2. Evitar pasarme con el sol             → avoid_overexposure
  3. Registrar mis sesiones                → track_sessions
  4. Crear una rutina más consciente       → conscious_routine
Botón:   Continuar
```

---

### Profile Setup — Paso 3: Sensibilidad

**Ruta:** `/(profile-setup)/sensitivity`

```
Título:  ¿Cómo suele reaccionar tu piel al sol?
Opciones:
  1. Me quemo con facilidad                → very_high
  2. A veces me irrito si me paso          → high
  3. Normalmente tolero exposiciones...    → medium
  4. Suelo tolerarlo bien, pero quiero...  → low
Nota:    Esta información ayuda a que Bronze IQ sea más prudente.
         No sustituye una valoración médica.
Botón:   Continuar
```

---

### Profile Setup — Paso 4: Fototipo (opcional)

**Ruta:** `/(profile-setup)/skin-type`

```
Título:  Fototipo de piel
Texto:   Puedes indicar tu fototipo si lo conoces. Es opcional y
         solo se usará para ajustar la prudencia de las recomendaciones.
Opciones:
  I   — Muy clara, se quema muy fácilmente    → 1
  II  — Clara, se quema con facilidad         → 2
  III — Intermedia, puede broncearse...       → 3
  IV  — Morena clara, suele tolerar mejor     → 4
  V   — Morena                                → 5
  VI  — Muy oscura                            → 6
Botones:
  Principal: Guardar
  Secundario: No lo sé / Prefiero no indicarlo  → skin_type = null
```

**Crítico:** No bloquear el flujo si el usuario no responde.

---

### Home

**Ruta:** `/(app)/(tabs)/index`

**Estructura:**

```
1. Header
   "Hola, {alias}"
   Subtexto rotativo: "Vamos con calma." | "Revisa tu exposición reciente."
                      | "Hoy manda la prudencia."

2. Card de recomendación principal
   - Título (variable por nivel)
   - Mensaje explicativo
   - Botón: "Registrar sesión"

3. Resumen últimos 7 días
   - Sesiones / Minutos registrados / Última sensación / Nivel de prudencia

4. CTA principal
   Botón: "Registrar exposición" → /(app)/session-log

5. Última sesión (si existe)
   - fecha, duración, contexto, sensación
   (Si no existe → empty state con CTA "Registrar primera sesión")

6. Nota de seguridad fija (siempre visible)
   "Bronze IQ ofrece orientación general. No sustituye consejo médico
   ni garantiza seguridad frente a la exposición solar."
```

**Header subtexts permitidos (nunca eufóricos):**

- "Vamos con calma."
- "Revisa tu exposición reciente."
- "Hoy manda la prudencia."

---

### Registro de Sesión

**Ruta:** `/(app)/session-log`

**Título:** Registrar exposición
**Subtítulo:** Guarda lo importante. Bronze IQ usará tu historial para orientarte con prudencia.

| Campo              | Tipo        | Obligatorio | Validación                                                |
| ------------------ | ----------- | ----------- | --------------------------------------------------------- |
| `session_date`     | date picker | Sí          | Default: hoy                                              |
| `duration_minutes` | número      | Sí          | 1-300; warning no bloqueante si >180                      |
| `context`          | selector    | Sí          | Enum: beach/pool/urban/terrace_garden/outdoor_sport/other |
| `uv_index_manual`  | selector    | No          | 0-11 o null                                               |
| `protection_level` | selector    | No          | Enum, default: unknown                                    |
| `sensation_after`  | selector    | Sí          | Enum                                                      |
| `notes`            | textarea    | No          | Máx 500 chars                                             |

**Warning no bloqueante para duración >180:**

> "Es una duración elevada. Bronze IQ será especialmente prudente con esta sesión."

**Opciones de contexto:**

- Playa → `beach`
- Piscina → `pool`
- Ciudad / paseo → `urban`
- Terraza / jardín → `terrace_garden`
- Deporte exterior → `outdoor_sport`
- Otro → `other`

**Opciones UV manual:**

- (vacío/no indicado)
- 0-2 bajo
- 3-5 moderado
- 6-7 alto
- 8-10 muy alto
- 11 extremo

**Opciones protección:**

- No indicado → `unknown`
- Sí, protección alta → `high`
- Sí, protección media → `medium`
- No → `none`
- No lo recuerdo → `not_sure`

**Opciones sensación:**

- Bien → `great`
- Normal → `normal`
- Piel caliente o tirante → `warm_tight`
- Ligero enrojecimiento → `slightly_red`
- Quemadura o molestia clara → `burned`

**Botones:**

- `Guardar sesión`
- `Cancelar`

**Post-guardado:** toast de confirmación + navegar a Home + actualizar recomendación.

---

### Confirmación de sesión guardada

**Toast o banner:**

```
Sesión registrada.
Tu recomendación se ha actualizado con tu historial reciente.
[Ver recomendación]  [Ver historial]
```

---

### Historial

**Ruta:** `/(app)/(tabs)/history`

**Título:** Historial

**Contenido:** Lista cronológica descendente.

**Cada ítem muestra:**

- Fecha
- Duración (min)
- Contexto
- Sensación
- Indicador visual de nivel (badge)

**Empty state:**

```
Aún no hay sesiones registradas.
Cuando registres tus exposiciones, aparecerán aquí para ayudarte
a entender tu ritmo.
[Registrar primera sesión]
```

---

### Detalle de sesión

**Ruta:** `/(app)/session-detail/[id]`

**Muestra:**

- Fecha
- Duración
- Contexto
- Índice UV (si existe)
- Protección usada
- Sensación posterior
- Notas
- Fecha de creación

**Acciones:**

- `Eliminar sesión` (con confirmación)
- `Volver`

**Modal de confirmación de eliminación:**

```
¿Eliminar esta sesión?
Esta acción no se puede deshacer.
[Cancelar]  [Eliminar]
```

---

### Ajustes

**Ruta:** `/(app)/(tabs)/settings`

**Título:** Ajustes

**Secciones:**

```
PERFIL
  alias · objetivo · sensibilidad · fototipo (si existe)
  [Editar perfil]

SEGURIDAD Y RESPONSABILIDAD
  [Leer disclaimer]

PRIVACIDAD
  [Solicitar eliminación de datos]

CUENTA
  [Cerrar sesión]
```

---

### Editar perfil

**Ruta:** `/(app)/edit-profile`

**Campos editables:**

- alias
- objetivo (main_goal)
- sensibilidad (sun_sensitivity)
- fototipo (skin_type, opcional)

**No editable:** email

**Botones:**

- `Guardar cambios`
- `Cancelar`

---

### Disclaimer completo

**Ruta:** `/(app)/disclaimer`

```
Título:  Límites de Bronze IQ

Texto:   Bronze IQ ofrece orientación general para ayudarte a
         registrar y revisar tu exposición solar. No es una
         herramienta médica, no diagnostica condiciones de la piel y
         no sustituye el consejo de un profesional sanitario. La
         exposición solar puede implicar riesgos, incluso con
         protección. Evita excesos, usa protección adecuada y consulta
         con un profesional si tienes antecedentes, lesiones, quemaduras
         frecuentes, sensibilidad elevada, medicación fotosensibilizante
         o dudas sobre tu piel.

Botón:   Entendido
```

---

### Solicitud de eliminación de datos

**Ruta:** `/(app)/deletion-request`

```
Título:  Eliminar mis datos

Texto:   Puedes solicitar la eliminación de tus datos asociados a
         Bronze IQ. Esta solicitud quedará registrada y será procesada
         conforme a la política de privacidad del producto.

Botón:   Solicitar eliminación
```

**Post-solicitud:**

```
Solicitud registrada.
Hemos guardado tu solicitud de eliminación. El procesamiento puede
requerir revisión manual durante el MVP.
```

**Acción:** INSERT en `deletion_requests` → cerrar sesión.

---

## Modelo de datos

### `profiles`

```sql
CREATE TABLE profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id),
  alias                 text NOT NULL CHECK (char_length(alias) BETWEEN 2 AND 30),
  main_goal             text NOT NULL,
  sun_sensitivity       text NOT NULL,
  skin_type             smallint CHECK (skin_type BETWEEN 1 AND 6),
  onboarding_completed  boolean NOT NULL DEFAULT false,
  disclaimer_accepted_at timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
```

**Enums main_goal:** `gradual_bronze` | `avoid_overexposure` | `track_sessions` | `conscious_routine`

**Enums sun_sensitivity:** `low` | `medium` | `high` | `very_high`

**skin_type:** 1-6 o NULL (opcional)

---

### `exposure_sessions`

```sql
CREATE TABLE exposure_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id),
  session_date      date NOT NULL,
  duration_minutes  smallint NOT NULL CHECK (duration_minutes BETWEEN 1 AND 300),
  context           text NOT NULL,
  uv_index_manual   smallint CHECK (uv_index_manual BETWEEN 0 AND 11),
  protection_level  text NOT NULL DEFAULT 'unknown',
  sensation_after   text NOT NULL,
  notes             text CHECK (char_length(notes) <= 500),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

**Enums context:** `beach` | `pool` | `urban` | `terrace_garden` | `outdoor_sport` | `other`

**Enums protection_level:** `unknown` | `high` | `medium` | `none` | `not_sure`

**Enums sensation_after:** `great` | `normal` | `warm_tight` | `slightly_red` | `burned`

---

### `deletion_requests`

```sql
CREATE TABLE deletion_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  requested_at  timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL DEFAULT 'pending',
  processed_at  timestamptz
);
```

**Enums status:** `pending` | `processed`

---

## Row Level Security

### `profiles`

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- Sin DELETE desde cliente
```

### `exposure_sessions`

```sql
ALTER TABLE exposure_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_own" ON exposure_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sessions_insert_own" ON exposure_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sessions_update_own" ON exposure_sessions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "sessions_delete_own" ON exposure_sessions FOR DELETE USING (user_id = auth.uid());
```

### `deletion_requests`

```sql
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deletion_requests_select_own" ON deletion_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "deletion_requests_insert_own" ON deletion_requests FOR INSERT WITH CHECK (user_id = auth.uid());
-- Sin UPDATE ni DELETE desde cliente
```

---

## Motor de recomendación determinista

### Inputs

```typescript
interface RecommendationInput {
  profile: {
    sunSensitivity: 'low' | 'medium' | 'high' | 'very_high'
    skinType: 1 | 2 | 3 | 4 | 5 | 6 | null
    mainGoal: 'gradual_bronze' | 'avoid_overexposure' | 'track_sessions' | 'conscious_routine'
  }
  sessionsLast7Days: ExposureSession[]
  today?: { uvIndexManual?: number | null }
}
```

### Factores del exposure_load

```
exposure_load = duration_minutes × uv_factor × sensitivity_factor
              × skin_type_factor × context_factor × protection_factor
```

| Factor                 | Valor |
| ---------------------- | ----- |
| uv null                | 1.1   |
| uv 0-2                 | 0.7   |
| uv 3-5                 | 1.0   |
| uv 6-7                 | 1.3   |
| uv 8-10                | 1.7   |
| uv 11                  | 2.0   |
| sensitivity low        | 0.85  |
| sensitivity medium     | 1.0   |
| sensitivity high       | 1.25  |
| sensitivity very_high  | 1.5   |
| skin_type 1            | 1.6   |
| skin_type 2            | 1.35  |
| skin_type 3            | 1.15  |
| skin_type 4            | 1.0   |
| skin_type 5            | 0.9   |
| skin_type 6            | 0.85  |
| skin_type null         | 1.2   |
| context beach          | 1.25  |
| context pool           | 1.2   |
| context urban          | 0.8   |
| context terrace_garden | 1.0   |
| context outdoor_sport  | 1.25  |
| context other          | 1.0   |
| protection high        | 0.85  |
| protection medium      | 1.0   |
| protection unknown     | 1.1   |
| protection not_sure    | 1.15  |
| protection none        | 1.35  |

### Reglas duras (prioridad absoluta)

| Regla          | Condición                     | Nivel                 | Título                                |
| -------------- | ----------------------------- | --------------------- | ------------------------------------- |
| Quemadura      | `burned` en últimos 7 días    | `rest`                | Mejor descansar de exposición directa |
| Enrojecimiento | `slightly_red` en últimas 48h | `high_caution`        | Hoy conviene ir con mucha calma       |
| Piel tirante   | `warm_tight` en últimas 48h   | `caution`             | Revisa cómo respondió tu piel         |
| UV muy alto    | `uvIndexManual >= 8`          | mínimo `high_caution` | + aviso de UV alto                    |

### Umbrales por carga semanal acumulada

| Rango exposure_load | Nivel          |
| ------------------- | -------------- |
| 0–50                | `low`          |
| 51–110              | `moderate`     |
| 111–180             | `caution`      |
| 181–260             | `high_caution` |
| >260                | `rest`         |

### Output

```typescript
type RecommendationLevel = 'low' | 'moderate' | 'caution' | 'high_caution' | 'rest'

interface Recommendation {
  level: RecommendationLevel
  title: string
  message: string
  reasons: string[]
  ctaLabel: string
  disclaimer: string // siempre: "Orientación general, no médica. Bronze IQ no garantiza seguridad frente a la exposición solar."
}
```

### Tests obligatorios

1. Sin sesiones recientes
2. Sesión normal de baja carga
3. Acumulación moderada
4. Acumulación alta
5. Quemadura en últimos 7 días
6. Enrojecimiento en últimas 48h
7. Piel tirante en últimas 48h
8. Sensibilidad `very_high`
9. Fototipo I
10. UV >= 8
11. Protección `none`
12. Las notas no influyen en la recomendación
13. La recomendación nunca usa lenguaje absoluto

---

## Validaciones Zod (schemas requeridos)

```typescript
registerSchema // email, password, confirmPassword
loginSchema // email, password
profileSchema // alias (2-30), mainGoal, sunSensitivity, skinType (1-6|null)
exposureSessionSchema // sessionDate, duration (1-300), context, uvIndex (0-11|null),
// protection, sensation, notes (<=500)
deletionRequestSchema // confirmación de intención
```

---

## Estados obligatorios en UI

Toda pantalla con datos debe contemplar:

- `loading` — skeleton screens, no spinners genéricos
- `empty` — mensajes invitadores + CTA, nunca pantalla en blanco
- `error` — toast no bloqueante para red; inline para formularios
- `success` — confirmación clara
- `disabled` — botones deshabilitados durante saving
- `saving` — indicador inline en el botón

---

## Fases de construcción

| Fase | Nombre                  | Entregable                                       |
| ---- | ----------------------- | ------------------------------------------------ |
| 0    | Fundación técnica       | ✅ Completada — Expo, TS, structure, lint, husky |
| 1    | Docs + Design System    | Tokens, componentes UI base                      |
| 2    | Datos + Supabase        | Migraciones, RLS, tipos DB                       |
| 3    | Auth                    | Registro, login, logout, rutas protegidas        |
| 4    | Onboarding + Disclaimer | 3 pasos + aceptación                             |
| 5    | Profile setup           | Alias, objetivo, sensibilidad, fototipo          |
| 6    | Sessions                | Formulario, guardado, eliminación                |
| 7    | Recommendation engine   | Motor determinista + tests                       |
| 8    | Home                    | Resumen, recomendación, CTA                      |
| 9    | History + detail        | Lista, empty states, detalle, eliminar           |
| 10   | Settings + privacy      | Editar perfil, disclaimer, logout, eliminación   |
| 11   | QA / polish / build     | Estados, errores, accesibilidad, EAS             |
