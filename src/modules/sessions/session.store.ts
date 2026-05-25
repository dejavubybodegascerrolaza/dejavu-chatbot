import { create } from 'zustand'
import * as SessionService from './session.service'
import type { ExposureSession } from './session.types'
import type { CreateExposureSessionInput } from './session.schema'

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

type SessionStore = {
  status: SessionStatus
  todaySessions: ExposureSession[]
  sessions: ExposureSession[]
  recentSessions: ExposureSession[]
  recentSessionsStatus: SessionStatus
  recentSessionsError: string | null
  error: string | null
  isSubmitting: boolean
  loadTodaySessions: (userId: string, today: string) => Promise<void>
  loadSessions: (userId: string) => Promise<void>
  loadRecentSessions: (userId: string, days?: number) => Promise<void>
  createSession: (
    userId: string,
    input: CreateExposureSessionInput
  ) => Promise<ExposureSession | null>
  clearSessions: () => void
  clearError: () => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  status: 'idle',
  todaySessions: [],
  sessions: [],
  recentSessions: [],
  recentSessionsStatus: 'idle',
  recentSessionsError: null,
  error: null,
  isSubmitting: false,

  loadTodaySessions: async (userId, today) => {
    set({ status: 'loading', error: null })
    try {
      const sessions = await SessionService.loadTodaySessions(userId, today)
      set({
        status: sessions.length > 0 ? 'ready' : 'empty',
        todaySessions: sessions,
        error: null,
      })
    } catch (err) {
      set({
        status: 'error',
        error:
          err instanceof Error
            ? err.message
            : 'No se han podido cargar tus sesiones. Inténtalo de nuevo.',
      })
    }
  },

  loadSessions: async (userId) => {
    set({ status: 'loading', error: null })
    try {
      const sessions = await SessionService.loadSessions(userId)
      set({
        status: sessions.length > 0 ? 'ready' : 'empty',
        sessions,
        error: null,
      })
    } catch (err) {
      set({
        status: 'error',
        error:
          err instanceof Error
            ? err.message
            : 'No se han podido cargar tus sesiones. Inténtalo de nuevo.',
      })
    }
  },

  loadRecentSessions: async (userId, days = 7) => {
    set({ recentSessionsStatus: 'loading', recentSessionsError: null })
    try {
      const sessions = await SessionService.loadRecentSessions(userId, days)
      set({
        recentSessionsStatus: sessions.length > 0 ? 'ready' : 'empty',
        recentSessions: sessions,
        recentSessionsError: null,
      })
    } catch (err) {
      set({
        recentSessionsStatus: 'error',
        recentSessionsError:
          err instanceof Error
            ? err.message
            : 'No se han podido cargar tus sesiones. Inténtalo de nuevo.',
      })
    }
  },

  createSession: async (userId, input) => {
    set({ isSubmitting: true, error: null })
    try {
      const session = await SessionService.createExposureSession(userId, input)

      const today = new Date().toISOString().slice(0, 10)
      if (session.sessionDate === today) {
        const { todaySessions, status } = get()
        const alreadyExists = todaySessions.some((s) => s.id === session.id)
        if (!alreadyExists) {
          const updated = [session, ...todaySessions].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
          )
          set({
            todaySessions: updated,
            status: status === 'empty' ? 'ready' : status,
            isSubmitting: false,
          })
        } else {
          set({ isSubmitting: false })
        }
      } else {
        set({ isSubmitting: false })
      }

      // Also prepend to recentSessions if within last 7 days
      const { recentSessions, recentSessionsStatus } = get()
      const alreadyInRecent = recentSessions.some((s) => s.id === session.id)
      if (!alreadyInRecent) {
        set({
          recentSessions: [session, ...recentSessions].sort((a, b) =>
            b.sessionDate !== a.sessionDate
              ? b.sessionDate.localeCompare(a.sessionDate)
              : b.createdAt.localeCompare(a.createdAt)
          ),
          recentSessionsStatus: recentSessionsStatus === 'empty' ? 'ready' : recentSessionsStatus,
        })
      }

      return session
    } catch (err) {
      set({
        isSubmitting: false,
        error:
          err instanceof Error
            ? err.message
            : 'No se ha podido guardar la sesión. Inténtalo de nuevo.',
      })
      return null
    }
  },

  clearSessions: () => {
    set({
      status: 'idle',
      todaySessions: [],
      sessions: [],
      recentSessions: [],
      recentSessionsStatus: 'idle',
      recentSessionsError: null,
      error: null,
      isSubmitting: false,
    })
  },

  clearError: () => set({ error: null }),
}))
