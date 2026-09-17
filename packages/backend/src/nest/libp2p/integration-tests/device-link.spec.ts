import { TestingModule } from '@nestjs/testing'
import { spawnLibp2pInstances, spawnTestModules } from '../../common/test-utils'
import { SigChainService } from '../../auth/sigchain.service'
import { dmMessage } from '../../auth/services/crypto/direct-message-test-utils'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'
import waitForExpect from 'wait-for-expect'

const dialAndWaitForJoin = async (
  joiningPeer: Libp2pService,
  acceptingPeer: Libp2pService,
  timeoutMessage: string
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(timeoutMessage)), 20_000)
    joiningPeer.once(Libp2pEvents.AUTH_JOINED, () => {
      clearTimeout(timeout)
      resolve()
    })
    void joiningPeer.dialPeer(acceptingPeer.localAddress)
  })
}

const previousIsE2e = process.env.IS_E2E
const previousLocalTransport = process.env.LOCAL_TRANSPORT

beforeAll(() => {
  process.env.IS_E2E = 'true'
  process.env.LOCAL_TRANSPORT = 'true'
})

afterAll(() => {
  if (previousIsE2e == null) delete process.env.IS_E2E
  else process.env.IS_E2E = previousIsE2e
  if (previousLocalTransport == null) {
    delete process.env.LOCAL_TRANSPORT
    return
  }
  process.env.LOCAL_TRANSPORT = previousLocalTransport
})

describe('Libp2pAuth device linking', () => {
  const modules: TestingModule[] = []
  let ownerSigchain: SigChainService
  let invitedDeviceSigchain: SigChainService
  let ownerLibp2p: Libp2pService
  let invitedDeviceLibp2p: Libp2pService

  beforeAll(async () => {
    modules.push(...(await spawnTestModules(2)))
    ownerSigchain = await modules[0].resolve(SigChainService)
    invitedDeviceSigchain = await modules[1].resolve(SigChainService)
    ownerLibp2p = await modules[0].resolve(Libp2pService)
    invitedDeviceLibp2p = await modules[1].resolve(Libp2pService)

    const ownerChain = await ownerSigchain.createChain(true)
    const invite = ownerChain.invites.createDeviceInvite()
    await invitedDeviceSigchain.createChainFromDeviceInvite(
      {
        seed: invite.seed,
        userName: invite.userName,
        deviceName: 'Linked phone',
        expectedTeamId: ownerChain.team!.id,
        expectedUserId: invite.userId,
      },
      ownerChain.team!.id,
      true
    )
    await spawnLibp2pInstances(modules)
  })

  afterAll(async () => {
    for (const module of modules) {
      const libp2pService = await module.resolve(Libp2pService)
      await libp2pService.close()
      await module.close()
    }
  })

  it('admits a fresh device into the existing user over P2P', async () => {
    await dialAndWaitForJoin(invitedDeviceLibp2p, ownerLibp2p, 'Device admission timed out')

    const owner = ownerSigchain.activeChain
    const linked = invitedDeviceSigchain.activeChain
    expect(linked.isPendingDeviceAdmission).toBe(false)
    expect(linked.team?.id).toBe(owner.team?.id)
    expect(linked.user.userId).toBe(owner.user.userId)
    expect(linked.device.deviceId).not.toBe(owner.device.deviceId)
    expect(linked.team?.hasDevice(linked.device.deviceId)).toBe(true)
    expect(linked.team?.members(linked.user.userId).devices).toHaveLength(2)
  })
})

describe('Libp2pAuth device linking with a third peer', () => {
  const modules: TestingModule[] = []
  let ownerSigchain: SigChainService
  let existingMemberSigchain: SigChainService
  let invitedDeviceSigchain: SigChainService
  let ownerLibp2p: Libp2pService
  let existingMemberLibp2p: Libp2pService
  let invitedDeviceLibp2p: Libp2pService

  beforeAll(async () => {
    modules.push(...(await spawnTestModules(3)))
    ownerSigchain = await modules[0].resolve(SigChainService)
    existingMemberSigchain = await modules[1].resolve(SigChainService)
    invitedDeviceSigchain = await modules[2].resolve(SigChainService)
    ownerLibp2p = await modules[0].resolve(Libp2pService)
    existingMemberLibp2p = await modules[1].resolve(Libp2pService)
    invitedDeviceLibp2p = await modules[2].resolve(Libp2pService)

    const ownerChain = await ownerSigchain.createChain(true)
    const memberInvite = ownerChain.invites.createLongLivedUserInvite()
    await existingMemberSigchain.createChainFromInvite(
      { name: 'Existing member', seed: memberInvite.seed },
      ownerChain.team!.id,
      true
    )

    const deviceInvite = ownerChain.invites.createDeviceInvite()
    await invitedDeviceSigchain.createChainFromDeviceInvite(
      {
        seed: deviceInvite.seed,
        userName: deviceInvite.userName,
        deviceName: 'Linked phone',
        expectedTeamId: ownerChain.team!.id,
        expectedUserId: deviceInvite.userId,
      },
      ownerChain.team!.id,
      true
    )
    await spawnLibp2pInstances(modules)
  })

  afterAll(async () => {
    for (const module of modules) {
      const libp2pService = await module.resolve(Libp2pService)
      await libp2pService.close()
      await module.close()
    }
  })

  it("lets an existing member admit the owner's invited device and syncs it to every peer", async () => {
    await dialAndWaitForJoin(existingMemberLibp2p, ownerLibp2p, 'Existing member admission timed out')
    await dialAndWaitForJoin(invitedDeviceLibp2p, existingMemberLibp2p, 'Device admission timed out')

    const ownerUserId = ownerSigchain.activeChain.user.userId
    const linkedDeviceId = invitedDeviceSigchain.activeChain.device.deviceId

    await waitForExpect(
      () => {
        for (const sigchain of [ownerSigchain, existingMemberSigchain, invitedDeviceSigchain]) {
          const chain = sigchain.activeChain
          expect(chain.team?.hasDevice(linkedDeviceId)).toBe(true)
          expect(chain.team?.members(ownerUserId).devices).toHaveLength(2)
        }
      },
      20_000,
      100
    )

    const owner = ownerSigchain.activeChain
    const existingMember = existingMemberSigchain.activeChain
    const linked = invitedDeviceSigchain.activeChain
    expect(existingMember.user.userId).not.toBe(owner.user.userId)
    expect(linked.team?.id).toBe(owner.team?.id)
    expect(linked.user.userId).toBe(owner.user.userId)
    expect(linked.device.deviceId).not.toBe(owner.device.deviceId)
    expect(linked.isPendingDeviceAdmission).toBe(false)
  })
})

/**
 * The same DM assertions the fast spec makes, but on a device admitted the way production admits
 * one: a first-use device with no trusted user id, an LFA AuthConnection over libp2p, and the
 * expected identity checked when the admission transaction commits. The fast spec constructs the
 * admitted account context itself, so it cannot notice if real admission ever stopped handing the
 * device the user's keys - which is the single thing every one of these assertions rests on.
 *
 * The DM is created BETWEEN the two admissions, so its history genuinely predates the link.
 */
describe('Direct messages on a device admitted over libp2p', () => {
  const modules: TestingModule[] = []
  let ownerSigchain: SigChainService
  let memberSigchain: SigChainService
  let linkedSigchain: SigChainService
  let ownerLibp2p: Libp2pService
  let memberLibp2p: Libp2pService
  let linkedLibp2p: Libp2pService

  beforeAll(async () => {
    modules.push(...(await spawnTestModules(3)))
    ownerSigchain = await modules[0].resolve(SigChainService)
    memberSigchain = await modules[1].resolve(SigChainService)
    linkedSigchain = await modules[2].resolve(SigChainService)
    ownerLibp2p = await modules[0].resolve(Libp2pService)
    memberLibp2p = await modules[1].resolve(Libp2pService)
    linkedLibp2p = await modules[2].resolve(Libp2pService)

    const ownerChain = await ownerSigchain.createChain(true)
    const memberInvite = ownerChain.invites.createLongLivedUserInvite()
    await memberSigchain.createChainFromInvite(
      { name: 'DM member', seed: memberInvite.seed },
      ownerChain.team!.id,
      true
    )

    const deviceInvite = ownerChain.invites.createDeviceInvite()
    await linkedSigchain.createChainFromDeviceInvite(
      {
        seed: deviceInvite.seed,
        userName: deviceInvite.userName,
        deviceName: 'Linked phone',
        expectedTeamId: ownerChain.team!.id,
        expectedUserId: deviceInvite.userId,
      },
      ownerChain.team!.id,
      true
    )
    await spawnLibp2pInstances(modules)
  })

  afterAll(async () => {
    for (const module of modules) {
      const libp2pService = await module.resolve(Libp2pService)
      await libp2pService.close()
      await module.close()
    }
  })

  it('reads DM history from before the link and writes as the user afterwards', async () => {
    await dialAndWaitForJoin(memberLibp2p, ownerLibp2p, 'Member admission timed out')

    // The conversation, and a message in it, while the owner still has one device.
    const owner = ownerSigchain.activeChain
    const member = memberSigchain.activeChain
    const channel = member.directMessages.create([owner.user.userId])
    const descriptor = member.directMessages.descriptor(channel.id)
    expect(owner.directMessages.openDescriptor(descriptor, channel.id)).toMatchObject({ id: channel.id })
    const beforeLinking = member.directMessages.sealMessage(dmMessage(member, channel), channel.id)
    expect(owner.directMessages.openMessage(beforeLinking, channel.id).message).toContain('Confidential DM')

    // Now the second device joins, through real admission.
    await dialAndWaitForJoin(linkedLibp2p, ownerLibp2p, 'Device admission timed out')
    await waitForExpect(
      () => {
        expect(linkedSigchain.activeChain.isPendingDeviceAdmission).toBe(false)
        expect(linkedSigchain.activeChain.team?.members(owner.user.userId).devices).toHaveLength(2)
      },
      20_000,
      100
    )

    const linked = linkedSigchain.activeChain
    expect(linked.user.userId).toBe(owner.user.userId)
    expect(linked.device.deviceId).not.toBe(owner.device.deviceId)

    // The descriptor and the history that predate it open on the admitted device.
    expect(linked.directMessages.openDescriptor(descriptor, channel.id)).toMatchObject({ id: channel.id })
    expect(linked.directMessages.openMessage(beforeLinking, channel.id).message).toContain('Confidential DM')

    // And what it writes is the user's, readable by the first device and by the member.
    const fromLinked = linked.directMessages.sealMessage(dmMessage(linked, channel), channel.id)
    expect(fromLinked.encSignature.author.name).toBe(owner.user.userId)
    await waitForExpect(
      () => {
        for (const reader of [ownerSigchain.activeChain, memberSigchain.activeChain]) {
          expect(reader.directMessages.openMessage(fromLinked, channel.id).userId).toBe(owner.user.userId)
        }
      },
      20_000,
      100
    )
  })
})
