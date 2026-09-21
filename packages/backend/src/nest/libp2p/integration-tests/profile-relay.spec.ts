import { jest } from '@jest/globals'
import { type TestingModule } from '@nestjs/testing'
import { EventEmitter } from 'events'
import waitForExpect from 'wait-for-expect'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { type UserProfile } from '@quiet/types'

import { SigChainService } from '../../auth/sigchain.service'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { IpfsService } from '../../ipfs/ipfs.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { OrbitDbService } from '../../storage/orbitDb/orbitDb.service'
import { UserProfileStore } from '../../storage/userProfile/userProfile.store'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'

describe('Profile replication through an existing member', () => {
  jest.setTimeout(60_000)
  let modules: TestingModule[] = []
  let peers: Libp2pService[] = []
  const initializedStores = new Set<number>()

  afterEach(async () => {
    for (const peer of peers) peer.pauseDialQueue()
    for (let index = 0; index < modules.length; index += 1) {
      const module = modules[index]
      if (initializedStores.has(index)) {
        await module.get(UserProfileStore).close()
        await module.get(OrbitDbService).stop()
      }
      await peers[index].close(false)
      await module.get(IpfsService).stop()
      await peers[index].closeDatastore()
      await module.get(LocalDbService).close()
      await module.close()
    }
    initializedStores.clear()
    modules = []
    peers = []
  })

  it('relays a profile learned during heads exchange to a peer that is already connected', async () => {
    modules = await spawnTestModules(3)
    const chains = modules.map(module => module.get(SigChainService))
    peers = modules.map(module => module.get(Libp2pService))
    const profiles = modules.map(module => module.get(UserProfileStore))
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
    const initProfile = async (index: number) => {
      const module = modules[index]
      await module.get(OrbitDbService).create(module.get(IpfsService).ipfsInstance!)
      // Production clients have separate processes and event buses. Isolate
      // OrbitDB events here too, so another client's join cannot drive a relay.
      const events = jest.replaceProperty(OrbitDbService, 'events', new EventEmitter())
      try {
        await profiles[index].init()
      } finally {
        events.restore()
      }
      initializedStores.add(index)
      await profiles[index].setEntry(
        chains[index].user.userId,
        await factory.build<UserProfile>('UserProfile', {
          userId: chains[index].user.userId,
          nickname: ['Owner', 'ExistingGuest', 'ReturningGuest'][index],
          photo: undefined,
          profilePhoto: undefined,
        })
      )
    }
    const join = async (index: number) => {
      let joined = false
      peers[index].once(Libp2pEvents.AUTH_JOINED, () => {
        joined = true
      })
      await peers[index].dialPeer(peers[0].localAddress)
      await waitForExpect(() => expect(joined).toBe(true), 10_000)
    }

    await initProfile(0)
    await profiles[0].startSync()
    await join(1)
    await initProfile(1)
    await profiles[1].startSync()
    await waitForExpect(async () => {
      expect(await profiles[0].getUserProfiles()).toHaveLength(2)
      expect(await profiles[1].getUserProfiles()).toHaveLength(2)
    }, 10_000)

    await join(2)
    // The new client's profile is written before synchronization starts, as
    // happens during onboarding. Its owner learns it through heads exchange;
    // the existing guest has no direct connection to the new client.
    await initProfile(2)
    await profiles[2].startSync()
    await waitForExpect(async () => {
      expect(await profiles[0].getUserProfiles()).toHaveLength(3)
    }, 10_000)
    expect(peers[2].libp2pInstance!.getConnections(peers[1].libp2pInstance!.peerId)).toHaveLength(0)
    await waitForExpect(async () => {
      expect(await profiles[1].getUserProfiles()).toEqual(
        expect.arrayContaining([expect.objectContaining({ userId: chains[2].user.userId, nickname: 'ReturningGuest' })])
      )
    }, 10_000)
  })
})
