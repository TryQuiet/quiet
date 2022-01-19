import { stringToArrayBuffer } from 'pvutils'
import { verifySignature } from '@zbayapp/identity'
import { ChannelMessage } from '@zbayapp/nectar'
import AccessController from 'orbit-db-access-controllers/src/access-controller-interface'

const type = 'messagesaccess'

export class MessagesAccessController extends AccessController {
  _orbitdb
  _db
  _options

  constructor (orbitdb, options) {
    super()
    this._orbitdb = orbitdb
    this._db = null
    this._options = options || {}
  }

  // Returns the type of the access controller
  static get type () { return type }

  // Returns the address of the OrbitDB used as the AC
  get address () {
    return this._db.address
  }

  async canAppend(entry) {
    const message: ChannelMessage = entry.payload.value
    const signature = await stringToArrayBuffer(message.signature)
    if (verifySignature(signature, message.message, null, message.pubKey)) return true

    return false
  }

  async load (address) {
    if (this._db) { await this._db.close() }

    // Force '<address>/_access' naming for the database
    this._db = await this._orbitdb.log(address)

    // this._db.events.on('ready', this._onUpdate.bind(this))
    // this._db.events.on('write', this._onUpdate.bind(this))
    // this._db.events.on('replicated', this._onUpdate.bind(this))

    await this._db.load()
  }

  async close () {
    await this._db.close()
  }

  async save () {
    // return the manifest data
    return {
      address: this._db.address.toString()
    }
  }

  static async create(orbitdb, options) {
    console.log('options', options)
    const ac = new MessagesAccessController(orbitdb, options)
    await ac.load(options.address || options.name || 'default-access-controller')
    return ac
  }
}
