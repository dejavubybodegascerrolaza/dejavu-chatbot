import { createExposureSessionSchema } from './session.schema'
import type { CreateExposureSessionInput } from './session.schema'
import type { ExposureSession } from './session.types'
import * as SessionRepository from './session.repository'

export async function loadTodaySessions(userId: string, today: string): Promise<ExposureSession[]> {
  return SessionRepository.getTodaySessionsByUserId(userId, today)
}

export async function loadSessions(userId: string): Promise<ExposureSession[]> {
  return SessionRepository.getSessionsByUserId(userId)
}

export async function loadRecentSessions(
  userId: string,
  days: number = 7
): Promise<ExposureSession[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const fromDate = cutoff.toISOString().slice(0, 10)
  return SessionRepository.getRecentSessionsByUserId(userId, fromDate)
}

export async function createExposureSession(
  userId: string,
  rawInput: CreateExposureSessionInput
): Promise<ExposureSession> {
  const normalized: CreateExposureSessionInput = {
    ...rawInput,
    uvIndexManual: rawInput.uvIndexManual ?? null,
    notes: rawInput.notes === '' ? null : (rawInput.notes ?? null),
  }

  const validated = createExposureSessionSchema.parse(normalized)
  return SessionRepository.createSession(userId, validated)
}
