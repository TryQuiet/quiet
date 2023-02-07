import type { Libp2p } from 'libp2p'
import OrbitDB from 'orbit-db'
import PeerId from 'peer-id'
import { StorageOptions } from '../../common/types'
import logger from '../../logger'
import { Storage } from '..'

const log = logger('dbSnap')

import { createPaths } from '../../common/utils'

class StorageTestSnapshotOptions extends StorageOptions {
  messagesCount: number
  createSnapshot?: boolean = false
  useSnapshot?: boolean = false
}

export class StorageBasic extends Storage {
  public name: string
  public declare options: StorageTestSnapshotOptions

  constructor(
    quietDir: string,
    communityId: string,
    options?: Partial<StorageTestSnapshotOptions>
  ) {
    super(quietDir, communityId, options)
    this.options = {
      ...new StorageTestSnapshotOptions(),
      ...options
    }
    this.name = (Math.random() + 1).toString(36).substring(7)
  }

  public async init(libp2p: Libp2p, peerID: PeerId): Promise<void> {
    log(`${this.name}; StorageTest: Entered init`)
    if (this.options?.createPaths) {
      createPaths([this.ipfsRepoPath, this.orbitDbDir])
    }
    this.ipfs = await this.initIPFS(libp2p, peerID)

    this.orbitdb = await OrbitDB.createInstance(this.ipfs, { directory: this.orbitDbDir })

    log(`Initialized '${this.name}'`)
  }

  public setName(name) {
    this.name = name
  }
}
