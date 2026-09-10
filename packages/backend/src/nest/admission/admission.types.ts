import type { Team, UserWithSecrets } from '../../../../../3rd-party/auth/packages/auth/dist'
import type { SigChain } from '../auth/sigchain'
import type { AdmissionAuthContext } from './admission-auth-context'
import type { AdmissionLifecycle } from './admission-lifecycle'
import type { AdmissionResourceScope } from './admission-resource-scope'

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
  token: symbol
  chain: SigChain
  team: Team
  user: UserWithSecrets
}
export interface AdmissionHandle {
  readonly id: string
  readonly result: Promise<AdmissionResult>
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
  lease: AdmissionLifecycle
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

export type AttemptState = { attemptId: number; transport: AdmissionTransport; claimed: boolean }
export type AdmissionState =
  | { status: 'loading' }
  | ({ status: 'preparing' | 'claiming' | 'admitting' | 'retiring' } & AttemptState)
  | ({ status: 'finalizing'; token: symbol } & AttemptState)
  | { status: 'draining'; error: Error }
  | { status: 'succeeded' | 'failed' }
  | { status: 'recovery-required'; error: Error }
export type AdmissionEvent =
  | { type: 'LOADED'; transport: AdmissionTransport; claimed: boolean }
  | { type: 'PREPARED' | 'CLAIMED' | 'FALLBACK_DUE' | 'ATTEMPT_DRAINED'; attemptId: number }
  | { type: 'CANDIDATE'; attemptId: number; token: symbol }
  | { type: 'ATTEMPT_FAILED'; attemptId: number; error: AdmissionError }
  | { type: 'CANCEL' | 'DEADLINE' | 'FAILED' | 'RECOVERY_REQUIRED'; error: Error }
  | { type: 'COMMIT_SUCCEEDED' | 'DRAINED' }
export type AdmissionEffect =
  'prepare' | 'claim' | 'start' | 'retire' | 'finalize' | 'drain' | 'succeed' | 'release' | 'recover'
export interface AdmissionTransition {
  state: AdmissionState
  effects: AdmissionEffect[]
}
