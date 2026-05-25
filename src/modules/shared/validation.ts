const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

export function isISODateString(value: string): boolean {
  return ISO_DATE_RE.test(value)
}

export function isISODateTimeString(value: string): boolean {
  return ISO_DATETIME_RE.test(value)
}
