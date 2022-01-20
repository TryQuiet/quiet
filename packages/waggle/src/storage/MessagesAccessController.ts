import { stringToArrayBuffer } from 'pvutils'
import { verifySignature } from '@zbayapp/identity'
import { ChannelMessage } from '@zbayapp/nectar'
import AccessController from 'orbit-db-access-controllers/src/access-controller-interface'

const type = 'messagesaccess'

export class MessagesAccessController extends AccessController {

  static get type () { return type }

  async canAppend(entry) {
    const message: ChannelMessage = entry.payload.value
    const signature = await stringToArrayBuffer(message.signature)
    if (verifySignature(signature, message.message, null, message.pubKey)) return true

    return false
  }

  async save () {
    // Return the manifest data
    return ''
  }

  static async create(_orbitdb, _options) {
    return new MessagesAccessController()
  }
}
