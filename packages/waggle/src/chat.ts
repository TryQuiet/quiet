
import Libp2p from 'libp2p'
import uint8arrayFromString from 'uint8arrays/from-string'
import uint8arrayToString from 'uint8arrays/to-string'
import { Request } from './config/protonsRequestMessages'

export class Chat {
  /**
   * @param {Libp2p} libp2p A Libp2p node to communicate through
   * @param {string} topic The topic to subscribe to
   * @param {function(Message)} messageHandler Called with every `Message` received on `topic`
   */
  libp2p: Libp2p
  topic: string
  messageHandler: (obj: any) => void
  constructor(libp2p, topic, messageHandler) {
    this.libp2p = libp2p
    this.topic = topic
    this.messageHandler = messageHandler

    this._onMessage = this._onMessage.bind(this)

    // Join if libp2p is already on
    if (this.libp2p.isStarted()) this.join()
  }

  /**
   * Handler that is run when `this.libp2p` starts
   */
  onStart () {
    this.join()
  }

  /**
   * Handler that is run when `this.libp2p` stops
   */
  onStop () {
    this.leave()
  }

  /**
   * Subscribes to `Chat.topic`. All messages will be
   * forwarded to `messageHandler`
   * @private
   */
  join () {
    this.libp2p.pubsub.on(this.topic, this._onMessage)
    this.libp2p.pubsub.subscribe(this.topic)
  }

  /**
   * Unsubscribes from `Chat.topic`
   * @private
   */
  leave () {
    this.libp2p.pubsub.removeListener(this.topic, this._onMessage)
    this.libp2p.pubsub.unsubscribe(this.topic)
  }

  _onMessage (message) {
    try {
      const request = Request.decode(message.data)
      switch (request.type) {
        case Request.Type.SEND_MESSAGE:
          this.messageHandler({
            from: message.from,
            message: {
              data: uint8arrayToString(request.sendMessage.data),
              created: request.sendMessage.created,
              id: uint8arrayToString(request.sendMessage.id)
            }
          })
          break
        default:
          // Do nothing
      }
    } catch (err) {
      console.error(err)
    }
  }


  /**
   * Publishes the given `message` to pubsub peers
   * @throws
   * @param {Buffer|string} message The chat message to send
   */
  public async send (message) {
    const msg = Request.encode({
      type: Request.Type.SEND_MESSAGE,
      sendMessage: {
        id: uint8arrayFromString((~~(Math.random() * 1e9)).toString(36) + Date.now()),
        data: uint8arrayFromString(message),
        created: Date.now()
      }
    })

    await this.libp2p.pubsub.publish(this.topic, msg)
  }
}



