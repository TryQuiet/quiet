import { jest } from '@jest/globals'
import { createServer, type Server } from 'http'
import type { Socket as TcpSocket } from 'net'
import { Server as SocketIOServer } from 'socket.io'
import { io, type Socket } from 'socket.io-client'
import waitForExpect from 'wait-for-expect'
import { SocketService } from './socket.service'
import type { ConfigOptions } from '../types'
import { registerMobileSocketRecovery } from '../../mobile-socket-recovery'
import { EventChannel, SystemChannel } from '../../rn-bridge'

describe('native bridge local listener recovery', () => {
  let server: Server
  let ioServer: SocketIOServer
  let service: SocketService
  let port: number
  let clients: Socket[]
  let transports: Set<TcpSocket>
  let native: SystemChannel
  let onError: jest.Mock

  beforeEach(async () => {
    clients = []
    transports = new Set()
    server = createServer()
    server.on('connection', socket => {
      transports.add(socket)
      socket.on('close', () => transports.delete(socket))
    })
    ioServer = new SocketIOServer(server)
    ioServer.use((socket, next) => {
      next(socket.handshake.headers.authorization === 'Bearer current-secret' ? undefined : new Error('Unauthorized'))
    })
    const config = { socketIOPort: 0 } as ConfigOptions
    service = new SocketService({ server, io: ioServer }, config)
    await service.listen()
    port = (server.address() as { port: number }).port
    config.socketIOPort = port
    native = new SystemChannel('_SYSTEM_')
    onError = jest.fn()
    registerMobileSocketRecovery([native], service, onError)
  })

  afterEach(async () => {
    clients.forEach(client => client.close())
    await new Promise<void>(resolve => ioServer.close(() => resolve()))
  })

  const connect = (secret = 'current-secret') => {
    const client = io(`http://127.0.0.1:${port}`, {
      transports: ['polling'],
      upgrade: false,
      reconnectionDelay: 20,
      reconnectionDelayMax: 20,
      extraHeaders: { authorization: `Bearer ${secret}` },
    })
    clients.push(client)
    return client
  }

  const interruptListener = async () => {
    const closed = new Promise<void>(resolve => server.close(() => resolve()))
    transports.forEach(socket => socket.destroy())
    await closed
  }

  it('reopens the listener through the native bridge and retains authentication and event handlers', async () => {
    const received = jest.fn()
    service.on('recovery-proof', received)
    ioServer.on('connection', socket => {
      socket.on('proof', (value, ack) => {
        service.emit('recovery-proof', value)
        ack(value)
      })
    })
    const client = connect()
    await waitForExpect(() => expect(client.connected).toBe(true))
    await expect(client.emitWithAck('proof', 'before')).resolves.toBe('before')
    await interruptListener()
    await waitForExpect(() => expect(client.connected).toBe(false))
    expect(client.active).toBe(true)

    const invalidClient = connect('stale-secret')
    const rejected = jest.fn()
    invalidClient.on('connect_error', rejected)
    native.processData('recoverSocket')
    native.processData('recoverSocket')

    await waitForExpect(() => expect(client.connected).toBe(true))
    await expect(client.emitWithAck('proof', 'after')).resolves.toBe('after')
    await waitForExpect(() => expect(rejected).toHaveBeenCalled())
    expect(invalidClient.connected).toBe(false)
    expect(received.mock.calls).toEqual([['before'], ['after']])
    expect(onError).not.toHaveBeenCalled()
  })

  it('probes an apparently listening but unreachable server before rebinding', async () => {
    await interruptListener()
    // A suspended native descriptor can leave the JS listening flag stale.
    const listening = jest.spyOn(server, 'listening', 'get').mockReturnValueOnce(true)
    try {
      await service.recoverLocalConnection()
    } finally {
      listening.mockRestore()
    }
    const client = connect()
    await waitForExpect(() => expect(client.connected).toBe(true))
  })

  it('accepts the Android event-channel recovery envelope', async () => {
    await interruptListener()
    const android = new EventChannel('_EVENTS_')
    registerMobileSocketRecovery([android], service, onError)
    android.processData(JSON.stringify({ event: 'recoverSocket', payload: '' }))
    const client = connect()
    await waitForExpect(() => expect(client.connected).toBe(true))
    expect(onError).not.toHaveBeenCalled()
  })

  it('coalesces repeated recovery and leaves a healthy client connected', async () => {
    const client = connect()
    await waitForExpect(() => expect(client.connected).toBe(true))
    const originalId = client.id
    const disconnected = jest.fn()
    client.on('disconnect', disconnected)
    const first = service.recoverLocalConnection()
    expect(service.recoverLocalConnection()).toBe(first)
    await first
    expect(client.id).toBe(originalId)
    expect(disconnected).not.toHaveBeenCalled()
  })

  it('does not reopen a listener after explicit backend shutdown', async () => {
    await service.close()
    native.processData('recoverSocket')
    await service.recoverLocalConnection()
    expect(server.listening).toBe(false)
  })

  it('does not reopen when shutdown finishes during the asynchronous recovery connection check', async () => {
    await interruptListener()
    let finishConnectionCheck: (error: Error | null, count: number) => void = () => undefined
    let connectionCheckStarted: () => void = () => undefined
    const checkingConnections = new Promise<void>(resolve => {
      connectionCheckStarted = resolve
    })
    const getConnections = jest.spyOn(server, 'getConnections').mockImplementationOnce(callback => {
      finishConnectionCheck = callback
      connectionCheckStarted()
      return server
    })
    const reopened = jest.fn()
    server.on('listening', reopened)
    try {
      const recovery = service.recoverLocalConnection()
      await checkingConnections
      // close() resolves immediately because recovery has already closed the
      // listener. Its pending getConnections callback must not reopen it later.
      await service.close()
      finishConnectionCheck(null, 0)
      await recovery
      expect(server.listening).toBe(false)
      expect(reopened).not.toHaveBeenCalled()
    } finally {
      getConnections.mockRestore()
      server.off('listening', reopened)
    }
  })

  it('reports bind failure over the bridge instead of crashing or hanging', async () => {
    await interruptListener()
    const occupied = createServer()
    await new Promise<void>(resolve => occupied.listen(port, '127.0.0.1', resolve))
    const listeningHandlers = server.listenerCount('listening')
    try {
      native.processData('recoverSocket')
      await waitForExpect(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'EADDRINUSE' })))
      expect(server.listenerCount('listening')).toBe(listeningHandlers)
    } finally {
      await new Promise<void>(resolve => occupied.close(() => resolve()))
    }
    await service.recoverLocalConnection()
    const client = connect()
    await waitForExpect(() => expect(client.connected).toBe(true))
  })
})
