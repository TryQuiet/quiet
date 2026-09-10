import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { SigChainService } from '../auth/sigchain.service'
import { LocalDbService } from '../local-db/local-db.service'
import { createLogger } from '../common/logger'
import { AdmissionAuthContext } from './admission-auth-context'
import { AdmissionClock } from './admission-clock'
import { AdmissionLifecycle } from './admission-lifecycle'
import { AdmissionResourceScope } from './admission-resource-scope'
import { transition } from './admission.machine'
import type { AdmissionSession } from './admission-session.types'
import { QssAdmissionAdapter } from './qss-admission.adapter'
import { P2pAdmissionAdapter } from './p2p-admission.adapter'
import {
  AdmissionBusyError,
  AdmissionCandidate,
  AdmissionEffect,
  AdmissionError,
  AdmissionEvent,
  AdmissionHandle,
  AdmissionKind,
  AdmissionRecoveryRequiredError,
  AdmissionRequest,
  AdmissionResult,
  AdmissionTransport,
  CommunityAdmissionMetadata,
  admissionError,
} from './admission.types'

@Injectable()
export class AdmissionCoordinator {
  private activeSession?: AdmissionSession
  private readonly logger = createLogger(AdmissionCoordinator.name)

  constructor(
    private readonly qss: QssAdmissionAdapter,
    private readonly p2p: P2pAdmissionAdapter,
    private readonly sigChain: SigChainService,
    private readonly db: LocalDbService,
    private readonly clock: AdmissionClock
  ) {}

  start(input: AdmissionRequest, lease: AdmissionLifecycle): AdmissionHandle {
    const request = Object.freeze({ ...input })
    const active = this.activeSession
    if (active != null) {
      if (
        active.lease === lease &&
        (Object.keys(request) as Array<keyof AdmissionRequest>).every(key => request[key] === active.request[key])
      )
        return active.handle
      throw new AdmissionBusyError()
    }
    lease.assertCurrent()
    if (lease.communityId !== request.communityId || !Number.isFinite(request.timeoutMs) || request.timeoutMs <= 0) {
      throw new AdmissionError('validation', 'Invalid admission request or lifecycle lease')
    }
    let resolve!: (result: AdmissionResult) => void
    let reject!: (error: Error) => void
    let release!: () => void
    const result = new Promise<AdmissionResult>((yes, no) => {
      resolve = yes
      reject = no
    })
    const drained = new Promise<void>(done => {
      release = done
    })
    void result.catch(() => undefined)
    const id = randomUUID()
    const handle: AdmissionHandle = {
      id,
      result,
      drained,
      cancel: reason => {
        this.dispatch(session, { type: 'CANCEL', error: reason })
        return drained
      },
    }
    const session: AdmissionSession = {
      id,
      request,
      lease,
      handle,
      resolve,
      reject,
      release,
      state: { status: 'loading' },
      scope: new AdmissionResourceScope(),
      startedAt: this.clock.now(),
      deadlineAt: this.clock.now() + request.timeoutMs,
      queue: [],
      processing: false,
    }
    this.activeSession = session
    session.deadline = this.clock.after(request.timeoutMs, () =>
      this.dispatch(session, {
        type: 'DEADLINE',
        error: new AdmissionError('timeout', 'Admission acquisition deadline expired'),
      })
    )
    this.run(session, async () => {
      const community = await session.scope.run(() => this.db.getCommunity(request.communityId))
      session.scope.assertCurrent()
      if (community == null) throw new AdmissionError('validation', 'Admission community is missing')
      const stored =
        request.kind === AdmissionKind.MEMBER ? (community as CommunityAdmissionMetadata).admissionTransport : undefined
      session.transaction = this.sigChain.beginAdmission(request)
      this.dispatch(session, {
        type: 'LOADED',
        transport: stored ?? request.preferredTransport,
        claimed: stored != null,
      })
    })
    return handle
  }

  cancelActive(reason: Error): Promise<void> {
    return this.activeSession?.handle.cancel(reason) ?? Promise.resolve()
  }

  private dispatch(session: AdmissionSession, event: AdmissionEvent): void {
    if (this.activeSession !== session) return
    session.queue.push(event)
    if (session.processing) return
    session.processing = true
    try {
      while (session.queue.length > 0) {
        const next = session.queue.shift()!
        const previous = session.state
        const update = transition(previous, next, session.request)
        session.state = update.state
        this.logger.info('Admission transition', {
          sessionId: session.id,
          attemptId: 'attemptId' in previous ? previous.attemptId : undefined,
          transport: 'transport' in previous ? previous.transport : undefined,
          event: next.type,
          from: previous.status,
          to: update.state.status,
          stale: previous === update.state,
          elapsedMs: this.clock.now() - session.startedAt,
        })
        for (const effect of update.effects) {
          try {
            this.effect(session, effect)
          } catch (error) {
            session.queue.push({ type: 'FAILED', error: admissionError(error) })
          }
        }
      }
    } finally {
      session.processing = false
    }
  }

  private run(session: AdmissionSession, operation: () => Promise<void>): void {
    void operation().catch(error =>
      this.dispatch(session, {
        type: error instanceof AdmissionRecoveryRequiredError ? 'RECOVERY_REQUIRED' : 'FAILED',
        error: admissionError(error),
      })
    )
  }

  private effect(session: AdmissionSession, effect: AdmissionEffect): void {
    switch (effect) {
      case 'prepare': {
        const state = session.state
        if (state.status !== 'preparing') return
        session.candidate = undefined
        const scope = new AdmissionResourceScope()
        session.attemptScope = scope
        const context = new AdmissionAuthContext(
          session.id,
          state.attemptId,
          session.request,
          state.transport,
          session.transaction!.stage(),
          candidate => this.submit(session, state.attemptId, candidate),
          error =>
            this.dispatch(session, {
              type: 'ATTEMPT_FAILED',
              attemptId: state.attemptId,
              error: admissionError(error),
            }),
          scope
        )
        const adapter = state.transport === AdmissionTransport.QSS ? this.qss : this.p2p
        session.attempt = adapter.create({ context, scope, lease: session.lease })
        if (state.transport === AdmissionTransport.QSS && session.request.kind === AdmissionKind.DEVICE) {
          session.fallback = this.clock.after(Math.min(60_000, session.request.timeoutMs / 2), () =>
            this.dispatch(session, { type: 'FALLBACK_DUE', attemptId: state.attemptId })
          )
        }
        void session.attempt.prepare().then(
          () => this.dispatch(session, { type: 'PREPARED', attemptId: state.attemptId }),
          error =>
            this.dispatch(session, { type: 'ATTEMPT_FAILED', attemptId: state.attemptId, error: admissionError(error) })
        )
        return
      }
      case 'claim': {
        const state = session.state
        if (state.status !== 'claiming') return
        this.run(session, async () => {
          const claim = await session.scope.run(() =>
            this.db.claimAdmissionTransport(session.request.communityId, state.transport)
          )
          if (claim === 'conflict') throw new AdmissionError('persistence', 'Admission transport ownership conflicts')
          this.dispatch(session, { type: 'CLAIMED', attemptId: state.attemptId })
        })
        return
      }
      case 'start': {
        const state = session.state
        if (state.status !== 'admitting') return
        void session.attempt!.start().catch(error =>
          this.dispatch(session, {
            type: 'ATTEMPT_FAILED',
            attemptId: state.attemptId,
            error: admissionError(error, 'transport'),
          })
        )
        return
      }
      case 'retire': {
        const state = session.state
        if (state.status !== 'retiring') return
        this.clock.clear(session.fallback)
        this.run(session, async () => {
          try {
            await session.attempt!.stop(new AdmissionError('availability', 'Retiring QSS for device fallback'))
          } catch (error) {
            throw new AdmissionRecoveryRequiredError('Admission teardown failed', error)
          }
          if (this.clock.now() >= session.deadlineAt) {
            this.dispatch(session, {
              type: 'DEADLINE',
              error: new AdmissionError('timeout', 'Admission acquisition deadline expired'),
            })
          } else this.dispatch(session, { type: 'ATTEMPT_DRAINED', attemptId: state.attemptId })
        })
        return
      }
      case 'finalize':
        this.clearTimers(session)
        session.attempt!.context.freeze()
        this.watch(session)
        this.run(session, async () => {
          await session.attemptScope!.idle()
          await session.scope.idle()
          await session.transaction!.commit(session.candidate!)
          try {
            session.attemptScope!.transferTo(session.lease.resources)
            session.attempt!.context.adopt(session.lease)
          } catch (error) {
            throw new AdmissionRecoveryRequiredError('Durable admission connection handoff failed', error)
          }
          this.dispatch(session, { type: 'COMMIT_SUCCEEDED' })
        })
        return
      case 'drain': {
        if (session.state.status !== 'draining') return
        const reason = session.state.error
        this.clearTimers(session)
        session.reject(reason)
        session.attempt?.context.revoke()
        session.scope.revoke(reason)
        this.watch(session)
        this.run(session, async () => {
          try {
            await Promise.all([session.scope.drain(reason), session.attempt?.stop(reason)])
            session.transaction?.discard()
          } catch (error) {
            throw new AdmissionRecoveryRequiredError('Admission drain requires recovery', error)
          }
          this.dispatch(session, { type: 'DRAINED' })
        })
        return
      }
      case 'recover':
        this.clearTimers(session)
        session.attempt?.context.revoke()
        if (session.state.status === 'recovery-required') session.reject(session.state.error)
        this.logger.error('Admission requires process recovery', { sessionId: session.id })
        return
      case 'succeed': {
        const candidate = session.candidate!
        session.resolve({
          teamId: candidate.teamId,
          userId: candidate.userId,
          deviceId: candidate.deviceId,
          transport: candidate.transport,
        })
        this.release(session)
        // Resuming protocol delivery is lifecycle work; admission is already durable.
        void session.lease
          .run(async () => session.attempt!.context.resume())
          .catch(error => {
            this.logger.warn('Post-admission synchronization did not resume', { sessionId: session.id })
          })
        return
      }
      case 'release':
        this.release(session)
        return
      default: {
        const exhaustive: never = effect
        return exhaustive
      }
    }
  }

  private submit(
    session: AdmissionSession,
    attemptId: number,
    candidate: AdmissionCandidate
  ): Promise<AdmissionResult> {
    const state = session.state
    if (
      state.status === 'succeeded' &&
      session.candidate?.token === candidate.token &&
      candidate.chain === session.candidate.chain
    )
      return session.handle.result
    if (
      this.activeSession !== session ||
      !('attemptId' in state) ||
      state.attemptId !== attemptId ||
      candidate.chain !== session.attempt?.context.chain ||
      candidate.transport !== state.transport
    ) {
      return Promise.reject(new AdmissionError('cancelled', 'Stale admission candidate'))
    }
    if (state.status === 'finalizing' && state.token === candidate.token) return session.handle.result
    if (state.status !== 'admitting')
      return Promise.reject(new AdmissionError('cancelled', 'Admission candidate is closed'))
    // An adapter may submit synchronously from a start effect while the event queue is
    // processing. Reserve the first token before its queued transition runs.
    if (session.candidate != null) {
      return session.candidate.token === candidate.token
        ? session.handle.result
        : Promise.reject(new AdmissionError('cancelled', 'A different admission candidate is already selected'))
    }
    session.candidate = candidate
    this.dispatch(session, { type: 'CANDIDATE', attemptId, token: candidate.token })
    return session.handle.result
  }

  private clearTimers(session: AdmissionSession): void {
    this.clock.clear(session.deadline)
    this.clock.clear(session.fallback)
    this.clock.clear(session.watchdog)
  }
  private watch(session: AdmissionSession): void {
    session.watchdog = this.clock.after(30_000, () =>
      this.logger.error('Admission operation stalled; ownership remains fenced', {
        sessionId: session.id,
        state: session.state.status,
        elapsedMs: this.clock.now() - session.startedAt,
      })
    )
  }
  private release(session: AdmissionSession): void {
    this.clearTimers(session)
    if (this.activeSession === session) this.activeSession = undefined
    session.release()
  }
}
