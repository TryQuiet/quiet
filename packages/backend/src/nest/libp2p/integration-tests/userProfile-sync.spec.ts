import { jest } from '@jest/globals'
import { headsAreEqual, Hash } from '@localfirst/crdx'
import { TestingModule } from '@nestjs/testing'
import waitForExpect from 'wait-for-expect'
import { Entry, type LogEntry } from '@orbitdb/core'

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
import { EncryptedAndSignedPayload } from '../../auth/services/crypto/types'
import { OrbitDbOp } from '../../storage/orbitDb/orbitdb.types'

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

  const initOrbitDb = async (i: number) => {
    await orbitDbServices[i].create(ipfsServices[i].ipfsInstance!)
    await userProfileStores[i].init()
  }

  const getLogEntries = async (store: UserProfileStore): Promise<Array<LogEntry<EncryptedAndSignedPayload>>> => {
    const entries: Array<LogEntry<EncryptedAndSignedPayload>> = []
    for await (const entry of store.getStore().log.traverse()) {
      entries.push(entry as LogEntry<EncryptedAndSignedPayload>)
    }
    return entries
  }

  const expectAliceAndBobProfiles = async (aliceNickname: string, bobNickname: string) => {
    const aliceProfiles = await userProfileStores[0].getUserProfiles()
    const bobProfiles = await userProfileStores[1].getUserProfiles()
    expect(aliceProfiles.length).toBe(2)
    expect(bobProfiles.length).toBe(2)
    expect(aliceProfiles.find(p => p.userId === userIds[0])?.nickname).toBe(aliceNickname)
    expect(aliceProfiles.find(p => p.userId === userIds[1])?.nickname).toBe(bobNickname)
    expect(bobProfiles.find(p => p.userId === userIds[0])?.nickname).toBe(aliceNickname)
    expect(bobProfiles.find(p => p.userId === userIds[1])?.nickname).toBe(bobNickname)
  }

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
    await sigChainServices[0].createChain(true)
    const invite = sigChainServices[0].getActiveChain().invites.createLongLivedUserInvite()
    await sigChainServices[1].createChainFromInvite({ seed: invite.seed }, sigChainServices[0].activeTeamId!, true)
    await sigChainServices[2].createChainFromInvite({ seed: invite.seed }, sigChainServices[0].activeTeamId!, true)
    // Set users in services
    userIds = [sigChainServices[0].user.userId, sigChainServices[1].user.userId, sigChainServices[2].user.userId]
    // Create libp2p, ipfs, orbitdb, userProfileStore
    await spawnLibp2pInstancesInMemory(modules)
    for (let i = 0; i < N_PEERS; i++) {
      await localDbServices[i].open()
      await ipfsServices[i].createInstance()
      await ipfsServices[i].start()
      userProfileStores.push(await modules[i].resolve(UserProfileStore))
      if (i === 0) {
        await initOrbitDb(i)
      }
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
      await userProfileStores[i]?.close()
      await orbitDbServices[i]?.stop()
      await libp2pServices[i]?.close(false)
      await ipfsServices[i]?.stop()
      await libp2pServices[i]?.closeDatastore()
      await localDbServices[i]?.close()
    }
    for (const module of modules) {
      await module.close()
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
        peerLibp2pService.once(Libp2pEvents.AUTH_JOINED, async () => {
          logger.info(`peer ${i} connected`)
          await initOrbitDb(i)
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

  it("rejects adversarial attempts to overwrite another peer's userProfile", async () => {
    const aliceStore = userProfileStores[0].getStore()
    const bobStore = userProfileStores[1].getStore()
    const aliceEncryptedProfile = (await userProfileStores[0].getEncryptedEntries([userIds[0]]))[userIds[0]]
    if (aliceEncryptedProfile == null) {
      throw new Error("Alice's encrypted profile was not stored before adversarial overwrite attempts")
    }

    // Bob tries to write his own signed profile under Alice's key via the store API.
    await userProfileStores[1].setEntry(userIds[0], {
      ...bobProfile,
      nickname: 'Bob as Alice',
    })

    // Bob signs profile contents that claim Alice's userId and tries to store them under Alice's key.
    const bobSignedAliceProfile = await userProfileStores[1].encryptEntry({
      ...aliceProfile,
      userId: userIds[0],
      nickname: 'Alice overwritten by Bob',
    })
    await bobStore.put(userIds[0], bobSignedAliceProfile)

    // Bob replays Alice's legitimate encrypted payload from his own OrbitDB writer identity.
    await bobStore.put(userIds[0], aliceEncryptedProfile)

    // Bob serves a spoofed raw OrbitDB entry to Alice over the OrbitDB sync protocol.
    const currentBobHeadHashes = (await bobStore.log.heads()).map(
      (entry: LogEntry<EncryptedAndSignedPayload>) => entry.hash
    )
    const spoofedSyncEntry = await Entry.create<EncryptedAndSignedPayload>(
      bobStore.identity,
      bobStore.log.id,
      {
        op: OrbitDbOp.PUT,
        key: userIds[0],
        value: aliceEncryptedProfile,
      },
      undefined,
      currentBobHeadHashes
    )
    const aliceSyncErrors: Error[] = []
    const onAliceSyncError = (error: Error) => {
      aliceSyncErrors.push(error)
    }
    aliceStore.events.on('error', onAliceSyncError)
    try {
      await bobStore.sync.add(spoofedSyncEntry)
      await waitForExpect(
        async () => {
          expect(
            aliceSyncErrors.some(error => {
              const isAccessDenied = error.message.includes('Could not append entry')
              const isSpoofedWriter = error.message.includes(spoofedSyncEntry.identity)
              return isAccessDenied && isSpoofedWriter
            })
          ).toBe(true)
        },
        5000,
        100
      )
    } finally {
      aliceStore.events.off('error', onAliceSyncError)
    }

    await waitForExpect(
      async () => {
        expect(await getLogEntries(userProfileStores[0])).toHaveLength(2)
        expect(await getLogEntries(userProfileStores[1])).toHaveLength(2)
        await expectAliceAndBobProfiles('Alice', 'Bob')
      },
      5000,
      100
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
        expect(await getLogEntries(userProfileStores[0])).toHaveLength(4)
        expect(await getLogEntries(userProfileStores[1])).toHaveLength(4)
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
    expect(await userProfileStores[N_PEERS - 1].getEncryptedEntries()).toEqual({})

    const updatedSpies = userProfileStores.map(store => jest.fn())
    userProfileStores.forEach((store, idx) => {
      store.getStore().events.on('update', updatedSpies[idx])
    })

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
    await userProfileStores[N_PEERS - 1].startSync()

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

    await waitForExpect(
      async () => {
        // Ensure only the new peer emitted 'updated'
        for (let i = 0; i < N_PEERS - 1; i++) {
          expect(updatedSpies[i]).toHaveBeenCalledTimes(1)
        }
        logger.info('New peer updated:', updatedSpies[N_PEERS - 1].mock.calls.length, 'times')
        expect(updatedSpies[N_PEERS - 1]).toHaveBeenCalled()
      },
      5000,
      100
    )
  })
})
