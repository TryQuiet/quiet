import type { SigChainService } from '../../auth/sigchain.service'

export interface UserProfileAccessControllerConfig {
  write: string[]
  sigchainService: SigChainService
}

export interface UserProfileWriterIdentity {
  id: string
  teamId?: string
}
