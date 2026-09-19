import { jest } from '@jest/globals'
import net from 'net'
import { setTimeout as sleep } from 'timers/promises'
import { Tor } from './tor.service'
import { TorControl } from './tor-control.service'
import { createOnionIdentity } from './onion-identity'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { HiddenServiceData, TorControlAuthType } from './tor.types'

// Actual TCP framing, command serialization and event subscriptions are exercised.
// Only Tor's network and service table are simulated, so failures are repeatable.
describe('hidden service registration and publication lifecycle', () => {
  let server: net.Server
  let control: TorControl
  let tor: Tor
  let service: HiddenServiceData
  let commands: string[]
  let registered: Map<string, string>
  let sockets: Set<net.Socket>
  let observers: Set<net.Socket>
  let loseAddReply: boolean
  let rejectAdd: boolean

  const until = async (predicate: () => boolean) => {
    for (let attempt = 0; attempt < 1000; attempt++) {
      if (predicate()) return
      await sleep(5)
    }
    throw new Error('Control protocol did not reach the expected state')
  }
  const count = (command: string) => commands.filter(line => line.startsWith(command)).length
  const publish = (address = service.onionAddress) => {
    for (const socket of observers) socket.write(`650 HS_DESC UPLOADED ${address} NO_AUTH hsdir\r\n`)
  }
  const pendingRetry = () => tor['hiddenServiceRetryTimers'].has(service.onionAddress)

  beforeEach(async () => {
    commands = []
    registered = new Map()
    sockets = new Set()
    observers = new Set()
    loseAddReply = false
    rejectAdd = false
    const identity = createOnionIdentity()
    service = {
      onionAddress: identity.onionAddress.replace('.onion', ''),
      privKey: identity.privateKey,
      targetPort: 4343,
      virtPort: 80,
    }
    server = net.createServer(socket => {
      sockets.add(socket)
      socket.on('error', () => undefined)
      socket.once('close', () => {
        sockets.delete(socket)
        observers.delete(socket)
      })
      let buffer = ''
      socket.on('data', data => {
        buffer += data.toString()
        const lines = buffer.split('\r\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          commands.push(line)
          if (line.startsWith('AUTHENTICATE')) socket.write('250 OK\r\n')
          else if (line === 'SETEVENTS HS_DESC') {
            observers.add(socket)
            socket.write('250 OK\r\n')
          } else if (line === 'GETINFO onions/detached') {
            // GETINFO data replies can span TCP packets. Never infer absence
            // from just the first header packet.
            socket.write('250+onions/detached=\r\n')
            setImmediate(() => socket.write([...registered.keys(), '.', '250 OK', ''].join('\r\n')))
          } else if (line.startsWith('ADD_ONION')) {
            if (rejectAdd) socket.write('513 Invalid key\r\n')
            else if (registered.has(service.onionAddress)) socket.write('550 Onion address collision\r\n')
            else {
              registered.set(service.onionAddress, line.split(' Port=')[1])
              if (loseAddReply) {
                loseAddReply = false
                socket.destroy()
              } else socket.write(`250-ServiceID=${service.onionAddress}\r\n250 OK\r\n`)
            }
          } else if (line.startsWith('DEL_ONION ')) {
            registered.delete(line.split(' ')[1])
            socket.write('250 OK\r\n')
          } else socket.write('510 Unexpected command\r\n')
        }
      })
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as net.AddressInfo).port
    const config = { options: {}, env: {}, torControlPort: port } as ConfigOptions
    control = new TorControl(
      { port, host: '127.0.0.1', auth: { type: TorControlAuthType.PASSWORD, value: 'test' } },
      config
    )
    tor = new Tor(
      config,
      '',
      { torPath: '', options: { env: { HOME: '', LD_LIBRARY_PATH: undefined }, detached: false } },
      { torPassword: '', torHashedPassword: '' },
      { io: { emit: jest.fn() } } as unknown as ServerIoProviderTypes,
      control
    )
    tor.bootstrapped = true
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] })
  })

  afterEach(async () => {
    await tor.onModuleDestroy()
    control.onModuleDestroy()
    for (const socket of sockets) socket.destroy()
    await new Promise<void>(resolve => server.close(() => resolve()))
    jest.useRealTimers()
  })

  it('records ADD acceptance immediately and observes a slow upload without registering twice', async () => {
    await tor.registerHiddenService(service)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    expect(tor['publishedHiddenServices'].size).toBe(0)
    await jest.advanceTimersByTimeAsync(180_000)
    await tor.registerHiddenService(service)
    expect(count('ADD_ONION')).toBe(1)
    expect(count('DEL_ONION')).toBe(0)
    publish('another-service')
    await sleep(10)
    expect(tor['publishedHiddenServices'].size).toBe(0)
    publish()
    await until(() => tor['publishedHiddenServices'].has(service.onionAddress))
  })

  it('reconnects the observer after acceptance without replacing the registered service', async () => {
    await tor.registerHiddenService(service)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    for (const socket of observers) socket.destroy()
    await until(pendingRetry)
    await jest.advanceTimersByTimeAsync(2500)
    await until(() => count('GETINFO onions/detached') === 2)
    publish()
    await until(() => tor['publishedHiddenServices'].has(service.onionAddress))
    expect(count('ADD_ONION')).toBe(1)
    expect(count('DEL_ONION')).toBe(0)
  })

  it('reconciles an accepted ADD whose reply was lost instead of looping on collisions', async () => {
    loseAddReply = true
    await tor.registerHiddenService(service)
    await until(pendingRetry)
    expect(registered.has(service.onionAddress)).toBe(true)
    expect(tor['registeredHiddenServices'].size).toBe(0)
    await jest.advanceTimersByTimeAsync(2500)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    expect(count('ADD_ONION')).toBe(2)
    expect(count('DEL_ONION')).toBe(1)
    publish()
    await until(() => tor['publishedHiddenServices'].has(service.onionAddress))
    await jest.advanceTimersByTimeAsync(60_000)
    expect(count('ADD_ONION')).toBe(2)
    expect(pendingRetry()).toBe(false)
  })

  it('repairs an orphan from an earlier app session with the current listener port', async () => {
    registered.set(service.onionAddress, '80,127.0.0.1:9999')
    await tor.registerHiddenService(service)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    expect(registered.get(service.onionAddress)).toBe('80,127.0.0.1:4343')
    expect(count('DEL_ONION')).toBe(1)
    expect(count('ADD_ONION')).toBe(1)
    publish()
    await until(() => tor['publishedHiddenServices'].has(service.onionAddress))
  })

  it('replaces the registration when the saved identity is launched on a new listener port', async () => {
    await tor.registerHiddenService(service)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    await tor.registerHiddenService({ ...service, targetPort: 5454 })
    await until(() => tor['registeredHiddenServices'].get(service.onionAddress)?.targetPort === 5454)
    expect(registered.get(service.onionAddress)).toBe('80,127.0.0.1:5454')
    expect(count('ADD_ONION')).toBe(2)
    expect(count('DEL_ONION')).toBe(1)
    publish()
    await until(() => tor['publishedHiddenServices'].has(service.onionAddress))
  })

  it('backs off repeated observer failures while preserving the accepted registration', async () => {
    await tor.registerHiddenService(service)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    for (const socket of observers) socket.destroy()
    await until(pendingRetry)
    await jest.advanceTimersByTimeAsync(2500)
    await until(() => count('GETINFO onions/detached') === 2)
    for (const socket of observers) socket.destroy()
    await until(pendingRetry)
    await jest.advanceTimersByTimeAsync(2500)
    expect(count('GETINFO onions/detached')).toBe(2)
    await jest.advanceTimersByTimeAsync(2500)
    await until(() => count('GETINFO onions/detached') === 3)
    publish()
    await until(() => tor['publishedHiddenServices'].has(service.onionAddress))
    expect(count('ADD_ONION')).toBe(1)
  })

  it('keeps registration after an explicit publication wait expires', async () => {
    const failure = expect(tor.waitForHiddenServicePublication(service)).rejects.toThrow('Timeout while waiting')
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    await jest.advanceTimersByTimeAsync(120_000)
    await failure
    await tor.registerHiddenService(service)
    await until(() => count('GETINFO onions/detached') === 2)
    publish()
    await until(() => tor['publishedHiddenServices'].has(service.onionAddress))
    expect(count('ADD_ONION')).toBe(1)
    expect(count('DEL_ONION')).toBe(0)
  })

  it('cancels an observer before deletion and cannot resurrect its service on a late event', async () => {
    await tor.registerHiddenService(service)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    const deletion = tor.destroyHiddenService(service.onionAddress)
    publish()
    await expect(deletion).resolves.toBe(true)
    await jest.advanceTimersByTimeAsync(180_000)
    expect(tor['hiddenServices'].size).toBe(0)
    expect(tor['registeredHiddenServices'].size).toBe(0)
    expect(tor['publishedHiddenServices'].size).toBe(0)
    expect(count('ADD_ONION')).toBe(1)
  })

  it('stops retrying a permanently invalid key', async () => {
    rejectAdd = true
    await tor.registerHiddenService(service)
    await until(() => count('ADD_ONION') === 1 && tor['hiddenServicePublicationPromises'].size === 0)
    await jest.advanceTimersByTimeAsync(3_600_000)
    expect(count('ADD_ONION')).toBe(1)
    expect(pendingRetry()).toBe(false)
  })
})
