import type {
  ExposureSession,
  ExposureContext,
  ProtectionLevel,
  SensationAfter,
} from './session.types'
import type { CreateExposureSessionInput } from './session.schema'
import type { Tables, Inserts } from '@/types/database.types'

type SessionRow = Tables<'exposure_sessions'>
type SessionInsert = Inserts<'exposure_sessions'>

export function mapSessionRowToSession(row: SessionRow): ExposureSession {
  return {
    id: row.id,
    userId: row.user_id,
    sessionDate: row.session_date,
    durationMinutes: row.duration_minutes,
    context: row.context as ExposureContext,
    uvIndexManual: row.uv_index_manual,
    protectionLevel: row.protection_level as ProtectionLevel,
    sensationAfter: row.sensation_after as SensationAfter,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapCreateSessionInputToInsert(
  userId: string,
  input: CreateExposureSessionInput
): SessionInsert {
  return {
    user_id: userId,
    session_date: input.sessionDate,
    duration_minutes: input.durationMinutes,
    context: input.context,
    uv_index_manual: input.uvIndexManual,
    protection_level: input.protectionLevel,
    sensation_after: input.sensationAfter,
    notes: input.notes,
  }
}
