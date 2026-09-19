import { once } from 'node:events'
import { WebSocket, WebSocketServer } from 'ws'
import duplex from 'it-ws/duplex'

type Source = AsyncGenerator<Uint8Array> & { connected: () => Promise<void> }

describe('WebSocket receive lifecycle', () => {
  let server: WebSocketServer
  let client: WebSocket
  let source: Source

  beforeEach(async () => {
    server = new WebSocketServer({ host: '127.0.0.1', port: 0 })
    await once(server, 'listening')
    const address = server.address() as { port: number }
    client = new WebSocket(`ws://127.0.0.1:${address.port}`)
    // The fixture owns socket shutdown, including errors from terminating a
    // connecting socket after the source's listeners have been removed.
    client.on('error', () => {})
    source = duplex(client).source as Source
  })

  afterEach(async () => {
    await source?.return(undefined)
    if (client?.readyState !== WebSocket.CLOSED) {
      const closed = new Promise<void>(resolve => client.once('close', () => resolve()))
      client.terminate()
      await closed
    }
    for (const socket of server.clients) socket.terminate()
    await new Promise<void>(resolve => server.close(() => resolve()))
  })

  const expectReleasedListeners = () => {
    expect(client.listenerCount('message')).toBe(0)
    expect(client.listenerCount('open')).toBe(0)
    expect(client.listenerCount('close')).toBe(0)
    expect(client.listenerCount('error')).toBe(1) // fixture's socket owner
  }

  it('preserves nonce frames that arrive before the first source read, in order', async () => {
    const nonce = Buffer.alloc(24, 1)
    const later = Buffer.alloc(24, 2)
    server.once('connection', socket => socket.send(nonce))
    await once(client, 'message')
    const remote = [...server.clients][0]
    const arrived = once(client, 'message')
    remote.send(later)
    await arrived

    expect(Buffer.from((await source.next()).value)).toEqual(nonce)
    expect(Buffer.from((await source.next()).value)).toEqual(later)
  })

  it('drains buffered data and ends after a close before the first read', async () => {
    server.once('connection', socket => {
      socket.send('before close')
      socket.close()
    })
    await once(client, 'close')
    await expect(source.connected()).resolves.toBeUndefined()
    expect(Buffer.from((await source.next()).value).toString()).toBe('before close')
    expect((await source.next()).done).toBe(true)
    expectReleasedListeners()
  })

  it('rejects connection and read waiters if the socket fails before opening', async () => {
    const connected = expect(source.connected()).rejects.toThrow()
    const next = expect(source.next()).rejects.toThrow()
    const closed = new Promise<void>(resolve => client.once('close', () => resolve()))
    client.terminate()
    await Promise.all([connected, next, closed])
    expectReleasedListeners()
  })

  it('retains an error received before the first read', async () => {
    await source.connected()
    const failure = new Error('receive failed before reading')
    client.emit('error', failure)
    await expect(source.next()).rejects.toBe(failure)
    expectReleasedListeners()
  })

  it.each([false, true])('releases listeners when canceled without reading (opened=%s)', async opened => {
    if (opened) await source.connected()
    await source.return(undefined)
    if (!opened) await expect(source.connected()).rejects.toThrow('canceled')
    expect((await source.next()).done).toBe(true)
    expectReleasedListeners()
  })

  it.each(['return', 'throw'] as const)('settles an outstanding read on consumer %s', async method => {
    await source.connected()
    const pending = source.next()
    if (method === 'throw') {
      const failure = new Error('consumer canceled')
      await expect(source.throw(failure)).rejects.toBe(failure)
    } else {
      await source.return(undefined)
    }
    expect((await pending).done).toBe(true)
    expectReleasedListeners()
  })
})
