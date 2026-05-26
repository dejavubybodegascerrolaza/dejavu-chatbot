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
