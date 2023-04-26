import AccessController from 'orbit-db-access-controllers'
import { getCrypto } from 'pkijs'
import { stringToArrayBuffer } from 'pvutils'
import { ChannelMessage } from '@quiet/state-manager'
import { keyObjectFromString, verifySignature } from '@quiet/identity'

const type = 'messagesaccess'

// @ts-ignore
export class MessagesAccessController extends AccessController {
  private readonly crypto = getCrypto()

  private readonly keyMapping: Map<string, CryptoKey> = new Map()

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
    return verify
  }

  async save() {
    return ''
  }

  async load(){
    return ''
  }

  static create(_orbitdb, _type = type, _options) {
    return new MessagesAccessController()
  }
}
