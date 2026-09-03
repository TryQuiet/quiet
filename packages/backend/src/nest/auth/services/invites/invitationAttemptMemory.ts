import { type PriorInvitationProof } from '@localfirst/auth'

import { createLogger } from '../../../common/logger'

export { type PriorInvitationProof }

/** At most this many remembered attempts; the oldest is dropped past it. */
export const MAX_REMEMBERED_ATTEMPTS = 5
/** How long a remembered attempt stays usable. */
export const ATTEMPT_LIFETIME_MS = 15 * 60 * 1_000

type RememberedAttempt = PriorInvitationProof & { rememberedAt: number }

/**
 * Remembers the invitation proofs this device presented in join attempts that
 * did not end in a durable admission.
 *
 * An invitee validates an acceptance by requiring the admission link to carry
 * the proof from the current handshake. That is the property that stops a
 * malicious acceptor from wrapping an older, pre-removal graph in a fresh
 * envelope, so it cannot be relaxed globally (audit finding M-1). But it also
 * means a retry cannot complete: the admitter still holds the admission it made
 * on our first attempt, and that link carries the proof from that handshake, not
 * from this one. Remembering the exact proof we presented, and to whom, lets the
 * invitee accept that specific link without weakening the rule for anything
 * else.
 *
 * The memory is deliberately narrow. Entries are capped, they expire, they are
 * dropped the moment a join succeeds, and they are never written to disk: a
 * proof that outlived the process would be usable long after the transaction it
 * belonged to, which is the situation the rule exists to prevent.
 */
export class InvitationAttemptMemory {
  private readonly logger = createLogger('auth:invitationAttemptMemory')
  private attempts: RememberedAttempt[] = []

  constructor(
    private readonly maxAttempts: number = MAX_REMEMBERED_ATTEMPTS,
    private readonly lifetimeMs: number = ATTEMPT_LIFETIME_MS
  ) {}

  /**
   * Remembers one attempt, replacing any earlier entry for the same peer.
   *
   * @param attempt The proof presented and the peer it was presented to
   */
  public remember(attempt: PriorInvitationProof): void {
    this.prune()
    // One entry per peer: a repeat attempt against the same admitter supersedes
    // the proof we remembered for it, it does not accumulate alongside it.
    this.attempts = this.attempts.filter(existing => existing.presentedTo !== attempt.presentedTo)
    this.attempts.push({ ...attempt, rememberedAt: Date.now() })
    if (this.attempts.length > this.maxAttempts) {
      this.attempts = this.attempts.slice(this.attempts.length - this.maxAttempts)
    }
    this.logger.info(
      `Remembered the invitation proof presented to ${attempt.presentedTo}; holding ${this.attempts.length}`
    )
  }

  /** The attempts still inside their lifetime, oldest first. */
  public list(): PriorInvitationProof[] {
    this.prune()
    return this.attempts.map(({ proof, presentedTo }) => ({ proof, presentedTo }))
  }

  /** Forgets everything; call as soon as a join succeeds. */
  public clear(): void {
    if (this.attempts.length > 0) {
      this.logger.info(`Forgetting ${this.attempts.length} remembered invitation attempt(s)`)
    }
    this.attempts = []
  }

  /** How many attempts are currently remembered, after expiry. */
  public get size(): number {
    this.prune()
    return this.attempts.length
  }

  private prune(): void {
    const cutoff = Date.now() - this.lifetimeMs
    const before = this.attempts.length
    this.attempts = this.attempts.filter(attempt => attempt.rememberedAt > cutoff)
    if (this.attempts.length !== before) {
      this.logger.info(`Expired ${before - this.attempts.length} remembered invitation attempt(s)`)
    }
  }
}
