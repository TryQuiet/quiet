import { TestingModule } from '@nestjs/testing'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { SigChainService } from '../../auth/sigchain.service'
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
    await spawnLibp2pInstancesInMemory(modules)
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
    await spawnLibp2pInstancesInMemory(modules)
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
