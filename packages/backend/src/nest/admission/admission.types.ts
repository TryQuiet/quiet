import type { Team, UserWithSecrets } from '../../../../../3rd-party/auth/packages/auth/dist'
import type { SigChain } from '../auth/sigchain'
import type { AdmissionAuthContext } from './admission-auth-context.types'
import type { AdmissionTransaction } from '../auth/admission-transaction'
import type { CommunityLifecycle } from './community-lifecycle'
import type { AdmissionResourceScope } from './admission-resource-scope'
import type { AdmissionProtocolGate } from './admission-protocol-gate'

export enum AdmissionKind {
  MEMBER = 'member',
  DEVICE = 'device',
}
export enum AdmissionTransport {
  QSS = 'qss',
  P2P = 'p2p',
}

export interface AdmissionRequest {
  communityId: string
  teamId: string
  expectedUserId: string
  expectedDeviceId: string
  kind: AdmissionKind
  preferredTransport: AdmissionTransport
  timeoutMs: number
}
export interface AdmissionResult {
  teamId: string
  userId: string
  deviceId: string
  transport: AdmissionTransport
}
export interface AdmissionCandidate extends AdmissionResult {
  kind: AdmissionKind
  chain: SigChain
  team: Team
  user: UserWithSecrets
}
export interface AdmissionHandle {
  readonly id: string
  readonly result: Promise<AdmissionResult>
  /** Rejects when cleanup cannot safely finish without process recovery. */
  readonly drained: Promise<void>
  cancel(reason: Error): Promise<void>
}
export interface AdmissionAttempt {
  readonly context: AdmissionAuthContext
  prepare(): Promise<void>
  start(): Promise<void>
  stop(reason: Error): Promise<void>
}
export interface AdmissionAttemptOptions {
  context: AdmissionAuthContext
  scope: AdmissionResourceScope
  lease: CommunityLifecycle
}
export interface PreparedQssAdmission {
  teamId: string
  kind: AdmissionKind
}
export type CommunityAdmissionMetadata = { admissionTransport?: AdmissionTransport }
export type AdmissionFailureKind =
  | 'availability'
  | 'transport'
  | 'protocol'
  | 'validation'
  | 'persistence'
  | 'cancelled'
  | 'timeout'
  | 'teardown'
  | 'recovery'
export class AdmissionError extends Error {
  constructor(
    readonly kind: AdmissionFailureKind,
    message: string,
    readonly cause?: unknown
  ) {
    super(message)
    this.name = 'AdmissionError'
  }
}
export class AdmissionBusyError extends Error {
  constructor() {
    super('Admission is already active or draining with a different request')
    this.name = 'AdmissionBusyError'
  }
}
export class AdmissionRecoveryRequiredError extends AdmissionError {
  constructor(message: string, cause?: unknown) {
    super('recovery', message, cause)
    this.name = 'AdmissionRecoveryRequiredError'
  }
}
export function admissionError(error: unknown, kind: AdmissionFailureKind = 'protocol'): AdmissionError {
  return error instanceof AdmissionError
    ? error
    : new AdmissionError(kind, error instanceof Error ? error.message : String(error), error)
}

export interface AdmissionOwnedAttempt extends AdmissionAttempt {
  readonly gate: AdmissionProtocolGate
  readonly id: number
  readonly transport: AdmissionTransport
  readonly scope: AdmissionResourceScope
}
export interface AttemptState {
  transaction: AdmissionTransaction
  attempt: AdmissionOwnedAttempt
  claimed: boolean
}
export interface AdmissionCleanup {
  attempt?: AdmissionOwnedAttempt
}
export type AdmissionState =
  | { status: 'loading' }
  | ({ status: 'preparing' | 'claiming' | 'admitting' | 'retiring' } & AttemptState)
  | ({ status: 'finalizing'; candidate: AdmissionCandidate } & AttemptState)
  | ({ status: 'draining' | 'recovery-required'; error: Error } & AdmissionCleanup)
  | { status: 'succeeded'; candidate: AdmissionCandidate; attempt: AdmissionOwnedAttempt }
  | { status: 'failed' }
export type AdmissionEvent =
  | ({ type: 'LOADED' } & AttemptState)
  | { type: 'PREPARED' | 'CLAIMED' | 'FALLBACK_DUE'; attemptId: number }
  | { type: 'ATTEMPT_DRAINED'; attemptId: number; nextAttempt: AdmissionOwnedAttempt }
  | { type: 'CANDIDATE'; attemptId: number; candidate: AdmissionCandidate }
  | { type: 'ATTEMPT_FAILED'; attemptId: number; error: AdmissionError }
  | { type: 'CANCEL' | 'DEADLINE' | 'FAILED' | 'RECOVERY_REQUIRED'; error: Error }
  | { type: 'COMMIT_SUCCEEDED' | 'DRAINED' }
export type AdmissionEffect =
  'prepare' | 'claim' | 'start' | 'retire' | 'finalize' | 'drain' | 'succeed' | 'release' | 'recover'
export interface AdmissionTransition {
  state: AdmissionState
  effect?: AdmissionEffect
}
