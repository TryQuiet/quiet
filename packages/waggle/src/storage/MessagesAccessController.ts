import AccessController from 'orbit-db-access-controllers/src/access-controller-interface'
import { getCrypto } from 'pkijs'
import { stringToArrayBuffer } from 'pvutils'
import { ChannelMessage } from '@zbayapp/nectar'
import { keyObjectFromString, verifySignature } from '@zbayapp/identity'
import IOProxy from '../socket/IOProxy'

const type = 'messagesaccess'

export class MessagesAccessController extends AccessController {
  private readonly crypto = getCrypto()

  private readonly io: IOProxy
  private readonly communityId: string
  
  // Cache
  private readonly keyMapping: Map<string, CryptoKey> = new Map()

  constructor(io: IOProxy, communityId: string) {
    super()
    this.io = io
    this.communityId = communityId
  }

  static get type() {
    return type
  }

  async canAppend(entry) {
    const message: ChannelMessage = entry.payload.value

    const signature = stringToArrayBuffer(message.signature)

    let cryptoKey = this.keyMapping[message.pubKey]
    if (!cryptoKey) {
      cryptoKey = await keyObjectFromString(message.pubKey, this.crypto)
      this.keyMapping.set(message.pubKey, cryptoKey)
    }

    const verify = await verifySignature(signature, message.message, cryptoKey)

    // Emit verified messages to nectar
    if (verify) {
      this.io.loadMessages({
        messages: [message],
        communityId: this.communityId
      })
    }

    return verify
  }

  async save() {
    return ''
  }

  static async create(_orbitdb, options) {
    return new MessagesAccessController(
      options.io,
      options.communityId
    )
  }
}
