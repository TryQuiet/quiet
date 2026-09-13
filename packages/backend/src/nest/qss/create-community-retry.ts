/**
 * Exponential back-off for retrying the QSS community creation (the server
 * key request). A failed attempt blocks the next one for
 * `initialMs * 2 ** (attempts - 1)`, capped at `maxMs`; a success resets it.
 */
export class CreateCommunityRetry {
  private _attempts = 0
  private _nextAllowedAt = 0

  constructor(
    private readonly initialMs: number,
    private readonly maxMs: number,
    private readonly now: () => number = () => Date.now()
  ) {}

  get attempts(): number {
    return this._attempts
  }

  /** Whether an attempt may start now. */
  canAttempt(): boolean {
    return this.now() >= this._nextAllowedAt
  }

  /** Milliseconds until the next attempt may start (0 when allowed now). */
  msUntilAllowed(): number {
    return Math.max(0, this._nextAllowedAt - this.now())
  }

  /** Records a failed attempt and returns the delay before the next one. */
  recordFailure(): number {
    this._attempts += 1
    const delayMs = Math.min(this.initialMs * 2 ** (this._attempts - 1), this.maxMs)
    this._nextAllowedAt = this.now() + delayMs
    return delayMs
  }

  /** A success (or a fresh user action) clears the back-off. */
  reset(): void {
    this._attempts = 0
    this._nextAllowedAt = 0
  }
}
