export function formatDisplayDate(isoDate: string): string {
  const parts = isoDate.slice(0, 10).split('-')
  const year = parts[0] ?? ''
  const month = parts[1] ?? ''
  const day = parts[2] ?? ''
  return `${day}/${month}/${year}`
}

export function getTodayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Adds (or subtracts, with a negative value) whole days to an ISO date. */
export function addDaysToISODate(isoDate: string, days: number): string {
  const base = new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`)
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetweenISODates(from: string, to: string): number {
  const a = new Date(`${from.slice(0, 10)}T00:00:00.000Z`).getTime()
  const b = new Date(`${to.slice(0, 10)}T00:00:00.000Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}
