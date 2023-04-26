import AccessController from 'orbit-db-access-controllers'
import { getCrypto } from 'pkijs'
import { stringToArrayBuffer } from 'pvutils'
import { ChannelMessage, channelMessagesAdapter } from '@quiet/state-manager'
import { keyObjectFromString, verifySignature } from '@quiet/identity'

const type = 'channelsaccess'


export const createChannelAccessController = (peerId) => {
  // @ts-ignore
  class ChannelsAccessController extends AccessController {
    static get type() {
      return type
    }

    async canAppend(entry, identityProvider) {
      // Channel deletion WIP

      // console.log('peerId ', peerId.toString())
      // console.log('entry ', entry)

      // const identityProvider2 = new OrbitDBIdentityProvider(identityProvider._keystore)
      // console.log(identityProvider2)
      // console.log(identityProvider2.getId({id:
      //   'QmeiTFqysrzRqi2gy94b7BRpouCHuwTDxf65tRtNxbtZhQ'}))

      //   // console.log('before sleep')

      //   // await sleep(50000)

      //   // console.log('after sleep')
      // const orbit = await identityProvider2.getId({id:
      //   'QmeiTFqysrzRqi2gy94b7BRpouCHuwTDxf65tRtNxbtZhQ'})

      //   console.log('access controller keystore ', identityProvider._keystore)

      //  const orbit1 = await identityProvider._keystore.createKey(peerId.toString())
      //  const orbit2 = await identityProvider._keystore.createKey(peerId.toString())

      //  console.log('orbitDB string')
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

    static create(_orbitdb, _options) {
      return new ChannelsAccessController()
    }
  }
  return ChannelsAccessController
}