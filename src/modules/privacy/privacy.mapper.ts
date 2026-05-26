import type { Tables } from '@/types/database.types'
import type { DataDeletionRequest, DataDeletionRequestStatus } from './privacy.types'

type DeletionRequestRow = Tables<'deletion_requests'>

export function mapDeletionRequestRowToRequest(row: DeletionRequestRow): DataDeletionRequest {
  return {
    id: row.id,
    userId: row.user_id,
    requestedAt: row.requested_at,
    status: row.status as DataDeletionRequestStatus,
    processedAt: row.processed_at,
  }
}
