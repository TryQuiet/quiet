import { jest } from '@jest/globals'
import { type TestingModule } from '@nestjs/testing'
import { multiaddr } from '@multiformats/multiaddr'
import waitForExpect from 'wait-for-expect'
import { createLibp2pAddress } from '@quiet/common'
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

describe('Initial profile replication after a bootstrap connection drops', () => {
  jest.setTimeout(60_000)

  let modules: TestingModule[] = []
  let chains: SigChainService[] = []
  let peers: Libp2pService[] = []
  let profiles: UserProfileStore[] = []
  let channels: ChannelsService[] = []
  let localDbs: LocalDbService[] = []
  const initializedStores = new Set<number>()

  const initStores = async (index: number) => {
    const ipfs = modules[index].get(IpfsService)
    await modules[index].get(OrbitDbService).create(ipfs.ipfsInstance!)
    await profiles[index].init()
    await channels[index].init()
    initializedStores.add(index)
    // These real OrbitDB stores start with synchronization disabled. Keeping
    // them stopped models the first connection dying before profiles arrive.
  }

  beforeEach(async () => {
    modules = await spawnTestModules(2)
    chains = modules.map(module => module.get(SigChainService))
    peers = modules.map(module => module.get(Libp2pService))
    profiles = modules.map(module => module.get(UserProfileStore))
    channels = modules.map(module => module.get(ChannelsService))
    localDbs = modules.map(module => module.get(LocalDbService))

    await chains[0].createChain(true)
    const invite = chains[0].getActiveChain().invites.createLongLivedUserInvite()
    await chains[1].createChainFromInvite({ seed: invite.seed }, chains[0].activeTeamId!, true)

    await spawnLibp2pInstancesInMemory(modules)
    for (let index = 0; index < modules.length; index += 1) {
      peers[index].pauseDialQueue()
      await localDbs[index].open()
      const ipfs = modules[index].get(IpfsService)
      await ipfs.createInstance()
      await ipfs.start()
    }
    await initStores(0)
  })

  afterEach(async () => {
    for (const peer of peers) peer.pauseDialQueue()
    for (let index = 0; index < modules.length; index += 1) {
      if (initializedStores.has(index)) {
        await profiles[index].close()
        await channels[index].close()
        await modules[index].get(OrbitDbService).stop()
      }
      await peers[index].close(false)
      await modules[index].get(IpfsService).stop()
      await peers[index].closeDatastore()
      await localDbs[index].close()
      await modules[index].close()
    }
    jest.restoreAllMocks()
    initializedStores.clear()
    modules = []
  })

  it('redials the admitted founder and replicates its profile and historical message', async () => {
    const factory = await getBaseTypesFactory()
    const founder = peers[0]
    const joiner = peers[1]
    const founderId = founder.libp2pInstance!.peerId.toString()
    const founderAddress = createLibp2pAddress(`${'a'.repeat(56)}.onion`, founderId)
    const transportDial = joiner.libp2pInstance!.dial.bind(joiner.libp2pInstance!)
    // Production peer sorting accepts onion addresses only. Resolve this one
    // onion fixture to the real memory listener at the transport boundary; the
    // complete storage, sorting, retry, LFA and OrbitDB paths remain unchanged.
    jest.spyOn(joiner.libp2pInstance!, 'dial').mockImplementation(async (address, options) => {
      return transportDial(address.toString() === founderAddress ? multiaddr(founder.localAddress) : address, options)
    })
    const founderUserId = chains[0].user.userId
    const joinerUserId = chains[1].user.userId
    const founderProfile = await factory.build<UserProfile>('UserProfile', {
      userId: founderUserId,
      nickname: 'Founder',
      photo: undefined,
      profilePhoto: undefined,
    })
    const joinerProfile = await factory.build<UserProfile>('UserProfile', {
      userId: joinerUserId,
      nickname: 'Joiner',
      photo: undefined,
      profilePhoto: undefined,
    })
    await profiles[0].setEntry(founderUserId, founderProfile)
    const channel = await factory.build<PublicChannel>('PublicChannel', {
      name: 'general',
      owner: founderUserId,
      teamId: chains[0].activeTeamId!,
    })
    const founderChannel = await channels[0].createChannel(channel)
    const message = await factory.build<ChannelMessage>('ChannelMessage', {
      channelId: channel.id,
      userId: founderUserId,
      message: 'Written before the joiner arrived',
    })
    await founderChannel.sendMessage(message)

    // Same bootstrap entry written by ConnectionsManager.joinCommunity. The
    // test uses libp2p's memory transport; LFA, storage, and dialing are real.
    await localDbs[1].updatePeerStats({
      [founderId]: {
        peerId: founderId,
        address: founderAddress,
        connectionTime: 0,
        lastSeen: Date.now() / 1000,
      },
    })
    const authConnectedCounts: number[] = [0, 0]
    peers.forEach((peer, index) =>
      peer.on(Libp2pEvents.AUTH_CONNECTED, () => {
        authConnectedCounts[index] += 1
      })
    )
    const storageReady = new Promise<void>((resolve, reject) => {
      joiner.once(Libp2pEvents.AUTH_JOINED, () => {
        void (async () => {
          await initStores(1)
          await profiles[1].setEntry(joinerUserId, joinerProfile)
          expect((await profiles[1].getUserProfiles()).map(profile => profile.userId)).toEqual([joinerUserId])
          // In the app this refresh is triggered by storage initialization,
          // before the founder's profile has arrived over the first connection.
          await modules[1].get(StorageService).updatePeerStore()
        })().then(resolve, reject)
      })
    })
    await joiner.dialPeer(founderAddress)
    await storageReady
    expect((await localDbs[1].getPeerStats(founderId))?.address).toBe(founderAddress)
    await waitForExpect(() => {
      expect(authConnectedCounts).toEqual([1, 1])
    }, 10_000)

    // Sever the actual transport, leaving both profile stores unreplicated.
    await founder.libp2pInstance!.hangUp(joiner.libp2pInstance!.peerId)
    await waitForExpect(() => {
      expect(joiner.connectedPeers.size).toBe(0)
      expect(founder.connectedPeers.size).toBe(0)
    }, 5_000)
    expect((await profiles[1].getUserProfiles()).map(profile => profile.userId)).toEqual([joinerUserId])
    expect(await channels[1].getChannels()).toHaveLength(0)

    await profiles[0].startSync()
    await profiles[1].startSync()
    await channels[0].startSync()
    await channels[1].startSync()
    await founderChannel.startSync()

    const dial = jest.spyOn(joiner, 'dialPeer')
    // Resume the actual replenish/TimedQueue path. Do not manually redial or
    // inject a profile: retaining the authenticated bootstrap is what makes
    // this eight-second retry and the subsequent encrypted sync possible.
    joiner.resumeDialQueue()
    await waitForExpect(() => {
      expect(dial).toHaveBeenCalledWith(founderAddress, { throwOnError: true, redialOnError: false })
      expect(authConnectedCounts[1]).toBe(2)
    }, 15_000)
    await waitForExpect(async () => {
      for (const store of profiles) {
        const replicatedProfiles = await store.getUserProfiles()
        expect(replicatedProfiles).toHaveLength(2)
        expect(replicatedProfiles).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ userId: founderUserId, nickname: 'Founder' }),
            expect.objectContaining({ userId: joinerUserId, nickname: 'Joiner' }),
          ])
        )
      }
      const recoveredChannel = channels[1].channelsRepos.get(channel.id)
      expect(recoveredChannel).toBeDefined()
      expect(await recoveredChannel!.store.getEntries()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: message.id, userId: founderUserId, message: message.message }),
        ])
      )
    }, 10_000)
    joiner.pauseDialQueue()
  })
})
