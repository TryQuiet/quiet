import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { AdmissionPersistenceScope } from '../auth/types'
import { SigChainService } from '../auth/sigchain.service'
import { RoleName } from '../auth/services/roles/roles'
import { LocalDbService } from '../local-db/local-db.service'
import { QSSService } from '../qss/qss.service'
import {
  AdmissionCandidate,
  AdmissionFinalizer,
  AdmissionKind,
  AdmissionRequest,
  AdmissionResult,
  AdmissionRuntime,
  AdmissionTransport,
  PreparedQssAdmission,
  QssAdmissionStartResult,
} from './admission.types'

const DEFAULT_QSS_FALLBACK_MS = 60_000

interface AdmissionSession {
  id: string
  key: string
  request: AdmissionRequest
  runtime: AdmissionRuntime
  abortController: AbortController
  promise?: Promise<AdmissionResult>
  timeout?: NodeJS.Timeout
  finalizationPromise?: Promise<AdmissionResult>
  stoppingPromise?: Promise<void>
  qssStarted: boolean
  p2pStarted: boolean
}

/**
 * Coordinates admission to a community across QSS and peer-to-peer transports.
 *
 * The coordinator owns at most one admission session at a time, selects and
 * falls back between transports, validates the admitted identity and sigchain,
 * and commits admission persistence only after a candidate passes validation.
 * Callers provide transport lifecycle operations through {@link AdmissionRuntime}
 * so this service can remain independent of connection setup details.
 */
@Injectable()
export class AdmissionCoordinator {
  private activeSession?: AdmissionSession

  /**
   * Creates an admission coordinator backed by the QSS, sigchain, and local
   * admission-transport persistence services.
   */
  constructor(
    private readonly qssService: QSSService,
    private readonly sigChainService: SigChainService,
    private readonly localDbService: LocalDbService
  ) {}

  /**
   * Starts an admission session or returns the in-flight promise for the same
   * request.
   *
   * @throws When a different admission session is already active, admission
   * times out, no usable transport is available, or admission fails validation.
   */
  coordinate(request: AdmissionRequest, runtime: AdmissionRuntime): Promise<AdmissionResult> {
    const key = this.sessionKey(request)
    if (this.activeSession != null) {
      if (this.activeSession.key === key && this.activeSession.promise != null) {
        return this.activeSession.promise
      }
      return Promise.reject(
        new Error(
          `Admission session ${this.activeSession.key} is already active; cannot start concurrent session ${key}`
        )
      )
    }

    const session: AdmissionSession = {
      id: randomUUID(),
      key,
      request,
      runtime,
      abortController: new AbortController(),
      qssStarted: false,
      p2pStarted: false,
    }
    this.activeSession = session
    session.timeout = setTimeout(() => {
      void this.cancelSession(
        session,
        new Error(`Admission timed out after ${request.timeoutMs}ms for team ${request.teamId}`)
      )
    }, request.timeoutMs)
    session.promise = this.runSession(session)
    return session.promise
  }

  /**
   * Cancels the active admission session and stops its transports.
   *
   * If a candidate is already being finalized, waits for that finalization
   * instead of interrupting its persistence commit.
   */
  async cancelActive(reason: Error): Promise<void> {
    const session = this.activeSession
    if (session == null) {
      return
    }
    if (session.finalizationPromise != null) {
      await session.finalizationPromise.catch(() => undefined)
      return
    }
    await this.cancelSession(session, reason)
  }

  /**
   * Runs a session within a sigchain admission-persistence scope and performs
   * cleanup when the session succeeds, fails, or is cancelled.
   */
  private async runSession(session: AdmissionSession): Promise<AdmissionResult> {
    try {
      const result = await this.sigChainService.withAdmissionPersistence(session.request.teamId, async persistence => {
        const finalize: AdmissionFinalizer = candidate => this.finalizeCandidate(session, candidate, persistence)
        return this.selectTransport(session, finalize)
      })
      if (result.transport === AdmissionTransport.P2P) {
        void session.runtime.convergeQssAfterP2p().catch(() => undefined)
      }
      return result
    } catch (error) {
      if (!session.abortController.signal.aborted) {
        session.abortController.abort(error)
      }
      await this.stopTransports(session)
      throw this.normalizeError(error)
    } finally {
      this.clearSessionTimeout(session)
      if (this.activeSession?.id === session.id) {
        this.activeSession = undefined
      }
    }
  }

  /**
   * Selects the transport required by stored ownership or attempts the preferred
   * transport before falling back to peer-to-peer admission.
   */
  private async selectTransport(session: AdmissionSession, finalize: AdmissionFinalizer): Promise<AdmissionResult> {
    const { request } = session

    if (request.kind === AdmissionKind.MEMBER && request.storedTransport != null) {
      if (request.storedTransport === AdmissionTransport.QSS) {
        const result = await this.startQssAdmission(session, false, finalize)
        if (result == null) {
          throw new Error('Stored QSS admission transport is unavailable')
        }
        return result
      }
      return this.startP2pAdmission(session, false, finalize)
    }

    if (request.preferredTransport === AdmissionTransport.QSS) {
      const qssResult = await this.startQssAdmission(session, request.kind === AdmissionKind.MEMBER, finalize)
      if (qssResult != null) {
        return qssResult
      }
    }

    return this.startP2pAdmission(session, request.kind === AdmissionKind.MEMBER, finalize)
  }

  /**
   * Starts QSS admission after the runtime establishes a QSS connection.
   *
   * Returns `undefined` when QSS is unavailable and fallback is permitted.
   * Device admissions also fall back when QSS does not complete within the
   * session's fallback window.
   */
  private async startQssAdmission(
    session: AdmissionSession,
    claimTransport: boolean,
    finalize: AdmissionFinalizer
  ): Promise<AdmissionResult | undefined> {
    this.assertCurrent(session)
    session.qssStarted = true
    const startResult = await session.runtime.startQss()
    this.assertCurrent(session)
    if (startResult !== QssAdmissionStartResult.READY) {
      session.qssStarted = false
      return undefined
    }

    let prepared: PreparedQssAdmission
    try {
      prepared = await this.qssService.prepareAdmission(session.request.teamId, this.sigChainService.getActiveChain())
    } catch (error) {
      if (session.request.kind === AdmissionKind.MEMBER && session.request.storedTransport === AdmissionTransport.QSS) {
        throw error
      }
      this.pauseQss(session)
      return undefined
    }

    this.assertCurrent(session)
    if (claimTransport) {
      await this.claimTransport(session, AdmissionTransport.QSS)
    }

    try {
      const admission = this.qssService.startPreparedAdmission(prepared, finalize)
      if (session.request.kind !== AdmissionKind.DEVICE) {
        return await admission
      }

      const fallbackDelay = Math.min(DEFAULT_QSS_FALLBACK_MS, Math.max(1, Math.floor(session.request.timeoutMs / 2)))
      let fallbackTimeout!: NodeJS.Timeout
      const fallback = new Promise<undefined>(resolve => {
        fallbackTimeout = setTimeout(() => resolve(undefined), fallbackDelay)
      })
      try {
        const result = await Promise.race([admission, fallback])
        if (result == null) {
          this.pauseQss(session)
        }
        return result
      } finally {
        clearTimeout(fallbackTimeout)
      }
    } catch (error) {
      if (session.request.kind === AdmissionKind.MEMBER || session.finalizationPromise != null) {
        throw error
      }
      this.pauseQss(session)
      return undefined
    }
  }

  /**
   * Claims peer-to-peer transport ownership when required and starts admission
   * through the runtime.
   */
  private async startP2pAdmission(
    session: AdmissionSession,
    claimTransport: boolean,
    finalize: AdmissionFinalizer
  ): Promise<AdmissionResult> {
    this.assertCurrent(session)
    if (claimTransport) {
      await this.claimTransport(session, AdmissionTransport.P2P)
    }
    session.p2pStarted = true
    return session.runtime.startP2p(finalize)
  }

  /**
   * Validates and commits the first candidate produced by a transport.
   *
   * Concurrent attempts share the same finalization promise so persistence can
   * be committed at most once.
   */
  private finalizeCandidate(
    session: AdmissionSession,
    candidate: AdmissionCandidate,
    persistence: AdmissionPersistenceScope
  ): Promise<AdmissionResult> {
    if (session.finalizationPromise != null) {
      return session.finalizationPromise
    }
    const finalization = (async () => {
      this.clearSessionTimeout(session)
      this.validateCandidate(session.request, candidate)
      this.assertCurrent(session)
      await persistence.commit()
      this.assertCurrent(session)
      return {
        teamId: candidate.teamId,
        userId: candidate.userId,
        deviceId: candidate.deviceId,
        transport: candidate.transport,
      }
    })()
    session.finalizationPromise = finalization
    return finalization
  }

  /**
   * Durably claims a community's admission transport, rejecting ownership
   * conflicts with another transport.
   */
  private async claimTransport(session: AdmissionSession, transport: AdmissionTransport): Promise<void> {
    const result = await this.localDbService.claimAdmissionTransport(session.request.communityId, transport)
    if (result === 'conflict') {
      throw new Error(
        `Admission transport claim conflict for community ${session.request.communityId}; requested ${transport}`
      )
    }
  }

  /**
   * Verifies that a candidate and the active sigchain match the requested team,
   * user, device, admission kind, and required membership role.
   */
  private validateCandidate(request: AdmissionRequest, candidate: AdmissionCandidate): void {
    if (candidate.teamId !== request.teamId) {
      throw new Error(`Admission team mismatch: ${candidate.teamId} !== ${request.teamId}`)
    }
    if (candidate.userId !== request.expectedUserId) {
      throw new Error(`Admission user mismatch: ${candidate.userId} !== ${request.expectedUserId}`)
    }
    if (candidate.deviceId !== request.expectedDeviceId) {
      throw new Error(`Admission device mismatch: ${candidate.deviceId} !== ${request.expectedDeviceId}`)
    }
    if (candidate.kind !== request.kind) {
      throw new Error(`Admission kind mismatch: ${candidate.kind} !== ${request.kind}`)
    }

    const chain = this.sigChainService.getActiveChain()
    if (chain.team?.id !== request.teamId) {
      throw new Error(`Admitted sigchain team mismatch: ${chain.team?.id} !== ${request.teamId}`)
    }
    if (chain.user.userId !== request.expectedUserId) {
      throw new Error(`Admitted sigchain user mismatch: ${chain.user.userId} !== ${request.expectedUserId}`)
    }
    if (chain.device.deviceId !== request.expectedDeviceId || !chain.team.hasDevice(request.expectedDeviceId)) {
      throw new Error(`Admitted team does not contain device ${request.expectedDeviceId}`)
    }
    if (!chain.roles.amIMemberOfRole(RoleName.MEMBER)) {
      throw new Error(`Admitted user ${request.expectedUserId} does not have the ${RoleName.MEMBER} role`)
    }
  }

  /** Aborts a current session and stops every transport it started. */
  private async cancelSession(session: AdmissionSession, reason: Error): Promise<void> {
    if (!this.isCurrent(session)) {
      return
    }
    session.abortController.abort(reason)
    await this.stopTransports(session)
  }

  /** Stops the session's transports once and shares any in-flight stop operation. */
  private async stopTransports(session: AdmissionSession): Promise<void> {
    if (session.stoppingPromise != null) {
      return session.stoppingPromise
    }
    session.stoppingPromise = (async () => {
      this.pauseQss(session)
      if (session.p2pStarted) {
        session.p2pStarted = false
        await session.runtime.stopP2p().catch(() => undefined)
      }
    })()
    return session.stoppingPromise
  }

  /** Pauses QSS if this session previously started it. */
  private pauseQss(session: AdmissionSession): void {
    if (!session.qssStarted) {
      return
    }
    session.qssStarted = false
    session.runtime.pauseQss()
  }

  /** Clears the session deadline timer if it is still scheduled. */
  private clearSessionTimeout(session: AdmissionSession): void {
    if (session.timeout != null) {
      clearTimeout(session.timeout)
      session.timeout = undefined
    }
  }

  /** Throws the cancellation reason when the session is no longer current. */
  private assertCurrent(session: AdmissionSession): void {
    if (!this.isCurrent(session)) {
      throw session.abortController.signal.reason instanceof Error
        ? session.abortController.signal.reason
        : new Error('Admission session is stale or cancelled')
    }
  }

  /** Reports whether the session is active and has not been aborted. */
  private isCurrent(session: AdmissionSession): boolean {
    return this.activeSession?.id === session.id && !session.abortController.signal.aborted
  }

  /** Builds the stable identity used to deduplicate equivalent admission requests. */
  private sessionKey(request: AdmissionRequest): string {
    return [request.communityId, request.teamId, request.expectedUserId, request.expectedDeviceId, request.kind].join(
      ':'
    )
  }

  /** Converts an arbitrary rejection value into an Error. */
  private normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error))
  }
}
