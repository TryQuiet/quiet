import { randomBytes } from '@libp2p/crypto'
import {
  AbortOptions,
  CodeError,
  ERR_INVALID_MESSAGE,
  ERR_TIMEOUT,
  IncomingStreamData,
  PeerId,
  Stream,
} from '@libp2p/interface'
import { PingServiceComponents, PingServiceInit } from '@libp2p/ping'
import first from 'it-first'
import { pipe } from 'it-pipe'
import { equals as uint8ArrayEquals } from 'uint8arrays/equals'

// errors
const ERR_WRONG_PING_ACK = 'ERR_WRONG_PING_ACK'

// init constants
const PROTOCOL_PREFIX = 'ipfs'
const PROTOCOL_NAME = 'ping'
const PROTOCOL_VERSION = '1.0.0'
const MAX_INBOUND_STREAMS = 2
const MAX_OUTBOUND_STREAMS = 1
const TIMEOUT = 10_000
const PING_LENGTH = 32

export class PingService {
  protocol
  components
  started
  timeout
  maxInboundStreams
  maxOutboundStreams
  runOnTransientConnection
  log
  constructor(components: PingServiceComponents, init: PingServiceInit = {}) {
    this.components = components
    this.log = components.logger.forComponent('libp2p:ping')
    this.started = false
    this.protocol = `/${init.protocolPrefix ?? PROTOCOL_PREFIX}/${PROTOCOL_NAME}/${PROTOCOL_VERSION}`
    this.timeout = init.timeout ?? TIMEOUT
    this.maxInboundStreams = init.maxInboundStreams ?? MAX_INBOUND_STREAMS
    this.maxOutboundStreams = init.maxOutboundStreams ?? MAX_OUTBOUND_STREAMS
    this.runOnTransientConnection = init.runOnTransientConnection ?? true
    this.handleMessage = this.handleMessage.bind(this)
  }

  [Symbol.toStringTag] = '@libp2p/ping'

  async start() {
    this.log(`Starting ping service`)
    await this.components.registrar.handle(this.protocol, this.handleMessage, {
      maxInboundStreams: this.maxInboundStreams,
      maxOutboundStreams: this.maxOutboundStreams,
      runOnTransientConnection: this.runOnTransientConnection,
    })
    this.started = true
  }

  async stop() {
    await this.components.registrar.unhandle(this.protocol)
    this.started = false
  }

  isStarted() {
    return this.started
  }

  /**
   * A handler to register with Libp2p to process ping messages
   */
  handleMessage(data: IncomingStreamData) {
    this.log('incoming ping from %p', data.connection.remotePeer)
    const { stream } = data
    const start = Date.now()
    const signal = AbortSignal.timeout(this.timeout)
    signal.addEventListener('abort', () => {
      stream?.abort(new CodeError('ping timeout', ERR_TIMEOUT))
    })
    void pipe(
      stream,
      async function* (source) {
        let received = 0
        for await (const buf of source) {
          received += buf.byteLength
          if (received > PING_LENGTH) {
            stream?.abort(new CodeError('Too much data received', ERR_INVALID_MESSAGE))
            return
          }
          yield buf
        }
      },
      stream
    )
      .catch((err: Error) => {
        this.log.error('incoming ping from %p failed with error', data.connection.remotePeer, err)
        stream?.abort(err)
      })
      .finally(() => {
        const ms = Date.now() - start
        this.log('incoming ping from %p complete in %dms', data.connection.remotePeer, ms)
      })
  }

  /**
   * Ping a given peer and wait for its response, getting the operation latency.
   */
  async ping(peer: PeerId, options: AbortOptions = {}) {
    this.log('pinging %p', peer)
    const start = Date.now()
    const data = randomBytes(PING_LENGTH)
    const connection = await this.components.connectionManager.openConnection(peer, options)
    let stream: Stream | undefined
    let onAbort = () => {}
    if (options.signal == null) {
      const signal = AbortSignal.timeout(this.timeout)
      options = {
        ...options,
        signal,
      }
    }
    try {
      stream = await connection.newStream(this.protocol, {
        ...options,
        runOnTransientConnection: this.runOnTransientConnection,
      })
      onAbort = () => {
        stream?.abort(new CodeError('ping timeout', ERR_TIMEOUT))
      }
      // make stream abortable
      options.signal?.addEventListener('abort', onAbort, { once: true })
      const result = await pipe([data], stream, async source => first(source))
      const ms = Date.now() - start
      if (result == null) {
        throw new CodeError(`Did not receive a ping ack after ${ms}ms`, ERR_WRONG_PING_ACK)
      }
      if (!uint8ArrayEquals(data, result.subarray())) {
        throw new CodeError(`Received wrong ping ack after ${ms}ms`, ERR_WRONG_PING_ACK)
      }
      this.log('ping %p complete in %dms', connection.remotePeer, ms)
      return ms
    } catch (err) {
      this.log.error('error while pinging %p', connection.remotePeer, err)
      stream?.abort(err)
      throw err
    } finally {
      options.signal?.removeEventListener('abort', onAbort)
      if (stream != null) {
        await stream.close()
      }
    }
  }
}

export function ping(init: PingServiceInit = {}): (components: PingServiceComponents) => PingService {
  return components => new PingService(components, init)
}
