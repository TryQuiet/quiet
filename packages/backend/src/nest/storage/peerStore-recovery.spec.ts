import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import { multiaddr } from '@multiformats/multiaddr'
import { type Member } from '@localfirst/auth'
import { createLibp2pAddress } from '@quiet/common'
import { type NetworkStats, type UserProfile } from '@quiet/types'
import waitForExpect from 'wait-for-expect'
import { TestModule } from '../common/test.module'
import { libp2pInstanceParams } from '../common/utils'
import { SigChainService } from '../auth/sigchain.service'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { Libp2pService } from '../libp2p/libp2p.service'
import { LocalDbService } from '../local-db/local-db.service'
import { StorageModule } from './storage.module'
import { StorageService } from './storage.service'
import { UserProfileStore } from './userProfile/userProfile.store'

describe('Peer address recovery while profiles replicate', () => {
  let module: TestingModule
  let storage: StorageService
  let libp2p: Libp2pService
  let db: LocalDbService
  let sigchain: SigChainService
  let profiles: UserProfile[]
  let members: Member[]
  let bootstrap: NetworkStats & {
    authenticatedIdentity: { teamId: string; userId: string; deviceId: string }
  }
  let remotePeer: Awaited<ReturnType<typeof libp2pInstanceParams>>['peerId']['peerId']

  beforeEach(async () => {
    module = await Test.createTestingModule({ imports: [TestModule, StorageModule, Libp2pModule] }).compile()
    storage = await module.resolve(StorageService)
    libp2p = await module.resolve(Libp2pService)
    db = await module.resolve(LocalDbService)
    sigchain = await module.resolve(SigChainService)
    await db.open()
    await sigchain.createChain(true)
    const local = await libp2pInstanceParams()
    local.localAddress = createLibp2pAddress(`${'c'.repeat(56)}.onion`, local.peerId.peerId.toString())
    await libp2p.createInstance(local)
    libp2p.pauseDialQueue()
    remotePeer = (await libp2pInstanceParams()).peerId.peerId
    const remoteId = remotePeer.toString()
    const team = sigchain.getActiveChain().team!
    members = [...team.members(), { userId: 'founder', devices: [{ deviceId: 'founder-device' }] } as Member]
    jest.spyOn(team, 'members').mockImplementation(() => members as any)
    profiles = [
      {
        userId: sigchain.user.userId,
        nickname: 'joining-user',
        userData: { peerId: local.peerId.peerId.toString(), onionAddress: `${'c'.repeat(56)}.onion` },
      },
    ]
    jest.spyOn(await module.resolve(UserProfileStore), 'getUserProfiles').mockImplementation(async () => profiles)
    bootstrap = {
      peerId: remoteId,
      address: createLibp2pAddress(`${'a'.repeat(56)}.onion`, remoteId),
      lastSeen: 100,
      connectionTime: 5,
      authenticatedIdentity: { teamId: team.id, userId: 'founder', deviceId: 'founder-device' },
    }
    await db.setPeerStats({ [remoteId]: bootstrap })
  })

  afterEach(async () => {
    libp2p.pauseDialQueue()
    jest.restoreAllMocks()
    await libp2p.close()
    await db.close()
    await module.close()
  })

  it('retains an authenticated bootstrap target and actually redials after disconnect before its profile arrives', async () => {
    const remoteId = remotePeer.toString()
    const node = libp2p.libp2pInstance!
    const dial = jest.spyOn(node, 'dial').mockResolvedValue({} as any)
    libp2p.connectedPeers.set(remoteId, {
      peerId: remoteId,
      address: bootstrap.address!,
      connectedAtSeconds: Date.now() / 1000,
    })

    // The authenticated founder's profile has not replicated yet. This is the
    // real storage refresh that previously removed the sole bootstrap address.
    await storage.updatePeerStore()
    expect(await db.getPeerStats(remoteId)).toMatchObject(bootstrap)

    node.dispatchEvent(new CustomEvent('peer:disconnect', { detail: remotePeer }))
    await waitForExpect(() => expect(libp2p.connectedPeers.has(remoteId)).toBe(false))
    libp2p.resumeDialQueue()
    await libp2p.addPeersToDialQueue()
    await waitForExpect(() => expect(dial).toHaveBeenCalledWith(multiaddr(bootstrap.address!)), 5_000, 20)

    profiles.push({
      userId: 'founder',
      nickname: 'founder',
      userData: { peerId: remoteId, onionAddress: `${'b'.repeat(56)}.onion` },
    })
    await storage.updatePeerStore()
    expect(await db.getPeerStats(remoteId)).toMatchObject({
      address: createLibp2pAddress(`${'b'.repeat(56)}.onion`, remoteId),
      authenticatedIdentity: bootstrap.authenticatedIdentity,
    })
  })

  it.each(['removed-member', 'removed-device', 'wrong-team', 'unauthenticated'])(
    'does not preserve or schedule a bootstrap address for %s',
    async invalid => {
      const remoteId = remotePeer.toString()
      if (invalid === 'removed-member') members = members.filter(member => member.userId !== 'founder')
      if (invalid === 'removed-device') members.find(member => member.userId === 'founder')!.devices = []
      if (invalid === 'wrong-team') bootstrap.authenticatedIdentity.teamId = 'different-team'
      if (invalid === 'unauthenticated') delete (bootstrap as Partial<typeof bootstrap>).authenticatedIdentity
      await db.setPeerStats({ [remoteId]: bootstrap })
      const dial = jest.spyOn(libp2p.libp2pInstance!, 'dial').mockResolvedValue({} as any)

      await storage.updatePeerStore()
      expect(await db.getPeerStats(remoteId)).toBeNull()
      await libp2p.addPeersToDialQueue()
      expect(await db.getSortedPeers(false)).not.toContain(bootstrap.address)
      expect(dial).not.toHaveBeenCalled()
    }
  )

  it('does not execute an already queued redial after that member is removed', async () => {
    const dial = jest.spyOn(libp2p.libp2pInstance!, 'dial').mockResolvedValue({} as any)
    libp2p.resumeDialQueue()
    await libp2p.redialPeerAfterDelay(bootstrap.address!, 50)
    members = members.filter(member => member.userId !== 'founder')
    await waitForExpect(() => expect(libp2p['redialQueue'].hasTask(bootstrap.address!)).toBe(false), 2_000, 20)
    expect(dial).not.toHaveBeenCalled()
  })
})
