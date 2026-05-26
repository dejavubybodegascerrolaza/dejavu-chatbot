import * as PrivacyRepository from './privacy.repository'
import type { DataDeletionRequest } from './privacy.types'

export async function requestDataDeletion(userId: string): Promise<DataDeletionRequest> {
  return PrivacyRepository.createDeletionRequest(userId)
}
