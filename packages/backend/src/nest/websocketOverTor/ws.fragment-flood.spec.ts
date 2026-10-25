import { jest } from '@jest/globals'
import http from 'http'
import type { AddressInfo } from 'net'
import { WebSocket } from 'ws'
import { createServer } from 'it-ws/server'

jest.setTimeout(60000)

// GHSA-96hv-2xvq-fx4p / CVE-2026-48779: a peer sending endless 1-byte, non-final fragments made `ws` keep per-fragment
// bookkeeping far beyond `maxPayload`. The listener is `it-ws`'s server (see listener.ts), which uses `ws` defaults.
// Fixed `ws` drops such a connection after roughly 17k fragments; vulnerable `ws` accepts all of them.
describe('ws fragment flood against the it-ws server used by the WebSocket-over-Tor listener', () => {
  const FRAGMENTS = 300_000
  const BATCH = 500

  let httpServer: http.Server
  let itWsServer: ReturnType<typeof createServer>
  let serverSideClosed: Promise<void>
  let client: WebSocket

  beforeEach(async () => {
    httpServer = http.createServer()
    let markClosed: () => void
    serverSideClosed = new Promise<void>(resolve => {
      markClosed = resolve
    })
    itWsServer = createServer({
      server: httpServer,
      onConnection: stream => {
        stream.socket.on('error', () => {})
        stream.socket.on('close', () => markClosed())
      },
    })
    await itWsServer.listen({ port: 0 } as any)
  })

  afterEach(async () => {
    client?.terminate()
    await itWsServer.close()
  })

  it('terminates the connection and keeps memory bounded instead of buffering every fragment', async () => {
    const { port } = httpServer.address() as AddressInfo
    client = new WebSocket(`ws://127.0.0.1:${port}`)
    client.on('error', () => {})
    await new Promise<void>(resolve => client.once('open', () => resolve()))

    const heapBefore = process.memoryUsage().heapUsed
    let sent = 0
    const pump = async (): Promise<void> => {
      while (sent < FRAGMENTS && client.readyState === WebSocket.OPEN) {
        for (let i = 0; i < BATCH && sent < FRAGMENTS; i++, sent++) {
          client.send(Buffer.from([1]), { fin: false }, () => {})
        }
        await new Promise(resolve => setImmediate(resolve))
      }
    }
    await pump()

    await Promise.race([
      serverSideClosed,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`server kept all ${sent} fragments open`)), 15000)),
    ])
    expect(process.memoryUsage().heapUsed - heapBefore).toBeLessThan(150 * 1024 * 1024)
  })
})
