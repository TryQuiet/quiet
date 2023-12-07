import { Inject, Injectable } from '@nestjs/common'
import { ORBIT_DB_DIR } from '../const'
import Logger from '../common/logger'
import PeerId from 'peer-id'
import AccessControllers from 'orbit-db-access-controllers'
import { MessagesAccessController } from './MessagesAccessController'
import { createChannelAccessController } from './ChannelsAccessController'
import OrbitDB from 'orbit-db'
import { IPFS } from 'ipfs-core'

@Injectable()
export class OrbitDb {
  private orbitDbInstance: OrbitDB | null = null

  private readonly logger = Logger(OrbitDb.name)
  constructor(@Inject(ORBIT_DB_DIR) public readonly orbitDbDir: string) {}

  get orbitDb() {
    if (!this.orbitDbInstance) {
      this.logger.error('[get orbitDb]:no orbitDbInstance')
      throw new Error()
    }
    return this.orbitDbInstance
  }

  public async create(peerId: PeerId, ipfs: IPFS) {
    this.logger('[create]:started')
    if (this.orbitDbInstance) return
    console.log('[create]', { peerId })

    const channelsAccessController = createChannelAccessController(peerId, this.orbitDbDir)
    AccessControllers.addAccessController({ AccessController: MessagesAccessController })
    AccessControllers.addAccessController({ AccessController: channelsAccessController })
    // @ts-ignore
    const orbitDb = await OrbitDB.createInstance(ipfs, {
      // @ts-ignore
      start: false,
      id: peerId.toString(),
      directory: this.orbitDbDir,
      // @ts-ignore
      AccessControllers,
    })

    this.orbitDbInstance = orbitDb
  }

  public clean() {
    this.orbitDbInstance = null
  }
}
