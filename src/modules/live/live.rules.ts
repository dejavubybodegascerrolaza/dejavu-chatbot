/** Default minutes between "turn over" reminders for an even tan. */
export const DEFAULT_FLIP_INTERVAL_MINUTES = 15

/** SPF presets offered in the live session. */
export const SPF_PRESETS = [1, 30, 50] as const
export type SpfPreset = (typeof SPF_PRESETS)[number]
