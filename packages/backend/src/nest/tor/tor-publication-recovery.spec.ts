import { jest } from '@jest/globals'
import net from 'net'
import { Tor } from './tor.service'
import { TorControl } from './tor-control.service'
import { TorControlAuthType } from './tor.types'
import { ConfigOptions, ServerIoProviderTypes } from '../types'

// Exercise the production Tor service and control protocol over real TCP. The
// server accepts ADD_ONION but withholds its first publication event, exactly
// like the CI failure that left every later ADD_ONION colliding with that service.
describe('hidden-service publication recovery', () => {
  let server: net.Server
  let control: TorControl
  let tor: Tor
  let sockets: Set<net.Socket>
  let subscribers: Set<net.Socket>
  let commands: string[]
  let live: boolean
  let adds: number
  let publishOnAttempt: number
  let queries: number
  let publishOnQuery: number
  let rejectAdd: boolean
  let afterAdd: (() => void) | undefined
  const onion = 'a'.repeat(56)

  beforeEach(async () => {
    sockets = new Set()
    subscribers = new Set()
    commands = []
    live = false
    adds = 0
    publishOnAttempt = 99
    publishOnQuery = 99
    queries = 0
    rejectAdd = false
    afterAdd = undefined
    server = net.createServer(socket => {
      socket.setNoDelay(true)
      sockets.add(socket)
      socket.on('close', () => {
        sockets.delete(socket)
        subscribers.delete(socket)
      })
      let pending = ''
      socket.on('data', bytes => {
        pending += bytes.toString()
        const lines = pending.split('\r\n')
        pending = lines.pop()!
        for (const command of lines) {
          if (command.startsWith('AUTHENTICATE')) socket.write('250 OK\r\n')
          else if (command === 'SETEVENTS HS_DESC') {
            subscribers.add(socket)
            socket.write('250 OK\r\n')
          } else if (command === 'GETINFO onions/detached') {
            queries++
            socket.write(`250-onions/detached=${live ? onion : ''}\r\n250 OK\r\n`)
            if (live && queries === publishOnQuery) {
              for (const subscriber of subscribers) subscriber.write(`650 HS_DESC UPLOADED ${onion} NO_AUTH hsdir\r\n`)
            }
          } else if (command.startsWith('ADD_ONION')) {
            commands.push('ADD_ONION')
            adds++
            if (live || rejectAdd) socket.write('550 Onion address collision\r\n')
            else {
              live = true
              socket.write(`250-ServiceID=${onion}\r\n250 OK\r\n`)
              if (adds === publishOnAttempt) {
                for (const subscriber of subscribers)
                  subscriber.write(`650 HS_DESC UPLOADED ${onion} NO_AUTH hsdir\r\n`)
              }
              afterAdd?.()
            }
          } else if (command.startsWith('DEL_ONION')) {
            commands.push(command)
            expect(command).toBe(`DEL_ONION ${onion}`)
            live = false
            socket.write('250 OK\r\n')
          } else throw new Error(`Unexpected Tor command: ${command}`)
        }
      })
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as net.AddressInfo).port
    const config = { options: {}, socketIOPort: 0, httpTunnelPort: 0, torControlPort: port, env: {} } as ConfigOptions
    control = new TorControl(
      { port, host: '127.0.0.1', auth: { type: TorControlAuthType.COOKIE, value: 'a'.repeat(64) } },
      config
    )
    tor = new Tor(
      config,
      '',
      { torPath: '', options: { env: { LD_LIBRARY_PATH: undefined, HOME: '' }, detached: false } },
      { torPassword: '', torHashedPassword: '' },
      { io: { emit: jest.fn() } } as unknown as ServerIoProviderTypes,
      control
    )
  })

  afterEach(async () => {
    await tor.onModuleDestroy()
    control.onModuleDestroy()
    for (const socket of sockets) socket.destroy()
    await new Promise<void>(resolve => server.close(() => resolve()))
    jest.restoreAllMocks()
  })

  const publish = () =>
    tor.waitForHiddenServicePublication({ targetPort: 4343, privKey: 'ED25519-V3:test-key', onionAddress: onion }, 100)

  it('resumes observation after a publication timeout without colliding with the accepted service', async () => {
    await expect(publish()).rejects.toThrow('Timeout while waiting for Tor HS_DESC')
    expect(live).toBe(true)
    publishOnQuery = 2
    await expect(publish()).resolves.toBe(`${onion}.onion`)
    expect(commands).toEqual(['ADD_ONION'])
    await publish()
    expect(queries).toBe(2)
    expect(adds).toBe(1)
  })

  it('rebinds an unknown detached service once before waiting for actual publication', async () => {
    live = true
    publishOnAttempt = 1
    await expect(publish()).resolves.toBe(`${onion}.onion`)
    expect(commands).toEqual([`DEL_ONION ${onion}`, 'ADD_ONION'])
    expect(live).toBe(true)
  })

  it('community launch does not wait for a descriptor, while explicit publication still does', async () => {
    tor.bootstrapped = true
    const params = { targetPort: 4343, virtPort: 80, privKey: 'ED25519-V3:test-key', onionAddress: onion }
    await tor.registerHiddenService(params)
    const deadline = Date.now() + 2000
    while (!live && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5))
    expect(live).toBe(true)
    const publication = tor.waitForHiddenServicePublication(params)
    let published = false
    void publication.then(() => {
      published = true
    })
    await new Promise(resolve => setTimeout(resolve, 150))
    expect(published).toBe(false)
    for (const subscriber of subscribers) subscriber.write(`650 HS_DESC UPLOADED ${onion} NO_AUTH hsdir\r\n`)
    await expect(publication).resolves.toBe(`${onion}.onion`)
    expect(commands).toEqual(['ADD_ONION'])
  })

  it('does not delete or retry a service whose ADD_ONION was rejected', async () => {
    rejectAdd = true
    await expect(publish()).rejects.toThrow('550 Onion address collision')
    expect(commands).toEqual(['ADD_ONION'])
  })

  it('does not delete or retry against a newer Tor session', async () => {
    afterAdd = () => tor.resetBootstrapState()
    await expect(publish()).rejects.toThrow()
    expect(commands).toEqual(['ADD_ONION'])
  })
})
