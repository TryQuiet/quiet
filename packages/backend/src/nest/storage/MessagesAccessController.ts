import AccessController from 'orbit-db-access-controllers'
import { getCrypto } from 'pkijs'
import { stringToArrayBuffer } from 'pvutils'
import { keyObjectFromString, verifySignature } from '@quiet/identity'
import { ChannelMessage, NoCryptoEngineError } from '@quiet/types'
import OrbitDB from 'orbit-db'

const type = 'messagesaccess'

// @ts-ignore
export class MessagesAccessController extends AccessController {
    private readonly crypto = getCrypto()

    private readonly keyMapping: Map<string, CryptoKey> = new Map()

    static get type() {
        return type
    }

    async canAppend(entry: LogEntry<ChannelMessage>) {
        if (!this.crypto) throw new NoCryptoEngineError()

        const message: ChannelMessage = entry.payload.value

        const signature = stringToArrayBuffer(message.signature)

        let cryptoKey = this.keyMapping.get(message.pubKey)
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

    async load() {
        return ''
    }

    static create(_orbitdb: OrbitDB, _type = type, _options: any) {
        return new MessagesAccessController()
    }
}
