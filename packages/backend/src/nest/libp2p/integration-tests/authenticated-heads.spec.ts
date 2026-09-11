import { jest } from '@jest/globals'
import { type TestingModule } from '@nestjs/testing'
import { type Connection } from '@libp2p/interface'
import { EventEmitter } from 'events'
import { unpack } from 'msgpackr'
import waitForExpect from 'wait-for-expect'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { type ChannelMessage, type PublicChannel, type UserProfile } from '@quiet/types'

import { SigChainService } from '../../auth/sigchain.service'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { IpfsService } from '../../ipfs/ipfs.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { ChannelsService } from '../../storage/channels/channels.service'
import { OrbitDbService } from '../../storage/orbitDb/orbitDb.service'
import { StorageService } from '../../storage/storage.service'
import { UserProfileStore } from '../../storage/userProfile/userProfile.store'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'

describe('Database heads received before membership synchronization', () => {
  jest.setTimeout(60_000)
  let modules: TestingModule[] = []
  let peers: Libp2pService[] = []
  let releaseSync = () => {}
  const initializedStores = new Set<number>()

  afterEach(async () => {
    releaseSync()
    for (const peer of peers) peer.pauseDialQueue()
    for (const [index, module] of modules.entries()) {
      if (initializedStores.has(index)) {
        await module.get(UserProfileStore).close()
        await module.get(ChannelsService).close()
        await module.get(OrbitDbService).stop()
      }
      await peers[index].close(false)
      await module.get(IpfsService).stop()
      await peers[index].closeDatastore()
      await module.get(LocalDbService).close()
      await module.close()
    }
    jest.restoreAllMocks()
    initializedStores.clear()
    modules = []
    peers = []
  })

  it('retries validated profile and message history after the returning owner authenticates', async () => {
    modules = await spawnTestModules(3)
    const chains = modules.map(module => module.get(SigChainService))
    peers = modules.map(module => module.get(Libp2pService))
    const profiles = modules.map(module => module.get(UserProfileStore))
    const channels = modules.map(module => module.get(ChannelsService))
    await chains[0].createChain(true)
    const invite = chains[0].getActiveChain().invites.createLongLivedUserInvite()
    for (const chain of chains.slice(1)) {
      await chain.createChainFromInvite({ seed: invite.seed }, chains[0].activeTeamId!, true)
    }
    await spawnLibp2pInstancesInMemory(modules)
    for (const [index, module] of modules.entries()) {
      peers[index].pauseDialQueue()
      await module.get(LocalDbService).open()
      await module.get(IpfsService).createInstance()
      await module.get(IpfsService).start()
    }
    const factory = await getBaseTypesFactory()
    const initStores = async (index: number) => {
      const module = modules[index]
      await module.get(OrbitDbService).create(module.get(IpfsService).ipfsInstance!)
      const events = jest.replaceProperty(OrbitDbService, 'events', new EventEmitter())
      try {
        await profiles[index].init()
        await channels[index].init()
      } finally {
        events.restore()
      }
      initializedStores.add(index)
      module.get(StorageService).attachStoreListeners()
      await profiles[index].setEntry(
        chains[index].user.userId,
        await factory.build<UserProfile>('UserProfile', {
          userId: chains[index].user.userId,
          nickname: ['Owner', 'ExistingGuest', 'NewGuest'][index],
          photo: undefined,
          profilePhoto: undefined,
        })
      )
      await profiles[index].startSync()
      await channels[index].startSync()
    }
    const join = async (index: number, through: number) => {
      let joined = false
      peers[index].once(Libp2pEvents.AUTH_JOINED, () => {
        joined = true
      })
      await peers[index].dialPeer(peers[through].localAddress)
      await waitForExpect(() => expect(joined).toBe(true), 10_000)
    }
    await initStores(0)
    const channel = await factory.build<PublicChannel>('PublicChannel', {
      name: 'general',
      owner: chains[0].user.userId,
      teamId: chains[0].activeTeamId!,
    })
    const ownerChannel = await channels[0].createChannel(channel)
    await ownerChannel.startSync()
    await join(1, 0)
    await initStores(1)
    await waitForExpect(async () => {
      expect(await profiles[0].getUserProfiles()).toHaveLength(2)
      expect(channels[1].channelsRepos.has(channel.id)).toBe(true)
    }, 10_000)

    await peers[0].libp2pInstance!.hangUp(peers[1].libp2pInstance!.peerId)
    await waitForExpect(() => expect(peers[0].connectedPeers.size).toBe(0), 5_000)
    await join(2, 1)
    await initStores(2)
    await waitForExpect(async () => {
      expect(await profiles[1].getUserProfiles()).toHaveLength(3)
      expect(channels[2].channelsRepos.has(channel.id)).toBe(true)
    }, 10_000)
    const message = await factory.build<ChannelMessage>('ChannelMessage', {
      channelId: channel.id,
      userId: chains[2].user.userId,
      message: 'Sent while the owner was offline',
    })
    await channels[2].channelsRepos.get(channel.id)!.store.sendMessage(message)
    await waitForExpect(async () => {
      expect(await channels[1].channelsRepos.get(channel.id)!.store.getEntries()).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: message.id })])
      )
    }, 10_000)

    // Delay only real LFA SYNC packets at the transport boundary. OrbitDB is
    // free to exchange its encrypted heads against the owner's older graph.
    const syncGate = new Promise<void>(resolve => {
      releaseSync = resolve
    })
    const auth = peers[1].libp2pInstance!.services.auth as any
    const send = auth.sendMessage.bind(auth)
    jest.spyOn(auth, 'sendMessage').mockImplementation(async (...args: unknown[]) => {
      const [connection, bytes] = args as [Connection, Uint8Array]
      if (connection.remotePeer.equals(peers[0].libp2pInstance!.peerId) && unpack(bytes).type === 'SYNC') {
        await syncGate
      }
      return send(connection, bytes)
    })
    const ownerMessageDb = (ownerChannel as any).store
    const joinEntry = ownerMessageDb.log.joinEntry.bind(ownerMessageDb.log)
    let rejected = false
    jest.spyOn(ownerMessageDb.log, 'joinEntry').mockImplementation(async (...args: unknown[]) => {
      try {
        return await joinEntry(...args)
      } catch (error) {
        rejected = true
        throw error
      }
    })
    let authenticated = false
    peers[0].once(Libp2pEvents.AUTH_CONNECTED, () => {
      authenticated = true
    })
    await peers[0].dialPeer(peers[1].localAddress)
    await waitForExpect(() => expect(rejected).toBe(true), 10_000)
    expect(authenticated).toBe(false)
    expect(await ownerChannel.getEntries()).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: message.id })])
    )
    releaseSync()
    await waitForExpect(() => expect(authenticated).toBe(true), 10_000)
    await waitForExpect(async () => {
      expect(await profiles[0].getUserProfiles()).toHaveLength(3)
      expect(await ownerChannel.getEntries()).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: message.id })])
      )
    }, 10_000)

    // QSS disables P2P database synchronization. An auth connection must not
    // restart it or send database heads while those subscriptions are stopped.
    const orbitDb = modules[0].get(OrbitDbService)
    await orbitDb.stopSync()
    await waitForExpect(() => expect(orbitDb['peerResyncs'].size).toBe(0), 5_000)
    const dial = jest.spyOn(peers[0].libp2pInstance!, 'dialProtocol')
    await orbitDb.resyncPeer(peers[1].libp2pInstance!.peerId)
    expect(dial).not.toHaveBeenCalled()
  })
})
