import type { Libp2pNodeParams } from '../libp2p/libp2p.types'
import { AdmissionResourceScope } from './admission-resource-scope'

/** Exclusive networking lease for one ConnectionsManager launch generation. */
export class AdmissionLifecycle {
  readonly resources = new AdmissionResourceScope()
  private revoked?: Error
  private readonly abort = new AbortController()
  get signal(): AbortSignal {
    return this.abort.signal
  }

  constructor(
    readonly communityId: string,
    readonly generation: number,
    readonly libp2pParams: Libp2pNodeParams,
    readonly qssEndpoint?: string
  ) {}

  assertCurrent(): void {
    if (this.revoked != null) throw this.revoked
  }
  revoke(reason: Error): void {
    this.revoked = reason
    this.abort.abort(reason)
  }
  run<T>(operation: () => Promise<T>): Promise<T> {
    this.assertCurrent()
    return this.resources.run(async () => {
      this.assertCurrent()
      return operation()
    })
  }
  drain(reason: Error): Promise<void> {
    this.revoke(reason)
    return this.resources.drain(reason)
  }
}
