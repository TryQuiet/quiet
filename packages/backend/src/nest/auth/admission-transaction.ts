import { SigChain } from './sigchain'
import { RoleName } from './services/roles/roles'
import { AdmissionCandidate, AdmissionError, AdmissionKind, AdmissionRequest } from '../admission/admission.types'
import type { AdmissionTransactionOperations } from './admission-transaction.types'

/** Sole owner of local completion, validation, durable snapshot, and active-chain publication. */
export class AdmissionTransaction {
  private selected?: symbol
  private readonly attempts = new Set<SigChain>()
  constructor(
    private readonly request: AdmissionRequest,
    private readonly base: SigChain,
    private readonly operations: AdmissionTransactionOperations
  ) {}

  stage(): SigChain {
    const chain = this.base.forkForAdmission()
    this.attempts.add(chain)
    return chain
  }

  async commit(candidate: AdmissionCandidate): Promise<void> {
    if (this.selected != null) throw new AdmissionError('validation', 'Admission transaction already selected')
    this.selected = candidate.token
    const request = this.request
    const chain = candidate.chain
    if (
      !this.attempts.has(chain) ||
      candidate.teamId !== request.teamId ||
      candidate.userId !== request.expectedUserId ||
      candidate.deviceId !== request.expectedDeviceId ||
      candidate.kind !== request.kind
    ) {
      throw new AdmissionError('validation', 'Admission candidate does not match the pinned identity')
    }
    try {
      chain.completeInvitation(candidate.team, candidate.user)
      if (request.kind === AdmissionKind.MEMBER) await this.operations.grantMember(chain, request)
      if (
        chain.team?.id !== request.teamId ||
        chain.user.userId !== request.expectedUserId ||
        chain.device.deviceId !== request.expectedDeviceId ||
        !chain.team.hasDevice(request.expectedDeviceId) ||
        !chain.roles.amIMemberOfRole(RoleName.MEMBER)
      ) {
        throw new Error('Admitted chain does not contain the expected team, user, device and member role')
      }
    } catch (error) {
      throw new AdmissionError('validation', error instanceof Error ? error.message : String(error), error)
    }
    await this.operations.persist(chain)
    this.operations.publish(chain)
  }

  discard(): void {
    this.operations.discard()
  }
}
