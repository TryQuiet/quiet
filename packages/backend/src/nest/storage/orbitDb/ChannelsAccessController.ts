import AccessController from 'orbit-db-access-controllers'
import { PublicChannel } from '@quiet/types'
import OrbitDB from 'orbit-db'
import PeerId from 'peer-id'
import { createLogger } from '../../common/logger'

const logger = createLogger('channelsAccessController')

const Keystore = await import('orbit-db-keystore')

const type = 'channelsaccess'

export const createChannelAccessController = (peerId: PeerId, dir: string) => {
  // @ts-ignore
  class ChannelsAccessController extends AccessController {
    static get type() {
      return type
    }

    async canAppend(entry: LogEntry<PublicChannel>, identityProvider: any) {
      // logger.info('can append entry ', entry)

      // const keystore = identityProvider._keystore

      // const stringPeerId = 'QmTBYqK1qTXW9E6os3vc9phR9JWRs1jUTutgpLEGJVtubY'

      // logger.info('identityProvider', identityProvider)
      // identityProvider.getId(peerId.toString())

      // const identity = await Identities.createIdentity({
      //   id: stringPeerId,
      //   keystore
      // })

      // logger.info('identity ', identity)

      // logger.info('access controller id ', identity)

      // logger.info('peerId ', peerId.toString())
      // logger.info('entry ', entry)

      // const identityProvider2 = new OrbitDBIdentityProvider(identityProvider._keystore)
      // logger.info(identityProvider2)
      // logger.info(identityProvider2.getId({id:
      //   'QmeiTFqysrzRqi2gy94b7BRpouCHuwTDxf65tRtNxbtZhQ'}))

      //   // logger.info('before sleep')

      //   // await sleep(50000)

      //   // logger.info('after sleep')
      // const orbit = await identityProvider2.getId({id:
      //   'QmeiTFqysrzRqi2gy94b7BRpouCHuwTDxf65tRtNxbtZhQ'})

      //   logger.info('access controller keystore ', identityProvider._keystore)

      //  const orbit1 = await identityProvider._keystore.createKey(peerId.toString())
      //  const orbit2 = await identityProvider._keystore.createKey(peerId.toString())

      //  logger.info('orbitDB string')
      //  const uKey = Buffer.from(orbit1.public.marshal()).toString('hex')
      //  const uKey2 = Buffer.from(orbit2.public.marshal()).toString('hex')

      return true
    }

    async save() {
      // Return the manifest data
      return ''
    }

    async load() {
      return ''
    }

    static create(_orbitdb: OrbitDB, _type = type, _options: any) {
      return new ChannelsAccessController()
    }
  }
  return ChannelsAccessController
}
