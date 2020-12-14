
import Libp2p from 'libp2p'
import uint8arrayFromString from 'uint8arrays/from-string'
import uint8arrayToString from 'uint8arrays/to-string'
import { Request } from './config/protonsRequestMessages'
export interface IMessage {
  data: Buffer,
  created: Date,
  parentId: string,
  channelId: string,
  currentHEAD: string
}
export interface IMessageCommit {
  created: Date,
  currentHEAD: string,
  channelId: string
}
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
              data: request.sendMessage.data,
              created: request.sendMessage.created,
              id: uint8arrayToString(request.sendMessage.id),
              parentId: uint8arrayToString(request.sendMessage.parentId),
              channelId: uint8arrayToString(request.sendMessage.channelId),
              currentHEAD: uint8arrayToString(request.sendMessage.currentHEAD),
              raw: message.data,
              type: Request.Type.SEND_MESSAGE
            }
          })
          break
        case Request.Type.MERGE_COMMIT_INFO:
          this.messageHandler({
            from: message.from,
            message: {
              created: request.mergeCommitInfo.created,
              id: uint8arrayToString(request.mergeCommitInfo.id),
              currentHEAD: uint8arrayToString(request.mergeCommitInfo.currentHEAD),
              channelId: uint8arrayToString(request.mergeCommitInfo.channelId),
              raw: message.data,
              type: Request.Type.MERGE_COMMIT_INFO
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
   */
  public async send (message: IMessage) {
    const msg = Request.encode({
      type: Request.Type.SEND_MESSAGE,
      sendMessage: {
        data: message.data,
        created: message.created,
        id: uint8arrayFromString((~~(Math.random() * 1e9)).toString(36) + Date.now()),
        parentId: uint8arrayFromString(message.parentId),
        channelId: uint8arrayFromString(message.channelId),
        currentHEAD: uint8arrayFromString(message.currentHEAD)
      }
    })

    await this.libp2p.pubsub.publish(this.topic, msg)
  }

  public async sendNewMergeCommit (message: IMessageCommit) {
    const msg = Request.encode({
      type: Request.Type.MERGE_COMMIT_INFO,
      mergeCommitInfo: {
        created: message.created,
        id: uint8arrayFromString((~~(Math.random() * 1e9)).toString(36) + Date.now()),
        currentHEAD: uint8arrayFromString(message.currentHEAD),
        channelId: uint8arrayFromString(message.channelId),
      }
    })

    await this.libp2p.pubsub.publish(this.topic, msg)
  }
}



