import { jest } from '@jest/globals'
import { headsAreEqual, Hash } from '@localfirst/crdx'
import { Test, TestingModule } from '@nestjs/testing'
import waitForExpect from 'wait-for-expect'

import { getBaseTypesFactory } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import { UserProfileStore } from '../../storage/userProfile/userProfile.store'
import { SigChainService } from '../../auth/sigchain.service'
import { Libp2pService } from '../../libp2p/libp2p.service'
import { IpfsService } from '../../ipfs/ipfs.service'
import { OrbitDbService } from '../../storage/orbitDb/orbitDb.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { spawnTestModules, spawnLibp2pInstancesInMemory } from '../../common/test-utils'
import { UserProfile } from '@quiet/types'
import { createLogger } from '../../common/logger'
import { Libp2pEvents } from '../libp2p.types'

const logger = createLogger('UserProfile-sync')
const N_PEERS = 3
jest.setTimeout(60000)

describe('UserProfileStore OrbitDB Sync', () => {
  let modules: TestingModule[] = []
  const userProfileStores: UserProfileStore[] = []
  const sigChainServices: SigChainService[] = []
  const libp2pServices: Libp2pService[] = []
  const ipfsServices: IpfsService[] = []
  const orbitDbServices: OrbitDbService[] = []
  const localDbServices: LocalDbService[] = []
  let factory: FactoryGirl
  let userIds: string[] = []
  let aliceProfile: UserProfile
  let bobProfile: UserProfile

  beforeAll(async () => {
    factory = await getBaseTypesFactory()
    modules = await spawnTestModules(N_PEERS)
    for (let i = 0; i < N_PEERS; i++) {
      sigChainServices.push(await modules[i].resolve(SigChainService))
      libp2pServices.push(await modules[i].resolve(Libp2pService))
      ipfsServices.push(await modules[i].resolve(IpfsService))
      orbitDbServices.push(await modules[i].resolve(OrbitDbService))
      localDbServices.push(await modules[i].resolve(LocalDbService))
    }
    // Create chains and users
    await sigChainServices[0].createChain('test-team', 'alice', true)
    const invite = sigChainServices[0].getActiveChain().invites.createLongLivedUserInvite()
    await sigChainServices[1].createChainFromInvite('bob', 'test-team', invite.seed, undefined, true)
    await sigChainServices[2].createChainFromInvite('charlie', 'test-team', invite.seed, undefined, true)
    // Set users in services
    userIds = [sigChainServices[0].user.userId, sigChainServices[1].user.userId, sigChainServices[2].user.userId]
    // Create libp2p, ipfs, orbitdb, userProfileStore
    await spawnLibp2pInstancesInMemory(modules)
    for (let i = 0; i < N_PEERS; i++) {
      await localDbServices[i].open()
      await ipfsServices[i].createInstance()
      await ipfsServices[i].start()
      await orbitDbServices[i].create(ipfsServices[i].ipfsInstance!)
      userProfileStores.push(await modules[i].resolve(UserProfileStore))
      await userProfileStores[i].init()
      libp2pServices[i].pauseDialQueue()
    }

    // Alice sets her profile
    aliceProfile = await factory.build('UserProfile', {
      userId: userIds[0],
      nickname: 'Alice',
      photo: undefined, // No photo for this test
    })
    // Bob sets his profile
    bobProfile = await factory.build('UserProfile', {
      userId: userIds[1],
      nickname: 'Bob',
      photo: undefined, // No photo for this test
    })
  })

  afterAll(async () => {
    for (let i = 0; i < N_PEERS; i++) {
      await userProfileStores[i].close()
      await orbitDbServices[i].stop()
      await ipfsServices[i].stop()
      await libp2pServices[i].close()
      await localDbServices[i].close()
    }
  })

  it('joins with an invitation', async () => {
    logger.info('joins with an invitation')
    const libp2pService = modules[0].get(Libp2pService)
    // Sequentially dial and wait for each peer to join
    for (let i = 1; i < modules.length; i++) {
      const peerLibp2pService = await modules[i].resolve(Libp2pService)
      await peerLibp2pService.dialPeer(libp2pService.localAddress)
      logger.info(`dialed peer ${i}`)
      // Wait for the peer to be connected (AUTH_JOINED)
      await new Promise<void>(resolve => {
        peerLibp2pService.once(Libp2pEvents.AUTH_JOINED, () => {
          logger.info(`peer ${i} connected`)
          resolve()
        })
      })
    }
  })

  it('merges graphs between all peers', async () => {
    logger.info('merges graphs between all peers')
    await new Promise<void>(resolve => {
      const resolveIfMet = async () => {
        // all peers should have the same graph head
        const heads: Hash[][] = []
        for (let i = 0; i < modules.length; i++) {
          const sigchainService = await modules[i].resolve(SigChainService)
          const head = sigchainService.getActiveChain().team?.graph.head
          if (head !== undefined) {
            heads.push(head)
            logger.info(`peer ${i} has head:`, head)
          }
        }
        if (heads.every(head => headsAreEqual(heads[0], head))) {
          logger.info('all peers have the same graph head')
          resolve()
        }
      }
      for (const libp2pService of modules.map(module => module.get(Libp2pService))) {
        libp2pService.on(Libp2pEvents.AUTH_UPDATED, () => {
          resolveIfMet()
        })
      }
      resolveIfMet()
    })
  }, 240_000)

  it('disconnects the last peer', async () => {
    expect(libp2pServices[0].connectedPeers.size).toBe(N_PEERS - 1)
    libp2pServices[0].hangUpPeer(libp2pServices[N_PEERS - 1].localAddress)
    await waitForExpect(async () => {
      expect(libp2pServices[N_PEERS - 1].connectedPeers.size).toBe(0)
      expect(libp2pServices[0].connectedPeers.size).toBe(N_PEERS - 2)
      expect(libp2pServices[1].connectedPeers.size).toBe(1)
    }, 2000)
  })

  it('starts sync on each peer', async () => {
    for (let i = 0; i < N_PEERS; i++) {
      await userProfileStores[i].startSync()
    }
  })

  it('each peer can update their own userProfile and it syncs', async () => {
    await userProfileStores[0].setEntry(userIds[0], aliceProfile)

    logger.info('Bob setting profile', bobProfile)
    await userProfileStores[1].setEntry(userIds[1], bobProfile)
    // Wait for sync
    await waitForExpect(
      async () => {
        const aliceProfiles = await userProfileStores[0].getUserProfiles()
        const bobProfiles = await userProfileStores[1].getUserProfiles()
        expect(aliceProfiles.length).toBe(2)
        expect(bobProfiles.length).toBe(2)
        expect(aliceProfiles.find(p => p.userId === userIds[1])?.nickname).toBe('Bob')
        expect(bobProfiles.find(p => p.userId === userIds[0])?.nickname).toBe('Alice')
      },
      10000,
      1000
    )
  })

  it("peer cannot update the other peer's userProfile", async () => {
    // Provide a valid base64 photo
    // Bob tries to update Alice's profile
    await userProfileStores[1].setEntry(userIds[0], bobProfile)

    await waitForExpect(
      async () => {
        // expect that both Alice and Bob have the maliciousProfile in their log (this is a bug)
        const aliceAllEntries: any[] = []
        for await (const entry of userProfileStores[0].getStore().log.traverse()) {
          aliceAllEntries.push(entry)
        }
        const bobAllEntries: any[] = []
        for await (const entry of userProfileStores[1].getStore().log.traverse()) {
          bobAllEntries.push(entry)
        }
        // TODO: after implementating the access control and identities, this should be 2
        expect(aliceAllEntries.length).toBe(3)
        expect(bobAllEntries.length).toBe(3)
      },
      5000,
      100
    )

    // Alice's profile remains unchanged in the index
    await waitForExpect(
      async () => {
        const aliceProfiles = await userProfileStores[0].getUserProfiles()
        const bobProfiles = await userProfileStores[1].getUserProfiles()
        expect(aliceProfiles.length).toBe(2)
        expect(bobProfiles.length).toBe(2)
        expect(aliceProfiles.find(p => p.userId === userIds[1])?.nickname).toBe('Bob')
        expect(bobProfiles.find(p => p.userId === userIds[0])?.nickname).toBe('Alice')
      },
      5000,
      1000
    )
  })

  it('each peer can update their own userProfile and it syncs again', async () => {
    // Alice updates her profile
    aliceProfile.nickname = 'Alice Updated'
    await userProfileStores[0].setEntry(userIds[0], aliceProfile)
    // Bob updates his profile
    bobProfile.nickname = 'Bob Updated'
    await userProfileStores[1].setEntry(userIds[1], bobProfile)
    // Wait for sync
    await waitForExpect(
      async () => {
        // expect that both Alice and Bob have the maliciousProfile in their log (this is a bug)
        const aliceAllEntries: any[] = []
        for await (const entry of userProfileStores[0].getStore().log.traverse()) {
          aliceAllEntries.push(entry)
        }
        const bobAllEntries: any[] = []
        for await (const entry of userProfileStores[1].getStore().log.traverse()) {
          bobAllEntries.push(entry)
        }
        // TODO: after implementating the access control and identities, this should be 2
        expect(aliceAllEntries.length).toBe(5) // 2 updates + 2 initial profiles + 1 malicious profile
        expect(bobAllEntries.length).toBe(5)
      },
      5000,
      100
    )

    // Check that profiles are updated
    await waitForExpect(
      async () => {
        const aliceProfiles = await userProfileStores[0].getUserProfiles()
        const bobProfiles = await userProfileStores[1].getUserProfiles()
        expect(aliceProfiles.length).toBe(2)
        expect(bobProfiles.length).toBe(2)
        expect(aliceProfiles.find(p => p.userId === userIds[0])?.nickname).toBe('Alice Updated')
        expect(bobProfiles.find(p => p.userId === userIds[1])?.nickname).toBe('Bob Updated')
      },
      10000,
      1000
    )
  })

  it('a new peer can join and sync profiles', async () => {
    expect(await userProfileStores[N_PEERS - 1].getUserProfiles()).toEqual([])
    for (let i = 0; i < N_PEERS - 1; i++) {
      await libp2pServices[N_PEERS - 1].dialPeer(libp2pServices[i].localAddress)
    }
    // wait for connnected peers on each to include the new peer
    await waitForExpect(
      async () => {
        expect(libp2pServices[N_PEERS - 1].connectedPeers.size).toBe(N_PEERS - 1)
      },
      10000,
      100
    )
    userProfileStores[N_PEERS - 1].startSync()

    await waitForExpect(
      async () => {
        for (let i = 0; i < N_PEERS; i++) {
          const profiles = await userProfileStores[i].getUserProfiles()
          expect(profiles.length).toBe(2)
          expect(profiles.find(p => p.userId === userIds[0])?.nickname).toBe('Alice Updated')
          expect(profiles.find(p => p.userId === userIds[1])?.nickname).toBe('Bob Updated')
        }
      },
      10000,
      1000
    )
  })
})
