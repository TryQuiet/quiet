import { SigChain } from '../sigchain'
import { createLogger } from '../../common/logger'
import { EventEmitter } from 'events'

const logger = createLogger('auth:baseChainService')

class ChainServiceBase extends EventEmitter {
  constructor(protected sigChain: SigChain) {
    super()
  }
}

export { ChainServiceBase }
