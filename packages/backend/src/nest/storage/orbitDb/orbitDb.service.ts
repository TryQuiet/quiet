import { Inject, Injectable } from '@nestjs/common'
import { ORBIT_DB_DIR } from '../../const'
import { createLogger } from '../../common/logger'
import { type PeerId } from '@libp2p/interface'
import { MessagesAccessController } from './MessagesAccessController'
import { createOrbitDB, type OrbitDBType, type IdentitiesType, useAccessController } from '@orbitdb/core'
import { type Helia } from "helia";

@Injectable()
export class OrbitDb {
  private orbitDbInstance: OrbitDBType | null = null
  // FIXME: Initialize this
  public identities: IdentitiesType

  private readonly logger = createLogger(OrbitDb.name)

  constructor(@Inject(ORBIT_DB_DIR) public readonly orbitDbDir: string) {}

  get orbitDb() {
    if (!this.orbitDbInstance) {
      this.logger.error('[get orbitDb]:no orbitDbInstance')
      throw new Error('[get orbitDb]:no orbitDbInstance')
    }
    return this.orbitDbInstance
  }

  public async create(peerId: PeerId, ipfs: Helia) {
    this.logger.info('Creating OrbitDB')
    if (this.orbitDbInstance) return

    useAccessController(MessagesAccessController)

    const orbitDb = await createOrbitDB({
      ipfs,
      id: peerId.toString(),
      directory: this.orbitDbDir,
    })

    this.orbitDbInstance = orbitDb
  }

  public async stop() {
    if (this.orbitDbInstance) {
      this.logger.info('Stopping OrbitDB')
      try {
        await this.orbitDbInstance.stop()
      } catch (err) {
        this.logger.error(`Following error occured during closing orbitdb database`, err)
      }
    }

    this.orbitDbInstance = null
  }
}
