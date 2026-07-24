import { TestingModule } from '@nestjs/testing'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { SigChainService } from '../../auth/sigchain.service'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'

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
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Device admission timed out')), 20_000)
      invitedDeviceLibp2p.once(Libp2pEvents.AUTH_JOINED, () => {
        clearTimeout(timeout)
        resolve()
      })
      void invitedDeviceLibp2p.dialPeer(ownerLibp2p.localAddress)
    })

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
