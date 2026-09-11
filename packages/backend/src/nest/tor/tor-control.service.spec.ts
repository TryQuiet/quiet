import { jest } from '@jest/globals'
import { EventEmitter } from 'events'
import net from 'net'

import { ConfigOptions } from '../types'
import { TorControl } from './tor-control.service'
import { TorControlAuthType, TorControlParams } from './tor.types'

const createTorControl = (authCookie: string) => {
  const torControlParams: TorControlParams = {
    port: 9051,
    host: 'localhost',
    auth: {
      type: TorControlAuthType.COOKIE,
      value: authCookie,
    },
  }
  const torControl = new TorControl(torControlParams, {} as ConfigOptions)
  const logger = {
    debug: jest.fn(),
    error: jest.fn(),
  }
  ;(torControl as any).logger = logger
  jest.spyOn(torControl as any, 'connect').mockResolvedValue(undefined)
  return { logger, torControl }
}

describe('TorControl logging', () => {
  it('logs command and response metadata without ADD_ONION private keys', async () => {
    const authCookie = 'auth-cookie-sentinel'
    const requestPrivateKey = 'ED25519-V3:request-private-key-sentinel'
    const responsePrivateKey = 'ED25519-V3:response-private-key-sentinel'
    const { logger, torControl } = createTorControl(authCookie)
    jest.spyOn(torControl, '_sendCommand').mockResolvedValue({
      code: 250,
      messages: ['250-ServiceID=example', `250-PrivateKey=${responsePrivateKey}`, '250 OK'],
    })

    await torControl.sendCommand(`ADD_ONION ${requestPrivateKey} Flags=Detach Port=80,127.0.0.1:3000`)

    const logs = JSON.stringify(logger.debug.mock.calls)
    expect(logger.debug).toHaveBeenCalledWith('Sending Tor command', { command: 'ADD_ONION' })
    expect(logger.debug).toHaveBeenCalledWith('Tor command response', {
      command: 'ADD_ONION',
      code: 250,
      messageCount: 3,
    })
    expect(logs).not.toContain(requestPrivateKey)
    expect(logs).not.toContain(responsePrivateKey)
    expect(logs).not.toContain(authCookie)
  })

  it('does not log an authentication cookie', async () => {
    const authCookie = 'authentication-cookie-sentinel'
    const { logger, torControl } = createTorControl(authCookie)
    jest.spyOn(torControl, '_sendCommand').mockResolvedValue({ code: 250, messages: ['250 OK'] })

    await torControl.sendCommand(`AUTHENTICATE ${authCookie}`)

    expect(logger.debug).toHaveBeenCalledWith('Sending Tor command', { command: 'AUTHENTICATE' })
    expect(JSON.stringify(logger.debug.mock.calls)).not.toContain(authCookie)
  })
})

describe('TorControl credential readiness', () => {
  const cookie = 'a'.repeat(64)
  let torControl: TorControl
  let writes: string[]
  let authReply: string
  let connect: jest.SpiedFunction<typeof net.connect>

  beforeEach(() => {
    jest.useFakeTimers()
    writes = []
    authReply = '250 OK\r\n'
    torControl = new TorControl(
      { port: 9051, host: 'localhost', auth: { type: TorControlAuthType.COOKIE, value: '' } },
      {} as ConfigOptions
    )
    connect = jest.spyOn(net, 'connect').mockImplementation(() => {
      const socket = new EventEmitter() as net.Socket
      socket.end = jest.fn(() => socket) as net.Socket['end']
      socket.write = jest.fn((data: string) => {
        writes.push(data)
        void Promise.resolve().then(() =>
          socket.emit('data', Buffer.from(data.startsWith('AUTHENTICATE') ? authReply : '250 OK\r\n'))
        )
        return true
      }) as net.Socket['write']
      return socket
    })
  })

  afterEach(() => {
    torControl.onModuleDestroy()
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  const supplyCookie = (value = cookie) => {
    torControl.updateConnectionParams({
      port: 9051,
      host: 'localhost',
      auth: { type: TorControlAuthType.COOKIE, value },
    })
  }

  it('queues all commands silently until credentials arrive, then serializes authentication and commands', async () => {
    const commands = ['ADD_ONION NEW:BEST Port=80,127.0.0.1:3000', 'GETINFO status/bootstrap-phase', 'SIGNAL NEWNYM']
    const results = Promise.all(commands.map(command => torControl.sendCommand(command)))
    await jest.advanceTimersByTimeAsync(30_000)
    expect(connect).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)

    supplyCookie()
    await jest.advanceTimersByTimeAsync(1)
    await expect(results).resolves.toHaveLength(3)
    expect(writes).toEqual(commands.flatMap(command => [`AUTHENTICATE ${cookie}\r\n`, `${command}\r\n`]))
    expect(torControl.isSending).toBe(false)
  })

  it('rejects incorrect credentials once and allows a later command with refreshed credentials', async () => {
    supplyCookie()
    authReply = '515 Authentication failed: Wrong length on authentication cookie.\r\n'
    const failure = expect(torControl.sendCommand('GETINFO status/bootstrap-phase')).rejects.toThrow(
      '515 Authentication failed'
    )
    await jest.advanceTimersByTimeAsync(30_000)
    await failure
    expect(connect).toHaveBeenCalledTimes(1)
    expect(writes).toEqual([`AUTHENTICATE ${cookie}\r\n`])

    const refreshedCookie = 'b'.repeat(64)
    supplyCookie(refreshedCookie)
    authReply = '250 OK\r\n'
    const result = torControl.sendCommand('GETINFO status/bootstrap-phase')
    await jest.advanceTimersByTimeAsync(1)
    await expect(result).resolves.toMatchObject({ code: 250 })
    expect(writes.slice(1)).toEqual([`AUTHENTICATE ${refreshedCookie}\r\n`, 'GETINFO status/bootstrap-phase\r\n'])
  })

  it('rejects active credential waits and queued commands when the module closes', async () => {
    const results = Promise.allSettled([
      torControl.waitForCredentials(),
      torControl.sendCommand('ADD_ONION NEW:BEST Port=80,127.0.0.1:3000'),
      torControl.sendCommand('GETINFO status/bootstrap-phase'),
    ])
    await jest.advanceTimersByTimeAsync(0)
    torControl.onModuleDestroy()
    expect((await results).every(result => result.status === 'rejected')).toBe(true)
    expect(connect).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)
    await expect(torControl.sendCommand('GETINFO status/bootstrap-phase')).rejects.toThrow('Tor control is closed')
  })
})
