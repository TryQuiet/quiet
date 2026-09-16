import { jest } from '@jest/globals'
import { type TestingModule } from '@nestjs/testing'
import { type Libp2p, type Upgrader } from '@libp2p/interface'
import { multiaddr } from '@multiformats/multiaddr'
import { headsAreEqual } from '@localfirst/crdx'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { type ChannelMessage, type PublicChannel } from '@quiet/types'
import waitForExpect from 'wait-for-expect'

import { SigChainService } from '../../auth/sigchain.service'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { IpfsService } from '../../ipfs/ipfs.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { ChannelsService } from '../../storage/channels/channels.service'
import { OrbitDbService } from '../../storage/orbitDb/orbitDb.service'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'

/**
 * Model a delayed remote close notification, as seen across a failed Tor
 * circuit. All bytes still pass through the real memory transport, Noise,
 * libp2p multiplexing and LFA. Only delivery of EOF/error and the transport
 * close timestamp to the first outbound connection is held until release.
 */
const delayFirstOutboundClose = (node: Libp2p): (() => void) => {
  const upgrader = (node as unknown as { components: { upgrader: Upgrader } }).components.upgrader
  const upgrade = upgrader.upgradeOutbound.bind(upgrader)
  let released = false
  let deliverClose: (() => void) | undefined
  let unblock!: () => void
  const release = new Promise<void>(resolve => {
    unblock = resolve
  })

  jest.spyOn(upgrader, 'upgradeOutbound').mockImplementationOnce(async (transport, options) => {
    const source = transport.source
    transport.source = (async function* () {
      try {
        yield* source
      } finally {
        await release
      }
    })()

    let timeline = transport.timeline
    Object.defineProperty(transport, 'timeline', {
      configurable: true,
      get: () => timeline,
      set: nextTimeline => {
        // The actual upgrader wraps this timeline to dispatch connection:close.
        // Delay before that wrapper, not at the auth or peer event handlers.
        timeline = new Proxy(nextTimeline, {
          set: (target, property, value) => {
            if (property === 'close' && !released) {
              deliverClose = () => Reflect.set(target, property, value)
              return true
            }
            return Reflect.set(target, property, value)
          },
        })
      },
    })
    return upgrade(transport, options)
  })

  return () => {
    released = true
    deliverClose?.()
    unblock()
  }
}

describe('Authenticated sync across overlapping physical connections', () => {
  jest.setTimeout(45_000)

  let modules: TestingModule[] = []
  let peers: Libp2pService[] = []
  let chains: SigChainService[] = []
  let channels: ChannelsService[] = []
  const initializedStores = new Set<number>()
  let releaseRemoteClose: (() => void) | undefined

  const initStores = async (index: number) => {
    const ipfs = modules[index].get(IpfsService)
    await modules[index].get(OrbitDbService).create(ipfs.ipfsInstance!)
    await channels[index].init()
    initializedStores.add(index)
  }

  beforeEach(async () => {
    modules = await spawnTestModules(2)
    peers = modules.map(module => module.get(Libp2pService))
    chains = modules.map(module => module.get(SigChainService))
    channels = modules.map(module => module.get(ChannelsService))
    await chains[0].createChain(true)
    const invitation = chains[0].getActiveChain().invites.createLongLivedUserInvite()
    await chains[1].createChainFromInvite({ seed: invitation.seed }, chains[0].activeTeamId!, true)
    await spawnLibp2pInstancesInMemory(modules)
    for (let index = 0; index < modules.length; index += 1) {
      peers[index].pauseDialQueue()
      await modules[index].get(LocalDbService).open()
      const ipfs = modules[index].get(IpfsService)
      await ipfs.createInstance()
      await ipfs.start()
    }
    await initStores(0)
  })

  afterEach(async () => {
    releaseRemoteClose?.()
    releaseRemoteClose = undefined
    for (const peer of peers) peer.pauseDialQueue()
    for (let index = 0; index < modules.length; index += 1) {
      if (initializedStores.has(index)) {
        await channels[index].close()
        await modules[index].get(OrbitDbService).stop()
      }
      await peers[index].close(false)
      await modules[index].get(IpfsService).stop()
      await peers[index].closeDatastore()
      await modules[index].get(LocalDbService).close()
      await modules[index].close()
    }
    jest.restoreAllMocks()
    initializedStores.clear()
    modules = []
  })

  it.each(['symmetric', 'asymmetric'] as const)(
    'keeps LFA and historical message sync working after %s closure of its old transport',
    async mode => {
      const nodes = peers.map(peer => peer.libp2pInstance!)
      if (mode === 'asymmetric') releaseRemoteClose = delayFirstOutboundClose(nodes[1])
      const connected = [0, 0]
      const disconnected = [0, 0]
      const identified = [new Set<string>(), new Set<string>()]
      peers.forEach((peer, index) => {
        peer.on(Libp2pEvents.AUTH_CONNECTED, () => {
          connected[index] += 1
        })
        nodes[index].addEventListener('peer:disconnect', () => {
          disconnected[index] += 1
        })
        nodes[index].addEventListener('peer:identify', event => {
          identified[index].add(event.detail.connection.id)
        })
      })

      const factory = await getBaseTypesFactory()
      const channel = await factory.build<PublicChannel>('PublicChannel', {
        name: 'general',
        owner: chains[0].user.userId,
        teamId: chains[0].activeTeamId!,
      })
      const founderChannel = await channels[0].createChannel(channel)
      const message = await factory.build<ChannelMessage>('ChannelMessage', {
        channelId: channel.id,
        userId: chains[0].user.userId,
        message: 'History created before either transport was replaced',
      })
      await founderChannel.sendMessage(message)
      await peers[1].dialPeer(peers[0].localAddress)
      await waitForExpect(() => expect(connected).toEqual([1, 1]), 10_000)
      await initStores(1)
      expect(await channels[1].getChannels()).toHaveLength(0)
      const original = nodes.map(node => node.getConnections()[0])

      if (mode === 'asymmetric') {
        // The founder observes failure first, while the joiner's real transport
        // still has not delivered its close. The founder starts a new session.
        original[0].abort(new Error('Original circuit closed at founder'))
        await waitForExpect(() => expect(nodes[0].getConnections()).toHaveLength(0), 5_000)
        expect(original[1].status).toBe('open')
        expect(disconnected).toEqual([1, 0])
      }

      // Bypass only the normal reuse of an existing connection. This opens a
      // second real Noise/multiplexed transport and runs actual identify/LFA.
      await nodes[0].dial(multiaddr(peers[1].localAddress), { force: true })
      await waitForExpect(() => {
        expect(nodes[0].getConnections()).toHaveLength(mode === 'symmetric' ? 2 : 1)
        expect(nodes[1].getConnections()).toHaveLength(2)
        for (let index = 0; index < nodes.length; index += 1) {
          const replacement = nodes[index].getConnections().find(connection => connection.id !== original[index].id)!
          expect(identified[index].has(replacement.id)).toBe(true)
        }
      }, 5_000)
      const replacements = nodes.map((node, index) =>
        node.getConnections().find(connection => connection.id !== original[index].id)!
      )
      expect(replacements.map(connection => connection.status)).toEqual(['open', 'open'])
      if (mode === 'asymmetric') {
        // The replacement has completed identify while the joiner still sees
        // its original transport as open, matching the production race.
        expect(original[0].status).toBe('closed')
        expect(original[1].status).toBe('open')
        expect(disconnected).toEqual([1, 0])
      }

      if (mode === 'symmetric') original[0].abort(new Error('Older overlapping transport closed'))
      else releaseRemoteClose!()
      await waitForExpect(() => {
        for (let index = 0; index < nodes.length; index += 1) {
          expect(original[index].status).toBe('closed')
          expect(nodes[index].getConnections().map(connection => connection.id)).toEqual([replacements[index].id])
        }
      }, 5_000)
      expect(disconnected).toEqual(mode === 'symmetric' ? [0, 0] : [1, 0])

      // A signed graph mutation requires a real LFA control exchange after the
      // old transport died. Gossip alone cannot satisfy this assertion.
      const authWrites = jest.spyOn(replacements[0], 'newStream')
      const role = 'added-after-overlap'
      chains[0].team.addRole(role)
      await waitForExpect(() => {
        expect(chains[1].team.hasRole(role)).toBe(true)
        expect(headsAreEqual(chains[0].team.graph.head, chains[1].team.graph.head)).toBe(true)
        expect(authWrites.mock.calls.some(([protocol]) => protocol.includes('/local-first-auth/1.0.0'))).toBe(true)
      }, 5_000)

      await channels[0].startSync()
      await channels[1].startSync()
      await founderChannel.startSync()
      await waitForExpect(async () => {
        const received = channels[1].channelsRepos.get(channel.id)
        expect(received).toBeDefined()
        expect(await received!.store.getEntries()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: message.id, userId: message.userId, message: message.message }),
          ])
        )
      }, 10_000)
      expect(disconnected[1]).toBe(0)
      expect(nodes[1].getConnections().map(connection => connection.id)).toEqual([replacements[1].id])
    }
  )
})
