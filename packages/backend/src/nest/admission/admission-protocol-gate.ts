import type { AdmissionOperationOwner } from './admission-auth-context.types'
import { AdmissionError } from './admission.types'

/** Buffers protocol delivery while a selected candidate is being committed. */
export class AdmissionProtocolGate {
  private mode: 'open' | 'frozen' | 'published' | 'closed' = 'open'
  private _adopted = false
  private readonly buffered: Array<() => void> = []

  constructor(private owner: AdmissionOperationOwner) {}

  get frozen(): boolean {
    return this.mode === 'frozen'
  }
  get published(): boolean {
    return this.mode === 'published'
  }
  /** Ownership handoff can complete even when a paused lifecycle cannot resume delivery. */
  get adopted(): boolean {
    return this._adopted
  }
  get closed(): boolean {
    return this.mode === 'closed' || this.owner.signal.aborted
  }
  assertCurrent(): void {
    if (this.closed) throw new AdmissionError('cancelled', 'Admission attempt is closed')
  }
  deliver(operation: () => void): void {
    if (this.closed) return
    if (this.frozen) this.buffered.push(operation)
    else operation()
  }
  run<T>(operation: () => Promise<T>): Promise<T> {
    this.assertCurrent()
    return this.owner.run(operation)
  }
  adopt(owner: AdmissionOperationOwner): void {
    this.owner = owner
    this._adopted = true
  }
  freeze(): void {
    this.assertCurrent()
    this.mode = 'frozen'
  }
  revoke(): void {
    this.mode = 'closed'
    this.buffered.length = 0
  }
  resume(): void {
    if (this.closed) return
    this.mode = 'published'
    while (this.buffered.length > 0 && !this.closed) this.buffered.shift()!()
  }
}
