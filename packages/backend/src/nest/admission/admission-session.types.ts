import type { CommunityLifecycle } from './community-lifecycle'
import type { AdmissionResourceScope } from './admission-resource-scope'
import type { AdmissionHandle, AdmissionRequest, AdmissionResult, AdmissionState } from './admission.types'
export interface AdmissionSession {
  id: string
  request: AdmissionRequest
  lease: CommunityLifecycle
  handle: AdmissionHandle
  state: AdmissionState
  scope: AdmissionResourceScope
  startedAt: number
  deadlineAt: number
  deadline?: NodeJS.Timeout
  fallback?: NodeJS.Timeout
  watchdog?: NodeJS.Timeout
  resolve(result: AdmissionResult): void
  reject(error: Error): void
  release(): void
  failDrain(error: Error): void
}
