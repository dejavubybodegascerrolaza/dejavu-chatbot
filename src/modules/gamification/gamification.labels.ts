import type { AchievementId } from './gamification.types'

export const ACHIEVEMENT_LABELS: Record<AchievementId, string> = {
  first_session: 'Primera sesión',
  protected_week: 'Semana protegida',
  protected_month: 'Mes protegido',
  consistency: 'Constante',
  explorer: 'Explorador del sol',
  planner: 'Con un plan',
}

export const ACHIEVEMENT_DESCRIPTIONS: Record<AchievementId, string> = {
  first_session: 'Registra tu primera sesión de exposición.',
  protected_week: '7 días seguidos cuidando tu piel.',
  protected_month: '30 días seguidos sin quemaduras.',
  consistency: 'Registra sesiones en 10 días distintos.',
  explorer: 'Regístrate en 3 contextos diferentes.',
  planner: 'Crea tu plan de bronceado.',
}

/** Motivational headline for the current safety streak. */
export function formatStreakMessage(streak: number): string {
  if (streak <= 0) return 'Empieza hoy a cuidar tu piel'
  if (streak === 1) return '1 día cuidando tu piel'
  return `${streak} días cuidando tu piel`
}
