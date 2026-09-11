import type { SigChain } from './sigchain'
import type { AdmissionRequest } from '../admission/admission.types'
export interface AdmissionTransactionOperations {
  persist(chain: SigChain): Promise<void>
  publish(chain: SigChain): void
  discard(): void
  grantMember(chain: SigChain, request: AdmissionRequest): Promise<void>
}
