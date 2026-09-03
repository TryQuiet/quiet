import { createLogger } from './logger'

export type BoundedRetryOptions = {
  /** How many retries a single key may consume before the budget is spent. */
  maxAttempts?: number
  /** Delay before the first retry; doubles each attempt. */
  baseDelayMs?: number
  /** Ceiling for the doubling. */
  maxDelayMs?: number
}

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_BASE_DELAY_MS = 1_000
const DEFAULT_MAX_DELAY_MS = 15_000

/**
 * Schedules a bounded, exponentially backed-off retry per key.
 *
 * Used where a local write failure has to leave a retryable state rather than a
 * terminal one, but must not turn into an unbounded retry loop: each key gets a
 * fixed attempt budget, and the caller is told when that budget is spent so it
 * can surface an actionable failure instead of silently stalling.
 *
 * Timers are tracked so a service being torn down can cancel work that would
 * otherwise fire against a stopped component.
 */
export class BoundedRetry {
  private readonly logger = createLogger('common:boundedRetry')
  private readonly attempts: Map<string, number> = new Map()
  private readonly timers: Map<string, NodeJS.Timeout> = new Map()
  private readonly maxAttempts: number
  private readonly baseDelayMs: number
  private readonly maxDelayMs: number

  constructor(
    private readonly name: string,
    options: BoundedRetryOptions = {}
  ) {
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS
    this.maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS
  }

  /**
   * Queues one more attempt for this key.
   *
   * A rejecting attempt re-arms the next one itself, until the budget runs out.
   * Without that, a transport that happens to be unavailable at the moment the
   * timer fires would consume an attempt and then wait forever for some
   * unrelated event to call back in, which is not the bounded retry the caller
   * was promised.
   *
   * @param key Identifies the thing being retried, e.g. a peer or a team
   * @param run The work to re-run; rejections are logged, not rethrown
   * @returns false when the attempt budget for this key is already spent
   */
  public schedule(key: string, run: () => Promise<void>): boolean {
    const priorAttempts = this.attempts.get(key) ?? 0
    if (priorAttempts >= this.maxAttempts) {
      return false
    }
    const attempt = priorAttempts + 1
    this.attempts.set(key, attempt)

    const existing = this.timers.get(key)
    if (existing != null) {
      clearTimeout(existing)
    }

    const delay = Math.min(this.baseDelayMs * 2 ** priorAttempts, this.maxDelayMs)
    this.logger.info(`${this.name}: scheduling retry ${attempt}/${this.maxAttempts} for ${key} in ${delay}ms`)
    const timer = setTimeout(() => {
      this.timers.delete(key)
      void run().catch(err => {
        this.logger.error(`${this.name}: retry ${attempt} for ${key} failed`, err)
        if (!this.schedule(key, run)) {
          this.logger.error(`${this.name}: no attempts left for ${key} after a failed retry`)
        }
      })
    }, delay)
    // A pending retry must never hold the process open on its own.
    timer.unref?.()
    this.timers.set(key, timer)
    return true
  }

  /** Forgets a key's budget and cancels any retry still pending for it. */
  public clear(key: string): void {
    const timer = this.timers.get(key)
    if (timer != null) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
    this.attempts.delete(key)
  }

  /**
   * Cancels pending retries but keeps every key's attempt budget.
   *
   * For callers that tear down and rebuild the thing being retried as part of
   * the retry itself: resetting the budget there would make the bound
   * unreachable and the retry loop infinite.
   */
  public cancelPending(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
  }

  /** Cancels everything and forgets every budget; for service teardown. */
  public clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
    this.attempts.clear()
  }

  /** Retries already consumed for this key. */
  public attemptsFor(key: string): number {
    return this.attempts.get(key) ?? 0
  }
}
