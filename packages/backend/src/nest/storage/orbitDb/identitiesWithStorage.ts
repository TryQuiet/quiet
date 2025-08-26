import { ComposedStorage, Identities, IdentitiesType, LRUStorage, MemoryStorage } from '@orbitdb/core'
import { HeliaLibp2p } from 'helia'
import { KeystoreWithStorage } from './keystoreWithStorage'
import { OrbitDbService } from './orbitDb.service'
import { posixJoin } from './util'
import IPFSBlockStorage from './ipfsBlockStorage'

export const IdentitiesWithStorage = async (orbitDbDir: string, ipfs: HeliaLibp2p): Promise<IdentitiesType> => {
  const keystore = await KeystoreWithStorage({ path: posixJoin(orbitDbDir, './keystore') })
  const storage = await ComposedStorage(
    await LRUStorage({ size: 1000 }),
    await IPFSBlockStorage({ ipfs, pin: false }),
    OrbitDbService.events
  )

  return Identities({
    keystore,
    storage,
    ipfs,
  })
}
