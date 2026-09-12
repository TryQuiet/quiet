/** Tracks operations before they start and retains ownership until cleanup has finished. */
export class AdmissionResourceScope {
  private readonly abort = new AbortController()
  private readonly pending = new Set<Promise<unknown>>()
  private readonly cleanups = new Set<() => void | Promise<void>>()
  private draining?: Promise<void>

  get signal(): AbortSignal {
    return this.abort.signal
  }

  assertCurrent(): void {
    if (this.signal.aborted) throw this.signal.reason
  }

  revoke(reason: Error): void {
    this.abort.abort(reason)
  }

  /** Register before allocating. Cleanup also runs after a late allocation completes. */
  own(cleanup: () => void | Promise<void>): void {
    this.assertCurrent()
    this.cleanups.add(cleanup)
  }

  run<T>(operation: () => Promise<T>): Promise<T> {
    this.assertCurrent()
    const pending = Promise.resolve().then(() => {
      this.assertCurrent()
      return operation()
    })
    this.pending.add(pending)
    void pending.then(
      () => this.pending.delete(pending),
      () => this.pending.delete(pending)
    )
    return pending
  }

  async idle(): Promise<void> {
    while (this.pending.size > 0) await Promise.allSettled([...this.pending])
  }

  /** Transfers cleanup responsibility synchronously; caller must first await idle(). */
  transferTo(owner: AdmissionResourceScope): void {
    this.assertCurrent()
    if (this.pending.size !== 0) throw new Error('Cannot transfer a scope with pending operations')
    for (const cleanup of this.cleanups) owner.own(cleanup)
    this.cleanups.clear()
  }

  drain(reason: Error): Promise<void> {
    this.revoke(reason)
    if (this.draining == null) {
      this.draining = (async () => {
        await this.idle()
        const results = await Promise.allSettled([...this.cleanups].reverse().map(async cleanup => cleanup()))
        const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
        if (failure != null) throw failure.reason
        this.cleanups.clear()
      })()
      void this.draining.catch(() => undefined)
    }
    return this.draining
  }
}
