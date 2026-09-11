import type { Team, UserWithSecrets } from '../../../../../3rd-party/auth/packages/auth/dist'
import type { SigChain } from '../auth/sigchain'
import type { AdmissionProtocolGate } from './admission-protocol-gate'
import type { AdmissionResourceScope } from './admission-resource-scope'
import type { AdmissionCandidate, AdmissionRequest, AdmissionResult, AdmissionTransport } from './admission.types'

/** Transport-facing data and callbacks; policy and ownership stay with admission. */
export interface AdmissionAuthContext {
  readonly attemptId: number
  readonly request: AdmissionRequest
  readonly chain: SigChain
  readonly gate: Pick<
    AdmissionProtocolGate,
    'frozen' | 'published' | 'adopted' | 'closed' | 'assertCurrent' | 'deliver' | 'run' | 'revoke'
  >
  joined(payload: { team: Team; user: UserWithSecrets }): Promise<AdmissionResult>
  fail(error: unknown): void
}

export interface AdmissionAuthContextOptions {
  attemptId: number
  request: AdmissionRequest
  transport: AdmissionTransport
  chain: SigChain
  submit(candidate: AdmissionCandidate): Promise<AdmissionResult>
  fail(error: unknown): void
  scope: AdmissionResourceScope
}

export interface AdmissionOperationOwner {
  readonly signal: AbortSignal
  run<T>(operation: () => Promise<T>): Promise<T>
}
