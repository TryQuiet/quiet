import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { AdmissionPersistenceBarrier } from '../auth/types'
import { SigChainService } from '../auth/sigchain.service'
import { RoleName } from '../auth/services/roles/roles'
import { Libp2pService } from '../libp2p/libp2p.service'
import { Libp2pEvents } from '../libp2p/libp2p.types'
import { LocalDbService } from '../local-db/local-db.service'
import { QSSService } from '../qss/qss.service'
import { QSSAuthErrorPayload, QSSEvents } from '../qss/qss.types'
import {
  AdmissionCandidate,
  AdmissionKind,
  AdmissionPhase,
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
  phase: AdmissionPhase
  promise: Promise<AdmissionResult>
  resolve: (result: AdmissionResult) => void
  reject: (error: Error) => void
  cleanup: Array<() => void>
  barrier?: AdmissionPersistenceBarrier
  selectedTransport?: AdmissionTransport
  winningCandidate?: AdmissionCandidate
  finalizationPromise?: Promise<void>
  qssStarted: boolean
  p2pStarted: boolean
  settled: boolean
}

@Injectable()
export class AdmissionCoordinator {
  private activeSession?: AdmissionSession

  constructor(
    private readonly qssService: QSSService,
    private readonly libp2pService: Libp2pService,
    private readonly sigChainService: SigChainService,
    private readonly localDbService: LocalDbService
  ) {}

  coordinate(request: AdmissionRequest, runtime: AdmissionRuntime): Promise<AdmissionResult> {
    const key = this.sessionKey(request)
    if (this.activeSession != null) {
      if (this.activeSession.key === key) {
        return this.activeSession.promise
      }
      return Promise.reject(
        new Error(
          `Admission session ${this.activeSession.key} is already active; cannot start concurrent session ${key}`
        )
      )
    }

    let resolve!: (result: AdmissionResult) => void
    let reject!: (error: Error) => void
    const promise = new Promise<AdmissionResult>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise
      reject = rejectPromise
    })
    const session: AdmissionSession = {
      id: randomUUID(),
      key,
      request,
      runtime,
      abortController: new AbortController(),
      phase: 'selecting',
      promise,
      resolve,
      reject,
      cleanup: [],
      qssStarted: false,
      p2pStarted: false,
      settled: false,
    }
    this.activeSession = session
    this.configureSession(session)
    void this.startSession(session).catch(error => {
      void this.failSession(session, this.normalizeError(error))
    })
    return promise
  }

  async cancelActive(reason: Error): Promise<void> {
    const session = this.activeSession
    if (session == null || session.settled) {
      return
    }
    if (session.finalizationPromise != null) {
      await session.finalizationPromise.catch(() => undefined)
      return
    }
    await this.failSession(session, reason, true)
  }

  private configureSession(session: AdmissionSession): void {
    const onCandidate = (candidate: AdmissionCandidate) => {
      this.handleCandidate(session, candidate)
    }
    const onQssFailure = (payload: QSSAuthErrorPayload) => {
      if (!this.isCurrent(session) || payload.teamId !== session.request.teamId) {
        return
      }
      if (session.selectedTransport !== AdmissionTransport.QSS || session.winningCandidate != null) {
        return
      }
      if (session.request.kind === AdmissionKind.DEVICE) {
        void this.fallbackToP2p(session).catch(error => {
          void this.failSession(session, this.normalizeError(error))
        })
        return
      }
      void this.failSession(session, payload.error)
    }

    this.qssService.on(QSSEvents.ADMISSION_CANDIDATE, onCandidate)
    this.libp2pService.on(Libp2pEvents.ADMISSION_CANDIDATE, onCandidate)
    this.qssService.on(QSSEvents.QSS_AUTH_ERROR, onQssFailure)
    session.cleanup.push(() => this.qssService.off(QSSEvents.ADMISSION_CANDIDATE, onCandidate))
    session.cleanup.push(() => this.libp2pService.off(Libp2pEvents.ADMISSION_CANDIDATE, onCandidate))
    session.cleanup.push(() => this.qssService.off(QSSEvents.QSS_AUTH_ERROR, onQssFailure))

    const timeout = setTimeout(() => {
      void this.failSession(
        session,
        new Error(`Admission timed out after ${session.request.timeoutMs}ms for team ${session.request.teamId}`)
      )
    }, session.request.timeoutMs)
    session.cleanup.push(() => clearTimeout(timeout))
  }

  private async startSession(session: AdmissionSession): Promise<void> {
    session.barrier = this.sigChainService.beginAdmissionPersistenceBarrier(session.request.teamId)
    const { request } = session

    if (request.kind === AdmissionKind.MEMBER && request.storedTransport != null) {
      if (request.storedTransport === AdmissionTransport.QSS) {
        const started = await this.startQssAdmission(session, false)
        if (!started) {
          throw new Error('Stored QSS admission transport is unavailable')
        }
      } else {
        await this.startP2pAdmission(session, false)
      }
      return
    }

    if (request.preferredTransport === AdmissionTransport.QSS) {
      const qssStarted = await this.startQssAdmission(session, request.kind === AdmissionKind.MEMBER)
      if (qssStarted) {
        return
      }
    }

    await this.startP2pAdmission(session, request.kind === AdmissionKind.MEMBER)
  }

  private async startQssAdmission(session: AdmissionSession, claimTransport: boolean): Promise<boolean> {
    this.assertCurrent(session)
    session.phase = 'qss-admitting'
    session.qssStarted = true
    const startResult = await session.runtime.startQss()
    this.assertCurrent(session)
    if (startResult !== QssAdmissionStartResult.READY) {
      session.qssStarted = false
      return false
    }

    let prepared: PreparedQssAdmission
    try {
      prepared = await this.qssService.prepareAdmission(session.request.teamId, this.sigChainService.getActiveChain())
    } catch (error) {
      if (session.request.kind === AdmissionKind.MEMBER && session.request.storedTransport === AdmissionTransport.QSS) {
        throw error
      }
      session.runtime.pauseQss()
      session.qssStarted = false
      return false
    }

    this.assertCurrent(session)
    if (claimTransport) {
      await this.claimTransport(session, AdmissionTransport.QSS)
    }
    session.selectedTransport = AdmissionTransport.QSS

    try {
      await this.qssService.startPreparedAdmission(prepared)
      this.assertCurrent(session)
    } catch (error) {
      if (session.request.kind === AdmissionKind.MEMBER) {
        throw error
      }
      session.runtime.pauseQss()
      session.qssStarted = false
      session.selectedTransport = undefined
      return false
    }

    if (session.request.kind === AdmissionKind.DEVICE) {
      const fallbackDelay = Math.min(DEFAULT_QSS_FALLBACK_MS, Math.max(1, Math.floor(session.request.timeoutMs / 2)))
      const fallbackTimeout = setTimeout(() => {
        void this.fallbackToP2p(session).catch(error => {
          void this.failSession(session, this.normalizeError(error))
        })
      }, fallbackDelay)
      session.cleanup.push(() => clearTimeout(fallbackTimeout))
    }
    return true
  }

  private async startP2pAdmission(session: AdmissionSession, claimTransport: boolean): Promise<void> {
    this.assertCurrent(session)
    session.phase = 'p2p-admitting'
    if (claimTransport) {
      await this.claimTransport(session, AdmissionTransport.P2P)
    }
    session.selectedTransport = AdmissionTransport.P2P
    session.p2pStarted = true
    await session.runtime.startP2p()
    this.assertCurrent(session)
  }

  private async fallbackToP2p(session: AdmissionSession): Promise<void> {
    if (
      !this.isCurrent(session) ||
      session.request.kind !== AdmissionKind.DEVICE ||
      session.winningCandidate != null ||
      session.selectedTransport === AdmissionTransport.P2P
    ) {
      return
    }
    session.runtime.pauseQss()
    session.qssStarted = false
    await this.startP2pAdmission(session, false)
  }

  private async claimTransport(session: AdmissionSession, transport: AdmissionTransport): Promise<void> {
    const result = await this.localDbService.claimAdmissionTransport(session.request.communityId, transport)
    if (result === 'conflict') {
      throw new Error(
        `Admission transport claim conflict for community ${session.request.communityId}; requested ${transport}`
      )
    }
  }

  private handleCandidate(session: AdmissionSession, candidate: AdmissionCandidate): void {
    if (!this.isCurrent(session) || session.settled) {
      this.rejectCandidate(candidate, new Error('Admission session is no longer active'))
      return
    }
    if (candidate.transport !== session.selectedTransport) {
      this.rejectCandidate(
        candidate,
        new Error(`Ignoring losing ${candidate.transport} candidate; ${session.selectedTransport} owns admission`)
      )
      return
    }
    if (session.winningCandidate != null) {
      this.rejectCandidate(candidate, new Error('Another admission candidate already won this session'))
      return
    }

    session.winningCandidate = candidate
    this.clearSessionTimeouts(session)
    const finalization = this.finalizeCandidate(session, candidate)
    session.finalizationPromise = finalization
    candidate.deferUntilPersisted(finalization)
    void finalization.catch(error => {
      void this.failSession(session, this.normalizeError(error))
    })
  }

  private async finalizeCandidate(session: AdmissionSession, candidate: AdmissionCandidate): Promise<void> {
    session.phase = 'validating'
    this.validateCandidate(session.request, candidate)
    this.assertCurrent(session)

    session.phase = 'persisting'
    if (session.barrier == null) {
      throw new Error('Admission persistence barrier was not initialized')
    }
    await this.sigChainService.commitAdmissionPersistence(session.barrier)
    session.barrier = undefined
    this.assertCurrent(session)

    session.phase = 'admitted'
    session.settled = true
    this.cleanupSession(session)
    if (this.activeSession?.id === session.id) {
      this.activeSession = undefined
    }
    session.resolve({
      teamId: candidate.teamId,
      userId: candidate.userId,
      deviceId: candidate.deviceId,
      transport: candidate.transport,
    })

    if (candidate.transport === AdmissionTransport.P2P) {
      void session.runtime.convergeQssAfterP2p().catch(() => undefined)
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

  private async failSession(session: AdmissionSession, error: Error, cancelled = false): Promise<void> {
    if (!this.isCurrent(session) || session.settled) {
      return
    }
    session.settled = true
    session.phase = cancelled ? 'cancelled' : 'failed'
    if (!session.abortController.signal.aborted) {
      session.abortController.abort(error)
    }
    this.cleanupSession(session)
    if (session.qssStarted) {
      session.runtime.pauseQss()
    }
    if (session.p2pStarted) {
      await session.runtime.stopP2p().catch(() => undefined)
    }
    if (session.barrier != null) {
      this.sigChainService.cancelAdmissionPersistence(session.barrier)
      session.barrier = undefined
    }
    if (this.activeSession?.id === session.id) {
      this.activeSession = undefined
    }
    session.reject(error)
  }

  private cleanupSession(session: AdmissionSession): void {
    for (const cleanup of session.cleanup.splice(0)) {
      cleanup()
    }
  }

  private clearSessionTimeouts(session: AdmissionSession): void {
    for (const cleanup of session.cleanup.splice(0)) {
      cleanup()
    }
  }

  private rejectCandidate(candidate: AdmissionCandidate, error: Error): void {
    const rejection = Promise.reject(error)
    candidate.deferUntilPersisted(rejection)
    void rejection.catch(() => undefined)
  }

  private assertCurrent(session: AdmissionSession): void {
    if (!this.isCurrent(session)) {
      throw new Error('Admission session is stale or cancelled')
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
