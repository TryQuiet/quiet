import { PassThrough } from 'stream'
import { type MultiaddrConnection } from '@libp2p/interface'
import { multiaddr } from '@multiformats/multiaddr'
import { type DuplexWebSocket } from 'it-ws/duplex'
import { generateLibp2pPSK } from '../common/utils'
import { socketToMaConn } from '../websocketOverTor/socket-to-conn'
import { defaultLogger } from './libp2p.logger'
import { CONNECTION_UPGRADE_TIMEOUT_MS, createConnectionProtector } from './libp2p.connection-protector'

/** A real byte duplex; only delivery of the first nonce in each direction is delayed. */
function createDuplex(nonceDelay: number) {
  const streams = [new PassThrough(), new PassThrough()]
  const timers = new Map<ReturnType<typeof setTimeout>, () => void>()
  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    for (const [timer, resolve] of timers) {
      clearTimeout(timer)
      resolve()
    }
    timers.clear()
    for (const stream of streams) stream.destroy()
  }
  const delayNonce = async () =>
    new Promise<void>(resolve => {
      const timer = setTimeout(() => {
        timers.delete(timer)
        resolve()
      }, nonceDelay)
      timers.set(timer, resolve)
    })

  const connections: MultiaddrConnection[] = streams.map((incoming, index) => ({
    log: defaultLogger().forComponent(`pnet-test:${index}`),
    remoteAddr: multiaddr(`/memory/${1 - index}`),
    timeline: { open: Date.now() },
    source: (async function* () {
      let first = true
      try {
        for await (const chunk of incoming) {
          if (first && nonceDelay > 0) await delayNonce()
          first = false
          if (closed) return
          yield new Uint8Array(chunk)
        }
      } catch (err) {
        if (!closed) throw err
      }
    })(),
    sink: async source => {
      for await (const chunk of source) {
        if (closed) return
        streams[1 - index].write(chunk instanceof Uint8Array ? chunk : chunk.subarray())
      }
    },
    close: async () => close(),
    abort: () => close(),
  }))
  return { connections, close, streams }
}

async function readMessage(connection: MultiaddrConnection, length: number) {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of connection.source) {
    const bytes = Buffer.from(chunk instanceof Uint8Array ? chunk : chunk.subarray())
    chunks.push(bytes)
    size += bytes.length
    if (size >= length) return Buffer.concat(chunks)
  }
  throw new Error(`Protected stream ended after ${size} of ${length} bytes`)
}

async function* messageSource(message: Uint8Array) {
  yield message
}

describe('Production connection protector timeout', () => {
  it.each([0, 1_500])('exchanges encrypted payloads with a %ims nonce delay', async nonceDelay => {
    const duplex = createDuplex(nonceDelay)
    const psk = generateLibp2pPSK().fullKey
    const protectors = [0, 1].map(() => createConnectionProtector(psk)({ logger: defaultLogger() }))
    try {
      const [a, b] = await Promise.all(
        protectors.map(async (protector, index) => protector.protect(duplex.connections[index]))
      )
      const fromA = Buffer.from('payload from the joining peer')
      const fromB = Buffer.from('payload from the community owner')
      const received = await Promise.all([
        readMessage(b, fromA.length),
        readMessage(a, fromB.length),
        a.sink(messageSource(fromA)),
        b.sink(messageSource(fromB)),
      ])
      expect(received[0]).toEqual(fromA)
      expect(received[1]).toEqual(fromB)
    } finally {
      duplex.close()
      expect(duplex.streams.every(stream => stream.destroyed)).toBe(true)
    }
  })

  it.each(['caller abort', 'transport close'])('interrupts a silent peer promptly on %s', async interruption => {
    const duplex = createDuplex(0)
    const controller = new AbortController()
    const raw = duplex.connections[0]
    // Run the real Tor socket adapter and its abortable source. The byte stream
    // and socket event surface replace only the network transport, not pnet.
    const socket = {
      source: raw.source,
      sink: raw.sink,
      close: async () => duplex.close(),
      destroy: duplex.close,
      socket: new EventTarget(),
    } as unknown as DuplexWebSocket
    const connection = socketToMaConn(socket, multiaddr('/ip4/127.0.0.1/tcp/1234'), {
      logger: defaultLogger(),
      signal: interruption === 'caller abort' ? controller.signal : undefined,
    })
    const protector = createConnectionProtector(generateLibp2pPSK().fullKey)({ logger: defaultLogger() })
    const failure = protector.protect(connection, { signal: controller.signal }).catch(err => err)
    const started = Date.now()
    let deadline: ReturnType<typeof setTimeout> | undefined
    try {
      await new Promise<void>(resolve => setImmediate(resolve))
      if (interruption === 'caller abort') controller.abort()
      else await connection.close()
      const err = await Promise.race([
        failure,
        new Promise<never>((_, reject) => {
          deadline = setTimeout(() => reject(new Error('Protection remained pending after interruption')), 500)
        }),
      ])
      expect(err.name).toBe(interruption === 'caller abort' ? 'AbortError' : 'UnexpectedEOFError')
      expect(Date.now() - started).toBeLessThan(500)
    } finally {
      clearTimeout(deadline)
      duplex.close()
      await failure
      expect(duplex.streams.every(stream => stream.destroyed)).toBe(true)
    }
  })

  it('terminates a nonce exchange with no remote response within the existing upgrade budget', async () => {
    const duplex = createDuplex(0)
    const protector = createConnectionProtector(generateLibp2pPSK().fullKey)({ logger: defaultLogger() })
    const started = Date.now()
    try {
      // The opposite raw endpoint stays open and sends no nonce. Use the real
      // AbortSignal timer, not a mocked timeout or only an options assertion.
      await expect(protector.protect(duplex.connections[0])).rejects.toMatchObject({ code: 'ABORT_ERR' })
      const elapsed = Date.now() - started
      expect(elapsed).toBeGreaterThanOrEqual(CONNECTION_UPGRADE_TIMEOUT_MS - 100)
      expect(elapsed).toBeLessThan(CONNECTION_UPGRADE_TIMEOUT_MS + 5_000)
    } finally {
      duplex.close()
      expect(duplex.streams.every(stream => stream.destroyed)).toBe(true)
    }
  }, 75_000)
})
