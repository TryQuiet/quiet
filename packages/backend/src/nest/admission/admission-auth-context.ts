import type { AdmissionResourceScope } from './admission-resource-scope'
import type { AdmissionLifecycle } from './admission-lifecycle'
import type { Team, UserWithSecrets } from '../../../../../3rd-party/auth/packages/auth/dist'
import type { SigChain } from '../auth/sigchain'
import {
  AdmissionCandidate,
  AdmissionError,
  AdmissionRequest,
  AdmissionResult,
  AdmissionTransport,
} from './admission.types'

/** Auth boundary gate. Incoming delivery and outgoing traffic are synchronous local operations. */
export class AdmissionAuthContext {
  private mode: 'open' | 'frozen' | 'published' | 'closed' = 'open'
  private readonly buffered: Array<() => void> = []
  private readonly tokens = new WeakMap<Team, symbol>()
  private lifecycle?: AdmissionLifecycle

  constructor(
    readonly sessionId: string,
    readonly attemptId: number,
    readonly request: AdmissionRequest,
    readonly transport: AdmissionTransport,
    readonly chain: SigChain,
    private readonly submit: (candidate: AdmissionCandidate) => Promise<AdmissionResult>,
    readonly fail: (error: unknown) => void,
    private readonly operations?: AdmissionResourceScope
  ) {}

  get frozen(): boolean {
    return this.mode === 'frozen'
  }
  get published(): boolean {
    return this.mode === 'published'
  }
  get closed(): boolean {
    return this.mode === 'closed' || this.lifecycle?.signal.aborted === true
  }
  assertCurrent(): void {
    if (this.closed) throw new AdmissionError('cancelled', 'Admission attempt is closed')
  }

  deliver(operation: () => void): void {
    if (this.closed) return
    if (this.mode === 'frozen') {
      this.buffered.push(operation)
    } else operation()
  }

  run<T>(operation: () => Promise<T>): Promise<T> {
    this.assertCurrent()
    if (this.lifecycle != null) return this.lifecycle.run(operation)
    return !this.published && this.operations != null ? this.operations.run(operation) : operation()
  }

  adopt(lifecycle: AdmissionLifecycle): void {
    this.lifecycle = lifecycle
  }

  joined(payload: { team: Team; user: UserWithSecrets }): Promise<AdmissionResult> {
    this.assertCurrent()
    let token = this.tokens.get(payload.team)
    if (token == null) {
      token = Symbol('candidate')
      this.tokens.set(payload.team, token)
    }
    return this.submit({
      token,
      chain: this.chain,
      team: payload.team,
      user: payload.user,
      teamId: payload.team.id,
      userId: payload.user.userId,
      deviceId: this.chain.device.deviceId,
      kind: this.request.kind,
      transport: this.transport,
    })
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
