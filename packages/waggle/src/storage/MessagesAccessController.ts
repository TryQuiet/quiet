import AccessController from 'orbit-db-access-controllers/src/access-controller-interface'
import { stringToArrayBuffer } from 'pvutils'
import { ChannelMessage } from '@zbayapp/nectar'
import { verifySignature } from '@zbayapp/identity'

const type = 'messagesaccess'

export class MessagesAccessController extends AccessController {
  static get type () { return type }

  async canAppend(entry) {
    const message: ChannelMessage = entry.payload.value
    const signature = stringToArrayBuffer(message.signature)
    const verify = await verifySignature(signature, message.message, null, message.pubKey)
    return verify
  }

  async save () {
    // Return the manifest data
    return ''
  }

  static async create(_orbitdb, _options) {
    return new MessagesAccessController()
  }
}
