import type { Libp2pNodeParams } from '../libp2p/libp2p.types'
import type { AdmissionProtocolGate } from './admission-protocol-gate'
import { AdmissionResourceScope } from './admission-resource-scope'
import type { AdmissionHandle } from './admission.types'

/** Owns acquisition and the networking resources retained by one community launch. */
export class CommunityLifecycle {
  private readonly resources = new AdmissionResourceScope()
  private readonly abort = new AbortController()
  private admission?: AdmissionHandle

  constructor(
    readonly communityId: string,
    readonly libp2pParams: Libp2pNodeParams,
    readonly qssEndpoint?: string
  ) {}

  get signal(): AbortSignal {
    return this.abort.signal
  }
  assertCurrent(): void {
    this.signal.throwIfAborted()
  }
  ownAdmission(handle: AdmissionHandle): void {
    this.assertCurrent()
    this.admission = handle
  }
  revoke(reason: Error): void {
    this.abort.abort(reason)
  }
  run<T>(operation: () => Promise<T>): Promise<T> {
    this.assertCurrent()
    return this.resources.run(async () => {
      this.assertCurrent()
      return operation()
    })
  }
  idle(): Promise<void> {
    return this.resources.idle()
  }
  /** Commit may finish after revocation; retain its resources for the waiting shutdown. */
  adopt(scope: AdmissionResourceScope, gate: AdmissionProtocolGate): void {
    scope.transferTo(this.resources)
    gate.adopt(this)
  }
  async pause(reason: Error): Promise<void> {
    this.revoke(reason)
    await this.admission?.cancel(reason)
    await this.idle()
  }
  async drain(reason: Error): Promise<void> {
    await this.pause(reason)
    await this.resources.drain(reason)
  }
}
