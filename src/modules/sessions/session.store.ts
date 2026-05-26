import { create } from 'zustand'
import * as SessionService from './session.service'
import type { ExposureSession } from './session.types'
import type { CreateExposureSessionInput } from './session.schema'

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'
export type SelectedSessionStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

type SessionStore = {
  // Today's sessions (Home)
  status: SessionStatus
  todaySessions: ExposureSession[]
  sessions: ExposureSession[]
  error: string | null
  isSubmitting: boolean
  // Recent sessions for recommendation engine (Home)
  recentSessions: ExposureSession[]
  recentSessionsStatus: SessionStatus
  recentSessionsError: string | null
  // Full history (History screen)
  historySessions: ExposureSession[]
  historyStatus: SessionStatus
  historyError: string | null
  // Selected session (Detail screen)
  selectedSession: ExposureSession | null
  selectedSessionStatus: SelectedSessionStatus
  selectedSessionError: string | null

  loadTodaySessions: (userId: string, today: string) => Promise<void>
  loadSessions: (userId: string) => Promise<void>
  loadRecentSessions: (userId: string, days?: number) => Promise<void>
  loadHistorySessions: (userId: string) => Promise<void>
  loadSessionById: (userId: string, sessionId: string) => Promise<void>
  createSession: (
    userId: string,
    input: CreateExposureSessionInput
  ) => Promise<ExposureSession | null>
  deleteSession: (userId: string, sessionId: string) => Promise<boolean>
  clearSelectedSession: () => void
  clearSessions: () => void
  clearError: () => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  status: 'idle',
  todaySessions: [],
  sessions: [],
  error: null,
  isSubmitting: false,
  recentSessions: [],
  recentSessionsStatus: 'idle',
  recentSessionsError: null,
  historySessions: [],
  historyStatus: 'idle',
  historyError: null,
  selectedSession: null,
  selectedSessionStatus: 'idle',
  selectedSessionError: null,

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

  loadHistorySessions: async (userId) => {
    set({ historyStatus: 'loading', historyError: null })
    try {
      const sessions = await SessionService.loadSessions(userId)
      set({
        historyStatus: sessions.length > 0 ? 'ready' : 'empty',
        historySessions: sessions,
        historyError: null,
      })
    } catch (err) {
      set({
        historyStatus: 'error',
        historyError:
          err instanceof Error
            ? err.message
            : 'No se ha podido cargar tu historial. Inténtalo de nuevo.',
      })
    }
  },

  loadSessionById: async (userId, sessionId) => {
    set({ selectedSessionStatus: 'loading', selectedSessionError: null })
    try {
      const session = await SessionService.loadSessionById(userId, sessionId)
      if (session === null) {
        set({ selectedSessionStatus: 'missing', selectedSession: null })
      } else {
        set({ selectedSessionStatus: 'ready', selectedSession: session })
      }
    } catch (err) {
      set({
        selectedSessionStatus: 'error',
        selectedSessionError:
          err instanceof Error
            ? err.message
            : 'No se ha podido cargar esta sesión. Inténtalo de nuevo.',
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

      const { historySessions, historyStatus } = get()
      const alreadyInHistory = historySessions.some((s) => s.id === session.id)
      if (!alreadyInHistory) {
        set({
          historySessions: [session, ...historySessions].sort((a, b) =>
            b.sessionDate !== a.sessionDate
              ? b.sessionDate.localeCompare(a.sessionDate)
              : b.createdAt.localeCompare(a.createdAt)
          ),
          historyStatus: historyStatus === 'empty' ? 'ready' : historyStatus,
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

  deleteSession: async (userId, sessionId) => {
    try {
      await SessionService.deleteExposureSession(userId, sessionId)
      const { todaySessions, recentSessions, historySessions } = get()
      set({
        todaySessions: todaySessions.filter((s) => s.id !== sessionId),
        recentSessions: recentSessions.filter((s) => s.id !== sessionId),
        historySessions: historySessions.filter((s) => s.id !== sessionId),
        sessions: get().sessions.filter((s) => s.id !== sessionId),
        selectedSession: null,
        selectedSessionStatus: 'idle',
      })
      return true
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : 'No se ha podido eliminar la sesión. Inténtalo de nuevo.',
      })
      return false
    }
  },

  clearSelectedSession: () => {
    set({
      selectedSession: null,
      selectedSessionStatus: 'idle',
      selectedSessionError: null,
    })
  },

  clearSessions: () => {
    set({
      status: 'idle',
      todaySessions: [],
      sessions: [],
      recentSessions: [],
      recentSessionsStatus: 'idle',
      recentSessionsError: null,
      historySessions: [],
      historyStatus: 'idle',
      historyError: null,
      selectedSession: null,
      selectedSessionStatus: 'idle',
      selectedSessionError: null,
      error: null,
      isSubmitting: false,
    })
  },

  clearError: () => set({ error: null }),
}))
