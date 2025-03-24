import { castServer, type Server } from '../../../../../../../3rd-party/auth/packages/auth/dist'
import { createLogger } from '../../../common/logger'
import { SigChain } from '../../sigchain'
import { ChainServiceBase } from '../chainServiceBase'
import { RoleName } from '../roles/roles'

const logger = createLogger('auth:serverService')

export class ServerService extends ChainServiceBase {
  public static init(sigChain: SigChain): ServerService {
    return new ServerService(sigChain)
  }

  public addServer(server: Server): void {
    logger.info(`Adding server at ${server.host} to the chain`)
    if (this.sigChain.team == null) {
      throw new Error(`Team is nullish`)
    }

    this.sigChain.team.addServer(server)
    this.sigChain.team.addMemberRole(castServer.toMember(server), RoleName.MEMBER)
    logger.info(`Server added to the chain`)
  }
}
