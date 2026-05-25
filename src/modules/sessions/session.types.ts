export type ExposureContext =
  | 'beach'
  | 'pool'
  | 'urban'
  | 'terrace_garden'
  | 'outdoor_sport'
  | 'other'

export type ProtectionLevel = 'unknown' | 'high' | 'medium' | 'none' | 'not_sure'

export type SensationAfter = 'great' | 'normal' | 'warm_tight' | 'slightly_red' | 'burned'

export type ExposureSession = {
  id: string
  userId: string
  sessionDate: string
  durationMinutes: number
  context: ExposureContext
  uvIndexManual: number | null
  protectionLevel: ProtectionLevel
  sensationAfter: SensationAfter
  notes: string | null
  createdAt: string
  updatedAt: string
}
