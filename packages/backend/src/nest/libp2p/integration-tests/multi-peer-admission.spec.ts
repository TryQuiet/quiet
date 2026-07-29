import { TestingModule } from '@nestjs/testing'
import waitForExpect from 'wait-for-expect'
import { SigChainService } from '../../auth/sigchain.service'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'

const ADMISSION_TIMEOUT = 20_000

describe('Libp2pAuth admission through multiple peers', () => {
  it('admits a member once and leaves the second concurrent acceptor divergent', async () => {
    await withThreePeers(async peers => {
      const owner = await peers[0].sigchain.createChain(true)
      const existingMemberInvite = owner.invites.createLongLivedUserInvite()
      const pendingMemberInvite = owner.invites.createLongLivedUserInvite()

      await peers[1].sigchain.createChainFromInvite(
        { name: 'Existing member', seed: existingMemberInvite.seed },
        owner.team!.id,
        true
      )
      await peers[2].sigchain.createChainFromInvite(
        { name: 'Pending member', seed: pendingMemberInvite.seed },
        owner.team!.id,
        true
      )
      await startLibp2p(peers)

      await dialAndWaitForJoin(peers[1].libp2p, peers[0].libp2p, 'Existing member admission timed out')
      await disconnectPeers(peers[0].libp2p, peers[1].libp2p)

      const pendingMemberId = peers[2].sigchain.activeChain.user.userId
      const joinedEvents = await dialInviteeThroughBothAcceptors(peers[2].libp2p, peers[0].libp2p, peers[1].libp2p)

      expect(joinedEvents).toBe(1)
      expect(peers[2].libp2p.connectedPeers.size).toBe(2)
      await expectBufferedConnectionsResumed(peers[2])
      await expectOneAdmissionAndDivergentAcceptor(peers, 'ADMIT_MEMBER', pendingMemberId)
    })
  })

  it('admits a device once and leaves the second concurrent acceptor divergent', async () => {
    await withThreePeers(async peers => {
      const owner = await peers[0].sigchain.createChain(true)
      const existingMemberInvite = owner.invites.createLongLivedUserInvite()
      const pendingDeviceInvite = owner.invites.createDeviceInvite()

      await peers[1].sigchain.createChainFromInvite(
        { name: 'Existing member', seed: existingMemberInvite.seed },
        owner.team!.id,
        true
      )
      await peers[2].sigchain.createChainFromDeviceInvite(
        {
          seed: pendingDeviceInvite.seed,
          userName: pendingDeviceInvite.userName,
          deviceName: 'Pending linked device',
          expectedTeamId: owner.team!.id,
          expectedUserId: pendingDeviceInvite.userId,
        },
        owner.team!.id,
        true
      )
      await startLibp2p(peers)

      await dialAndWaitForJoin(peers[1].libp2p, peers[0].libp2p, 'Existing member admission timed out')
      await disconnectPeers(peers[0].libp2p, peers[1].libp2p)

      const pendingDeviceId = peers[2].sigchain.activeChain.device.deviceId
      const joinedEvents = await dialInviteeThroughBothAcceptors(peers[2].libp2p, peers[0].libp2p, peers[1].libp2p)

      expect(joinedEvents).toBe(1)
      expect(peers[2].sigchain.activeChain.isPendingDeviceAdmission).toBe(false)
      expect(peers[2].libp2p.connectedPeers.size).toBe(2)
      await expectBufferedConnectionsResumed(peers[2])
      await expectOneAdmissionAndDivergentAcceptor(peers, 'ADMIT_DEVICE', pendingDeviceId)
    })
  })
})

type TestPeer = {
  module: TestingModule
  sigchain: SigChainService
  libp2p: Libp2pService
}

type AdmissionGraphLink = {
  hash: string
  body: {
    type: string
    payload?: {
      memberKeys?: { name: string }
      device?: { deviceId: string }
    }
  }
}

const withThreePeers = async (test: (peers: TestPeer[]) => Promise<void>) => {
  const modules = await spawnTestModules(3)
  const peers = await Promise.all(
    modules.map(async module => ({
      module,
      sigchain: await module.resolve(SigChainService),
      libp2p: await module.resolve(Libp2pService),
    }))
  )

  try {
    await test(peers)
  } finally {
    for (const peer of peers) {
      await peer.libp2p.close()
      await peer.module.close()
    }
  }
}

const startLibp2p = async (peers: TestPeer[]) => {
  await spawnLibp2pInstancesInMemory(peers.map(peer => peer.module))
}

const dialAndWaitForJoin = async (joiningPeer: Libp2pService, acceptingPeer: Libp2pService, timeoutMessage: string) => {
  const joined = waitForEvent(joiningPeer, Libp2pEvents.AUTH_JOINED, timeoutMessage)
  await joiningPeer.dialPeer(acceptingPeer.localAddress)
  await joined
}

const disconnectPeers = async (left: Libp2pService, right: Libp2pService) => {
  await left.hangUpPeer(right.localAddress)
  await waitForExpect(() => {
    expect(left.connectedPeers.size).toBe(0)
    expect(right.connectedPeers.size).toBe(0)
  })
}

const dialInviteeThroughBothAcceptors = async (
  invitee: Libp2pService,
  firstAcceptor: Libp2pService,
  secondAcceptor: Libp2pService
) => {
  let joinedEvents = 0
  invitee.on(Libp2pEvents.AUTH_JOINED, () => {
    joinedEvents += 1
  })
  const joined = waitForEvent(invitee, Libp2pEvents.AUTH_JOINED, 'Concurrent admission timed out')

  await Promise.all([
    invitee.dialPeer(firstAcceptor.localAddress),
    invitee.dialPeer(secondAcceptor.localAddress),
    joined,
  ])

  return joinedEvents
}

const expectOneAdmissionAndDivergentAcceptor = async (
  peers: TestPeer[],
  actionType: 'ADMIT_MEMBER' | 'ADMIT_DEVICE',
  admittedId: string
) => {
  await waitForExpect(
    () => {
      const admissionLinks = peers.map(peer => matchingAdmissionLinks(peer, actionType, admittedId))
      const acceptorAdmissionCounts = admissionLinks.slice(0, 2).map(links => links.length)
      const uniqueAdmissionHashes = new Set(admissionLinks.flat().map(link => link.hash))

      expect(acceptorAdmissionCounts.sort()).toEqual([0, 1])
      expect(admissionLinks[2]).toHaveLength(1)
      expect(uniqueAdmissionHashes.size).toBe(1)
      expect(peers[0].sigchain.activeChain.team!.graph.head).not.toEqual(peers[1].sigchain.activeChain.team!.graph.head)
    },
    5_000,
    100
  )
}

const expectBufferedConnectionsResumed = async (invitee: TestPeer) => {
  await waitForExpect(() => {
    const auth = invitee.libp2p['authService']!
    expect(auth['bufferedConnections']).toHaveLength(0)
    expect(auth['authConnections'].size).toBe(2)
  })
}

const matchingAdmissionLinks = (peer: TestPeer, actionType: 'ADMIT_MEMBER' | 'ADMIT_DEVICE', admittedId: string) => {
  const links = Object.values(peer.sigchain.activeChain.team!.graph.links) as AdmissionGraphLink[]
  return links.filter(link => {
    if (link.body.type !== actionType) return false
    return actionType === 'ADMIT_MEMBER'
      ? link.body.payload?.memberKeys?.name === admittedId
      : link.body.payload?.device?.deviceId === admittedId
  })
}

const waitForEvent = (emitter: Libp2pService, event: Libp2pEvents, timeoutMessage: string) =>
  new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(timeoutMessage)), ADMISSION_TIMEOUT)
    emitter.once(event, () => {
      clearTimeout(timeout)
      resolve()
    })
  })
