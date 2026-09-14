import { TestingModule } from '@nestjs/testing'
import { jest } from '@jest/globals'
import { SigChainService } from '../../auth/sigchain.service'
import { SigchainEvents } from '../../auth/types'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'
import waitForExpect from 'wait-for-expect'

describe('Libp2pAuth device linking', () => {
  jest.setTimeout(60_000)
  const modules: TestingModule[] = []

  afterEach(async () => {
    for (const module of modules.splice(0)) {
      await (await module.resolve(Libp2pService)).close()
      await module.close()
    }
  })

  it('publishes a real device admission and reconnects through normal member auth', async () => {
    modules.push(...(await spawnTestModules(2)))
    const owner = await modules[0].resolve(SigChainService)
    const linked = await modules[1].resolve(SigChainService)
    const ownerP2p = await modules[0].resolve(Libp2pService)
    const linkedP2p = await modules[1].resolve(Libp2pService)
    const ownerChain = await owner.createChain(true)
    const invite = ownerChain.invites.createDeviceInvite()
    await linked.createChainFromDeviceInvite(
      {
        seed: invite.seed,
        userName: invite.userName,
        expectedTeamId: ownerChain.team!.id,
        expectedUserId: invite.userId,
        deviceName: 'Linked phone',
      },
      ownerChain.team!.id,
      true
    )
    await spawnLibp2pInstancesInMemory(modules)

    let published = false
    const admitted = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Device admission timed out')), 30_000)
      linked.once(SigchainEvents.DEVICE_ADMITTED, teamId => {
        clearTimeout(timeout)
        published = true
        resolve(teamId)
      })
    })
    const normallyConnected = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Normal device authentication timed out')), 30_000)
      linkedP2p.on(Libp2pEvents.AUTH_CONNECTED, () => {
        if (!published) return
        clearTimeout(timeout)
        resolve()
      })
    })
    await linkedP2p.dialPeer(ownerP2p.localAddress)
    expect(await admitted).toBe(ownerChain.team!.id)
    await normallyConnected

    const completed = linked.activeChain
    expect(completed.user.userId).toBe(ownerChain.user.userId)
    expect(completed.team!.hasDevice(completed.device.deviceId)).toBe(true)
    expect(completed.team!.members(ownerChain.user.userId).devices).toHaveLength(2)

    ownerChain.roles.create('post-link-sync')
    await waitForExpect(() => {
      expect(completed.team!.roles('post-link-sync')).toBeDefined()
    }, 20_000)
  })
})
