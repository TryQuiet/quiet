import { jest } from '@jest/globals'
import net from 'net'
import { setTimeout as sleep } from 'timers/promises'
import { TorControl, TOR_CONTROL_COMMAND_TIMEOUT_MS } from './tor-control.service'
import { TorControlAuthType } from './tor.types'
import type { ConfigOptions } from '../types'

describe('Tor control authentication over TCP', () => {
  let server: net.Server
  let control: TorControl
  let sockets: Set<net.Socket>
  let authenticate: (socket: net.Socket, attempt: number) => void
  let attempts: number
  let commands: string[]

  beforeEach(async () => {
    sockets = new Set()
    attempts = 0
    commands = []
    authenticate = socket => socket.write('250 OK\r\n')
    server = net.createServer(socket => {
      sockets.add(socket)
      socket.setNoDelay(true)
      socket.on('error', () => undefined)
      socket.once('close', () => sockets.delete(socket))
      let buffer = ''
      socket.on('data', data => {
        buffer += data.toString()
        const lines = buffer.split('\r\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('AUTHENTICATE')) authenticate(socket, ++attempts)
          else {
            commands.push(line)
            socket.write('250 OK\r\n')
          }
        }
      })
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    control = new TorControl(
      {
        host: '127.0.0.1',
        port: (server.address() as net.AddressInfo).port,
        auth: { type: TorControlAuthType.PASSWORD, value: 'test-password' },
      },
      {} as ConfigOptions
    )
  })

  afterEach(async () => {
    control.onModuleDestroy()
    for (const socket of sockets) socket.destroy()
    await new Promise<void>(resolve => server.close(() => resolve()))
    jest.restoreAllMocks()
  })

  it('authenticates when the success reply is split across TCP packets', async () => {
    authenticate = socket => {
      socket.write('250 ')
      void sleep(25).then(() => {
        if (!socket.destroyed) socket.write('OK\r\n')
      })
    }
    await expect(
      control.sendCommand('GETINFO status/bootstrap-phase', AbortSignal.timeout(2_000))
    ).resolves.toMatchObject({
      code: 250,
    })
    expect(attempts).toBe(1)
    expect(commands).toEqual(['GETINFO status/bootstrap-phase'])
  })

  it('reconnects when Tor closes the socket before replying to authentication', async () => {
    authenticate = (socket, attempt) => {
      if (attempt === 1) socket.destroy()
      else socket.write('250 OK\r\n')
    }
    await expect(
      control.sendCommand('GETINFO status/bootstrap-phase', AbortSignal.timeout(2_000))
    ).resolves.toMatchObject({
      code: 250,
    })
    expect(attempts).toBe(2)
    expect(commands).toHaveLength(1)
  })

  it('bounds a silent authentication attempt and retries on a fresh connection', async () => {
    authenticate = (socket, attempt) => {
      if (attempt > 1) socket.write('250 OK\r\n')
    }
    await expect(
      control.sendCommand('GETINFO status/bootstrap-phase', AbortSignal.timeout(7_000))
    ).resolves.toMatchObject({
      code: 250,
    })
    expect(attempts).toBe(2)
    expect(commands).toHaveLength(1)
  }, 10_000)

  it(
    'bounds a silent native listener, expires queued identity creation, then recovers without replay',
    async () => {
      authenticate = () => undefined
      const expired = Promise.allSettled([
        control.sendCommand('ADD_ONION NEW:ED25519-V3 Port=80'),
        control.sendCommand('ADD_ONION NEW:ED25519-V3 Port=81'),
      ])
      const startedAt = Date.now()
      for (const result of await expired) {
        expect(result.status).toBe('rejected')
        if (result.status === 'rejected') expect(result.reason.message).toContain('Tor control to become available')
      }
      expect(Date.now() - startedAt).toBeLessThan(TOR_CONTROL_COMMAND_TIMEOUT_MS + 2_000)
      expect(attempts).toBeGreaterThan(1)
      expect(commands).toEqual([])
      authenticate = socket => socket.write('250 OK\r\n')
      await expect(control.sendCommand('GETINFO version')).resolves.toMatchObject({ code: 250 })
      expect(commands).toEqual(['GETINFO version'])
      await sleep(20)
      expect(sockets.size).toBe(0)
    },
    TOR_CONTROL_COMMAND_TIMEOUT_MS + 5_000
  )

  it('recovers when the native TCP port disappears and comes back', async () => {
    const port = (server.address() as net.AddressInfo).port
    await new Promise<void>(resolve => server.close(() => resolve()))
    const result = control.sendCommand('ADD_ONION NEW:ED25519-V3 Port=80')
    await sleep(650)
    expect(commands).toEqual([])
    await new Promise<void>(resolve => server.listen(port, '127.0.0.1', resolve))
    await expect(result).resolves.toMatchObject({ code: 250 })
    expect(commands).toEqual(['ADD_ONION NEW:ED25519-V3 Port=80'])
  })

  it('rejects an active authentication wait on shutdown without sending its command', async () => {
    let received!: () => void
    const authenticated = new Promise<void>(resolve => (received = resolve))
    authenticate = () => received()
    const failure = expect(
      control.sendCommand('ADD_ONION NEW:ED25519-V3 Port=80', AbortSignal.timeout(2_000))
    ).rejects.toThrow('Tor control is closed')
    await authenticated
    control.onModuleDestroy()
    await failure
    expect(commands).toHaveLength(0)
  })
})
