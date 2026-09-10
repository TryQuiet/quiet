import type { AdmissionTransaction } from '../auth/admission-transaction'
import type { AdmissionLifecycle } from './admission-lifecycle'
import type { AdmissionResourceScope } from './admission-resource-scope'
import type {
  AdmissionAttempt,
  AdmissionCandidate,
  AdmissionEvent,
  AdmissionHandle,
  AdmissionRequest,
  AdmissionResult,
  AdmissionState,
} from './admission.types'
export interface AdmissionSession {
  id: string
  request: AdmissionRequest
  lease: AdmissionLifecycle
  handle: AdmissionHandle
  state: AdmissionState
  scope: AdmissionResourceScope
  attemptScope?: AdmissionResourceScope
  attempt?: AdmissionAttempt
  transaction?: AdmissionTransaction
  candidate?: AdmissionCandidate
  startedAt: number
  deadlineAt: number
  deadline?: NodeJS.Timeout
  fallback?: NodeJS.Timeout
  watchdog?: NodeJS.Timeout
  queue: AdmissionEvent[]
  processing: boolean
  resolve(result: AdmissionResult): void
  reject(error: Error): void
  release(): void
}
