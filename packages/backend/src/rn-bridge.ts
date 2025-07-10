import { createLogger } from './nest/common/logger'
import { EventEmitter } from 'events'

const logger = createLogger('rnBridge')

// Augment global Process type for _linkedBinding
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      _linkedBinding?: (name: string) => any
    }
  }
}

interface NativeBridgeType {
  sendMessage: (channel: string, message: string) => void
  registerChannel: (channel: string, listener: (channelName: string, data: string) => void) => void
  getDataDir?: () => string
}

interface MessageEnvelope {
  event: string
  payload: string | Record<string, string>
}

class MessageCodec {
  event: string
  payload: string
  constructor(_event: string, ..._payload: string[]) {
    this.event = _event
    this.payload = JSON.stringify(_payload)
  }
  static serialize(event: string, ...payload: string[]): string {
    const envelope = new MessageCodec(event, ...payload)
    return JSON.stringify(envelope)
  }
  static parsePayload(message: string): Record<string, string> {
    logger.warn('rn-bridge payload', message)
    const parsed: Record<string, string> = {}
    const entries = message.split('|')
    if (entries.length < 1) {
      logger.warn('Malformed or non-existent rn-bridge payload ', entries)
      return parsed
    }
    entries.forEach(s => {
      const split = s.split(':')
      if (split.length !== 2) {
        logger.warn('Malformed rn-bridge entry: ', split)
        return
      }
      parsed[split[0]] = split[1]
    })
    logger.info('parsed', JSON.stringify(parsed))
    return parsed
  }
  static deserialize(message: string): MessageEnvelope {
    const envelope = JSON.parse(message) as MessageEnvelope
    if (typeof envelope !== 'object' || !Object.prototype.hasOwnProperty.call(envelope, 'event')) {
      logger.error('Malformed message envelope: ', envelope)
      throw new Error('Malformed message envelope')
    }
    if (typeof envelope.payload === 'string') {
      envelope.payload = this.parsePayload(envelope.payload)
    }
    return envelope
  }
}

abstract class ChannelSuper extends EventEmitter {
  name: string
  emitLocal: (event: string, ...args: any[]) => boolean
  constructor(name: string) {
    super()
    this.name = name
    this.emitLocal = this.emit.bind(this)
    // @ts-expect-error: Remove emit from instance
    delete this.emit
  }
  abstract processData(data: string): void
}

class EventChannel extends ChannelSuper {
  post(event: string, ...msg: string[]): void {
    NativeBridge.sendMessage(this.name, MessageCodec.serialize(event, ...msg))
  }
  send(...msg: string[]): void {
    this.post('message', ...msg)
  }
  processData(data: string): void {
    const envelope = MessageCodec.deserialize(data)
    setImmediate(() => {
      this.emitLocal(envelope.event, envelope.payload)
    })
  }
}

class SystemEventLock {
  private _locksAcquired: number
  private _callback: () => void
  private _hasReleased: boolean
  constructor(callback: () => void, startingLocks: number) {
    this._locksAcquired = startingLocks
    this._callback = callback
    this._hasReleased = false
    this._checkRelease()
  }
  release(): void {
    if (this._hasReleased) return
    this._locksAcquired--
    this._checkRelease()
  }
  private _checkRelease(): void {
    if (this._locksAcquired <= 0) {
      this._hasReleased = true
      this._callback()
    }
  }
}

class SystemChannel extends ChannelSuper {
  _cacheDataDir: string | null
  constructor(name: string) {
    super(name)
    this._cacheDataDir = null
  }
  emitWrapper(type: string): void {
    if (type.startsWith('pause')) {
      setImmediate(() => {
        let releaseMessage = 'release-pause-event'
        const eventArguments = type.split('|')
        if (eventArguments.length >= 2) {
          releaseMessage = releaseMessage + '|' + eventArguments[1]
        }
        const eventLock = new SystemEventLock(() => {
          NativeBridge.sendMessage(this.name, releaseMessage)
        }, this.listenerCount('pause'))
        this.emitLocal('pause', eventLock)
      })
    } else {
      setImmediate(() => {
        this.emitLocal(type)
      })
    }
  }
  processData(data: string): void {
    this.emitWrapper(data)
  }
  datadir(): string {
    if (this._cacheDataDir === null) {
      this._cacheDataDir = NativeBridge.getDataDir ? NativeBridge.getDataDir() : ''
    }
    return this._cacheDataDir
  }
}

let NativeBridge: NativeBridgeType

const initRnBridge = () => {
  NativeBridge = ((process as any)._linkedBinding && (process as any)._linkedBinding('rn_bridge')) as NativeBridgeType
  const EVENT_CHANNEL = '_EVENTS_'
  const SYSTEM_CHANNEL = '_SYSTEM_'
  const channels: Record<string, SystemChannel | EventChannel> = {}
  function bridgeListener(channelName: string, data: string): void {
    if (Object.prototype.hasOwnProperty.call(channels, channelName)) {
      channels[channelName].processData(data)
    } else {
      logger.error('ERROR: Channel not found:', channelName)
    }
  }
  function registerChannel(channel: SystemChannel | EventChannel): void {
    channels[channel.name] = channel
    NativeBridge.registerChannel(channel.name, bridgeListener)
  }
  const systemChannel = new SystemChannel(SYSTEM_CHANNEL)
  registerChannel(systemChannel)
  NativeBridge.sendMessage(SYSTEM_CHANNEL, 'ready-for-app-events')
  const eventChannel = new EventChannel(EVENT_CHANNEL)
  registerChannel(eventChannel)
  return {
    app: systemChannel,
    channel: eventChannel,
  } as RnBridge
}

export { SystemChannel, EventChannel }
export interface RnBridge {
  app: SystemChannel
  channel: EventChannel
}
export default initRnBridge
