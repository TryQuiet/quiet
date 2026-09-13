import { jest } from '@jest/globals'
import { type TestingModule } from '@nestjs/testing'
import { type Connection, type PeerId, type Stream, type Topology } from '@libp2p/interface'
import { type IncomingStreamData } from '@libp2p/interface-internal'
import { multiaddr } from '@multiformats/multiaddr'
import waitForExpect from 'wait-for-expect'
import { SigChainService } from '../auth/sigchain.service'
import { LFAEvents } from '../auth/types'
import { spawnTestModules } from '../common/test-utils'
import { libp2pInstanceParams } from '../common/utils'
import { QSSService } from '../qss/qss.service'
import { LocalDbService } from '../local-db/local-db.service'
import { JoinStatus, Libp2pAuth, type Libp2pAuthComponents } from './libp2p.auth'
import { Libp2pService, Libp2pState } from './libp2p.service'
import { Libp2pEvents } from './libp2p.types'
import { UNKNOWN_THIS_PEER } from './libp2p.const'

/** Real LFA and adapter streams, with independent transport-close notification on each side. */
describe('LFA transport ownership', () => {
  let modules: TestingModule[]
  let auth: Libp2pAuth[]
  let peers: PeerId[]
  let services: Libp2pService[]
  let events: EventTarget[]
  let connections: Connection[][]
  let topology: Topology[]
  let incoming: Array<(data: IncomingStreamData) => unknown>
  let connected: number[]
  let nextPair: number

  const closeSide = (index: number, connection: Connection) => {
    connection.status = 'closed'
    events[index].dispatchEvent(new CustomEvent('connection:close', { detail: connection }))
    if (!connections[index].some(candidate => candidate.status === 'open')) {
      topology[index].onDisconnect?.(connection.remotePeer)
    }
  }

  const connect = async (dropMessages = false) => {
    const pairId = nextPair++
    const pair: Connection[] = []
    for (let index = 0; index < 2; index += 1) {
      const remote = 1 - index
      const connection = {
        id: `${index}:${pairId}`,
        remotePeer: peers[remote],
        remoteAddr: multiaddr(`/memory/${remote}/p2p/${peers[remote]}`),
        direction: index === 0 ? 'outbound' : 'inbound',
        status: 'open',
        newStream: jest.fn(async () => {
          if (connection.status !== 'open') throw new Error('connection is closed')
          return {
            status: 'open',
            source: [],
            sink: async (source: AsyncIterable<Uint8Array>) => {
              const chunks = []
              for await (const chunk of source) chunks.push(chunk)
              if (dropMessages) return
              await incoming[remote]({
                connection: pair[remote],
                stream: {
                  source: (async function* () {
                    yield* chunks
                  })(),
                  sink: async () => {},
                  close: async () => {},
                } as unknown as Stream,
              })
            },
            close: async () => {},
          } as unknown as Stream
        }),
        close: async () => closeSide(index, pair[index]),
      } as unknown as Connection
      pair.push(connection)
      connections[index].push(connection)
    }
    await Promise.all(pair.map((connection, index) => topology[index].onConnect?.(connection.remotePeer, connection)))
    return pair
  }

  beforeEach(async () => {
    modules = await spawnTestModules(2)
    services = modules.map(module => module.get(Libp2pService))
    const chains = modules.map(module => module.get(SigChainService))
    await chains[0].createChain(true)
    const invite = chains[0].getActiveChain().invites.createLongLivedUserInvite()
    await chains[1].createChainFromInvite({ seed: invite.seed }, chains[0].activeTeamId!, true)
    peers = await Promise.all([0, 1].map(async () => (await libp2pInstanceParams()).peerId.peerId))
    events = [new EventTarget(), new EventTarget()]
    connections = [[], []]
    topology = []
    incoming = []
    connected = [0, 0]
    nextPair = 0
    auth = modules.map((module, index) => {
      // The auth service only ever runs inside a started libp2p; it refuses
      // sessions while the service is stopped, paused or stopping.
      services[index].state = Libp2pState.Started
      services[index].on(Libp2pEvents.AUTH_CONNECTED, () => connected[index]++)
      const components = {
        peerId: peers[index],
        events: events[index],
        connectionManager: { getConnections: () => connections[index].filter(conn => conn.status === 'open') },
        registrar: {
          register: async (_protocol: string, handler: Topology) => {
            topology[index] = handler
            return 'auth'
          },
          handle: async (_protocol: string, handler: (data: IncomingStreamData) => unknown) => {
            incoming[index] = handler
          },
          unregister: () => {},
          unhandle: async () => {},
        },
      } as unknown as Libp2pAuthComponents
      return new Libp2pAuth(chains[index], module.get(QSSService), services[index], components)
    })
    await Promise.all(auth.map(service => service.start()))
  })

  afterEach(async () => {
    await Promise.all(auth.map(service => service.stop()))
    for (const module of modules) await module.close()
    jest.restoreAllMocks()
  })

  it('authenticates overlapping transports independently and retains the surviving session after old close', async () => {
    const original = await connect()
    await waitForExpect(() => expect(connected).toEqual([1, 1]), 5_000)
    const replacement = await connect()
    await waitForExpect(() => expect(connected).toEqual([2, 2]), 5_000)

    closeSide(0, original[0])
    closeSide(1, original[1])
    // Delayed peer-level callbacks must not clear sessions on a live replacement.
    topology[0].onDisconnect?.(peers[1])
    topology[1].onDisconnect?.(peers[0])
    for (let index = 0; index < 2; index += 1) {
      const sessions = auth[index]['authConnections']
      expect(sessions.size).toBe(1)
      expect(sessions.has(replacement[index].id)).toBe(true)
      const sendCount = jest.mocked(replacement[index].newStream).mock.calls.length
      sessions.get(replacement[index].id)!.send('replacement remains authenticated')
      await waitForExpect(() =>
        expect(jest.mocked(replacement[index].newStream).mock.calls.length).toBeGreaterThan(sendCount)
      )
    }
    await Promise.all(auth.map(service => service.stop()))
    await topology[0].onConnect?.(peers[1], replacement[0])
    for (const service of auth) {
      expect(service['authConnections'].size).toBe(0)
      expect(service['peerConnections'].size).toBe(0)
    }
  })

  it('recovers when one side replaces its dead session while the other still sees the old transport as open', async () => {
    const original = await connect()
    await waitForExpect(() => expect(connected).toEqual([1, 1]), 5_000)
    closeSide(0, original[0])
    const replacement = await connect()
    await waitForExpect(() => expect(connected).toEqual([2, 2]), 5_000)
    closeSide(1, original[1])
    expect(auth[1]['authConnections'].size).toBe(1)
    expect(auth[1]['peerConnections'].get(replacement[1].id)).toBe(replacement[1])
  })

  it('starts a buffered replacement when the original join transport dies before acceptance', async () => {
    const original = await connect(true)
    const replacement = await connect()
    expect(auth[1]['bufferedConnections'].map(item => item.connection.id)).toContain(replacement[1].id)
    closeSide(0, original[0])
    closeSide(1, original[1])
    await waitForExpect(() => expect(connected).toEqual([1, 1]), 5_000)
    expect(auth[1]['bufferedConnections']).toHaveLength(0)
    expect(auth[1]['peerConnections'].get(replacement[1].id)).toBe(replacement[1])
  })

  it('keeps accepted admission exclusive through transport loss until its real durable write completes', async () => {
    const db = modules[1].get(LocalDbService)
    const write = db.setSigChainFromTeam.bind(db)
    let release!: () => void
    const held = new Promise<void>(resolve => {
      release = resolve
    })
    let entered!: () => void
    const writing = new Promise<void>(resolve => {
      entered = resolve
    })
    let firstWrite = true
    jest.spyOn(db, 'setSigChainFromTeam').mockImplementation(async (...args) => {
      if (firstWrite) {
        firstWrite = false
        entered()
        await held
      }
      return write(...args)
    })
    const joined = jest.fn()
    services[1].on(Libp2pEvents.AUTH_JOINED, joined)
    try {
      const original = await connect()
      await writing
      expect(auth[1]['joinStatus']).toBe(JoinStatus.JOINING)
      expect(modules[1].get(SigChainService).getActiveChain().team).toBeDefined()
      closeSide(0, original[0])
      closeSide(1, original[1])
      // closeSide also delivers the later peer-disconnect callback when the
      // original was the last transport, matching the actual registrar order.
      expect(auth[1]['joinStatus']).toBe(JoinStatus.JOINING)
      const replacement = await connect()
      expect(auth[1]['bufferedConnections'].map(item => item.connection.id)).toContain(replacement[1].id)
      expect(auth[1]['authConnections'].has(replacement[1].id)).toBe(false)
      expect(joined).not.toHaveBeenCalled()
      const connectedBeforeWrite = connected[1]
      release()
      await waitForExpect(() => {
        expect(joined).toHaveBeenCalledTimes(1)
        expect(auth[1]['joinStatus']).toBe(JoinStatus.JOINED)
        expect(auth[1]['bufferedConnections']).toHaveLength(0)
        expect(connected[1]).toBeGreaterThan(connectedBeforeWrite)
      }, 5_000)
      const teamId = modules[1].get(SigChainService).activeTeamId!
      expect((await db.getSigChain(teamId))?.serializedTeam).toBeDefined()
    } finally {
      release()
    }
  })

  it.each([
    { eventType: 'LOCAL_ERROR', type: 'TIMEOUT', message: undefined },
    { eventType: 'LOCAL_ERROR', type: 'MEMBER_REMOVED', message: undefined },
    { eventType: 'ERROR', type: 'DEVICE_UNKNOWN', message: UNKNOWN_THIS_PEER },
  ])('closes only the failing auth transport for $eventType/$type', async ({ eventType, type, message }) => {
    const original = await connect()
    await waitForExpect(() => expect(connected).toEqual([1, 1]), 5_000)
    const replacement = await connect()
    await waitForExpect(() => expect(connected).toEqual([2, 2]), 5_000)
    services[0]['authService'] = auth[0]
    services[0].state = Libp2pState.Started
    const redial = jest.spyOn(services[0], 'redialPeerAfterDelay').mockResolvedValue(undefined)
    const hangUpPeer = jest.spyOn(services[0], 'hangUpPeer')
    const deletePeer = jest.fn(async () => {})
    services[0].connectedPeers.set(peers[1].toString(), {
      peerId: peers[1].toString(),
      address: original[0].remoteAddr.toString(),
      connectedAtSeconds: 1,
    })
    services[0].libp2pInstance = {
      getConnections: () => connections[0].filter(connection => connection.status === 'open'),
      hangUp: async () => connections[0].forEach(connection => closeSide(0, connection)),
      peerStore: { delete: deletePeer },
    } as any
    try {
      services[0].emit(Libp2pEvents.AUTH_DISCONNECTED, {
        event: { type: eventType, payload: { type, message } },
        connection: original[0],
      })
      await waitForExpect(() => expect(original[0].status).toBe('closed'))
      expect(replacement[0].status).toBe('open')
      expect(auth[0]['authConnections'].has(replacement[0].id)).toBe(true)
      expect(redial).not.toHaveBeenCalled()
      expect(hangUpPeer).not.toHaveBeenCalled()
      expect(deletePeer).not.toHaveBeenCalled()
    } finally {
      services[0].libp2pInstance = null
      services[0].state = Libp2pState.Stopped
    }
  })

  it('sends the requested protocol disconnect on the same transport before retiring it', async () => {
    const pair = await connect()
    await waitForExpect(() => expect(connected).toEqual([1, 1]), 5_000)
    const disconnected = jest.fn()
    auth[1]['authConnections'].get(pair[1].id)!.on(LFAEvents.DISCONNECTED, disconnected)
    auth[0].closeAuthConnection(peers[1], true)
    await waitForExpect(() =>
      expect(disconnected).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'DISCONNECT', index: expect.any(Number) })
      )
    )
    expect(auth[0]['authConnections'].size).toBe(0)
    expect(auth[0]['peerConnections'].size).toBe(0)
  })

  it('cleans every owned session when stopping one of them throws', async () => {
    const original = await connect()
    await waitForExpect(() => expect(connected).toEqual([1, 1]), 5_000)
    const replacement = await connect()
    await waitForExpect(() => expect(connected).toEqual([2, 2]), 5_000)
    const failedSession = auth[0]['authConnections'].get(original[0].id)!
    const stop = jest.spyOn(failedSession, 'stop').mockImplementation(() => {
      throw new Error('session stop failed')
    })
    const remainingStop = jest.spyOn(auth[0]['authConnections'].get(replacement[0].id)!, 'stop')
    try {
      auth[0].closeAuthConnection(peers[1], false)
      expect(remainingStop).toHaveBeenCalledWith(false)
      expect(auth[0]['authConnections'].size).toBe(0)
      expect(auth[0]['peerConnections'].size).toBe(0)
    } finally {
      stop.mockRestore()
      failedSession.stop(false)
    }
  })
})
