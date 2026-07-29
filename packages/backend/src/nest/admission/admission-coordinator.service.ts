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

@Injectable()
export class AdmissionCoordinator {
  private activeSession?: AdmissionSession

  constructor(
    private readonly qssService: QSSService,
    private readonly sigChainService: SigChainService,
    private readonly localDbService: LocalDbService
  ) {}

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

  private async finalizeCandidate(
    session: AdmissionSession,
    candidate: AdmissionCandidate,
    persistence: AdmissionPersistenceScope
  ): Promise<AdmissionResult> {
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

  private async claimTransport(session: AdmissionSession, transport: AdmissionTransport): Promise<void> {
    const result = await this.localDbService.claimAdmissionTransport(session.request.communityId, transport)
    if (result === 'conflict') {
      throw new Error(
        `Admission transport claim conflict for community ${session.request.communityId}; requested ${transport}`
      )
    }
  }

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

  private async cancelSession(session: AdmissionSession, reason: Error): Promise<void> {
    if (!this.isCurrent(session)) {
      return
    }
    session.abortController.abort(reason)
    await this.stopTransports(session)
  }

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

  private pauseQss(session: AdmissionSession): void {
    if (!session.qssStarted) {
      return
    }
    session.qssStarted = false
    session.runtime.pauseQss()
  }

  private clearSessionTimeout(session: AdmissionSession): void {
    if (session.timeout != null) {
      clearTimeout(session.timeout)
      session.timeout = undefined
    }
  }

  private assertCurrent(session: AdmissionSession): void {
    if (!this.isCurrent(session)) {
      throw session.abortController.signal.reason instanceof Error
        ? session.abortController.signal.reason
        : new Error('Admission session is stale or cancelled')
    }
  }

  private isCurrent(session: AdmissionSession): boolean {
    return this.activeSession?.id === session.id && !session.abortController.signal.aborted
  }

  private sessionKey(request: AdmissionRequest): string {
    return [request.communityId, request.teamId, request.expectedUserId, request.expectedDeviceId, request.kind].join(
      ':'
    )
  }

  private normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error))
  }
}
