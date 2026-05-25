export type DataDeletionRequestStatus = 'pending' | 'processed'

export type DataDeletionRequest = {
  id: string
  userId: string
  requestedAt: string
  status: DataDeletionRequestStatus
  processedAt: string | null
}
