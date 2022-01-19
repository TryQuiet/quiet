import { stringToArrayBuffer } from 'pvutils'
import { verifySignature } from '@zbayapp/identity'
import { ChannelMessage } from '@zbayapp/nectar'
import AccessController from 'orbit-db-access-controllers/src/access-controller-interface'

export class MessagesAccessController extends AccessController {
  static get type() {
    return 'messagesaccess'
  }

  async canAppend(entry) {
    const message: ChannelMessage = entry.payload.value
    const signature = await stringToArrayBuffer(message.signature)
    if (verifySignature(signature, message.message, null, message.pubKey)) return true

    return false
  }

  static async create(_orbitdb, _options) {
    return new MessagesAccessController()
  }

  async save() {
    // return the manifest data
    return { address: undefined, skipManifest: true }
  }
}
