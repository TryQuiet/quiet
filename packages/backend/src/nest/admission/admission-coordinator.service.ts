import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type { AdmissionTransaction } from '../auth/admission-transaction'
import { SigChainService } from '../auth/sigchain.service'
import { LocalDbService } from '../local-db/local-db.service'
import { createLogger } from '../common/logger'
import { createAdmissionAuthContext } from './admission-auth-context'
import { AdmissionClock } from './admission-clock'
import { CommunityLifecycle } from './community-lifecycle'
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
  AdmissionOwnedAttempt,
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

  start(input: AdmissionRequest, lease: CommunityLifecycle): AdmissionHandle {
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
    let failDrain!: (error: Error) => void
    const result = new Promise<AdmissionResult>((yes, no) => {
      resolve = yes
      reject = no
    })
    const drained = new Promise<void>((done, fail) => {
      release = done
      failDrain = fail
    })
    void drained.catch(() => undefined)
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
      failDrain,
      state: { status: 'loading' },
      scope: new AdmissionResourceScope(),
      startedAt: this.clock.now(),
      deadlineAt: this.clock.now() + request.timeoutMs,
    }
    lease.ownAdmission(handle)
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
      const transaction = this.sigChain.beginAdmission(request)
      // Register rollback before allocating an attempt so preparation failures also release the barrier.
      session.scope.own(() => transaction.discard())
      this.dispatch(session, {
        type: 'LOADED',
        transaction,
        attempt: this.createAttempt(session, transaction, 1, stored ?? request.preferredTransport),
        claimed: stored != null,
      })
    })
    return handle
  }

  private dispatch(session: AdmissionSession, event: AdmissionEvent): void {
    if (this.activeSession !== session) return
    const previous = session.state
    const update = transition(previous, event, session.request)
    session.state = update.state
    this.logger.info('Admission transition', {
      sessionId: session.id,
      attemptId: 'attempt' in previous ? previous.attempt?.id : undefined,
      event: event.type,
      from: previous.status,
      to: update.state.status,
      stale: previous === update.state,
      elapsedMs: this.clock.now() - session.startedAt,
    })
    // A transition has at most one effect. Install state first, so synchronous
    // callbacks can re-enter dispatch without a queue or a separate candidate reservation.
    if (update.effect != null) {
      try {
        this.effect(session, update.effect)
      } catch (error) {
        this.dispatch(session, { type: 'FAILED', error: admissionError(error) })
      }
    }
  }

  private createAttempt(
    session: AdmissionSession,
    transaction: AdmissionTransaction,
    id: number,
    transport: AdmissionTransport
  ): AdmissionOwnedAttempt {
    const scope = new AdmissionResourceScope()
    const { context, gate } = createAdmissionAuthContext({
      attemptId: id,
      request: session.request,
      transport,
      chain: transaction.stage(),
      submit: candidate => this.submit(session, id, candidate),
      fail: error => this.dispatch(session, { type: 'ATTEMPT_FAILED', attemptId: id, error: admissionError(error) }),
      scope,
    })
    const adapter = transport === AdmissionTransport.QSS ? this.qss : this.p2p
    return { ...adapter.create({ context, scope, lease: session.lease }), id, transport, scope, gate }
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
        if (state.attempt.transport === AdmissionTransport.QSS && session.request.kind === AdmissionKind.DEVICE) {
          session.fallback = this.clock.after(Math.min(60_000, session.request.timeoutMs / 2), () =>
            this.dispatch(session, { type: 'FALLBACK_DUE', attemptId: state.attempt.id })
          )
        }
        void state.attempt.prepare().then(
          () => this.dispatch(session, { type: 'PREPARED', attemptId: state.attempt.id }),
          error =>
            this.dispatch(session, {
              type: 'ATTEMPT_FAILED',
              attemptId: state.attempt.id,
              error: admissionError(error),
            })
        )
        return
      }
      case 'claim': {
        const state = session.state
        if (state.status !== 'claiming') return
        this.run(session, async () => {
          const claim = await session.scope.run(() =>
            this.db.claimAdmissionTransport(session.request.communityId, state.attempt.transport)
          )
          if (claim === 'conflict') throw new AdmissionError('persistence', 'Admission transport ownership conflicts')
          this.dispatch(session, { type: 'CLAIMED', attemptId: state.attempt.id })
        })
        return
      }
      case 'start': {
        const state = session.state
        if (state.status !== 'admitting') return
        void state.attempt.start().catch(error =>
          this.dispatch(session, {
            type: 'ATTEMPT_FAILED',
            attemptId: state.attempt.id,
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
            await state.attempt.stop(new AdmissionError('availability', 'Retiring QSS for device fallback'))
          } catch (error) {
            throw new AdmissionRecoveryRequiredError('Admission teardown failed', error)
          }
          if (this.clock.now() >= session.deadlineAt) {
            this.dispatch(session, {
              type: 'DEADLINE',
              error: new AdmissionError('timeout', 'Admission acquisition deadline expired'),
            })
          } else if (session.state === state) {
            this.dispatch(session, {
              type: 'ATTEMPT_DRAINED',
              attemptId: state.attempt.id,
              nextAttempt: this.createAttempt(session, state.transaction, state.attempt.id + 1, AdmissionTransport.P2P),
            })
          }
        })
        return
      }
      case 'finalize': {
        const state = session.state
        if (state.status !== 'finalizing') return
        this.clearTimers(session)
        state.attempt.gate.freeze()
        this.watch(session)
        this.run(session, async () => {
          await state.attempt.scope.idle()
          await session.scope.idle()
          await state.transaction.commit(state.candidate)
          try {
            session.lease.adopt(state.attempt.scope, state.attempt.gate)
          } catch (error) {
            throw new AdmissionRecoveryRequiredError('Durable admission connection handoff failed', error)
          }
          this.dispatch(session, { type: 'COMMIT_SUCCEEDED' })
        })
        return
      }
      case 'drain': {
        const state = session.state
        if (state.status !== 'draining') return
        const reason = state.error
        this.clearTimers(session)
        session.reject(reason)
        state.attempt?.gate.revoke()
        session.scope.revoke(reason)
        this.watch(session)
        this.run(session, async () => {
          try {
            await Promise.all([session.scope.idle(), state.attempt?.stop(reason)])
            await session.scope.drain(reason)
          } catch (error) {
            throw new AdmissionRecoveryRequiredError('Admission drain requires recovery', error)
          }
          this.dispatch(session, { type: 'DRAINED' })
        })
        return
      }
      case 'recover': {
        const state = session.state
        if (state.status !== 'recovery-required') return
        this.clearTimers(session)
        state.attempt?.gate.revoke()
        session.reject(state.error)
        // Keep the session fenced, but make lifecycle waits fail explicitly.
        session.failDrain(state.error)
        this.logger.error('Admission requires process recovery', { sessionId: session.id })
        return
      }
      case 'succeed': {
        const state = session.state
        if (state.status !== 'succeeded') return
        const candidate = state.candidate
        session.resolve({
          teamId: candidate.teamId,
          userId: candidate.userId,
          deviceId: candidate.deviceId,
          transport: candidate.transport,
        })
        this.release(session)
        void session.lease
          .run(async () => state.attempt.gate.resume())
          .catch(error => {
            this.logger.warn('Post-admission synchronization did not resume', { sessionId: session.id, error })
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
      (state.status === 'succeeded' || state.status === 'finalizing') &&
      state.candidate.team === candidate.team &&
      state.candidate.chain === candidate.chain
    )
      return session.handle.result
    if (
      this.activeSession !== session ||
      state.status !== 'admitting' ||
      state.attempt.id !== attemptId ||
      candidate.chain !== state.attempt.context.chain ||
      candidate.transport !== state.attempt.transport
    )
      return Promise.reject(new AdmissionError('cancelled', 'Stale or closed admission candidate'))
    this.dispatch(session, { type: 'CANDIDATE', attemptId, candidate })
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
