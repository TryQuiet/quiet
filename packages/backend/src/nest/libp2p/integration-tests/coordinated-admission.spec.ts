import { jest } from '@jest/globals'
import type { TestingModule } from '@nestjs/testing'
import waitForExpect from 'wait-for-expect'
import { AdmissionCoordinator } from '../../admission/admission-coordinator.service'
import { CommunityLifecycle } from '../../admission/community-lifecycle'
import { AdmissionKind, AdmissionTransport } from '../../admission/admission.types'
import { SigChainService } from '../../auth/sigchain.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'

it('admits through the real P2P adapter without exposing provisional state and resumes normal peer sync', async () => {
  const modules: TestingModule[] = await spawnTestModules(2)
  let finish!: () => void
  try {
    const owner = await modules[0].resolve(SigChainService)
    const joiner = await modules[1].resolve(SigChainService)
    const db = await modules[1].resolve(LocalDbService)
    const coordinator = await modules[1].resolve(AdmissionCoordinator)
    const ownerNetwork = await modules[0].resolve(Libp2pService)
    const network = await modules[1].resolve(Libp2pService)
    const team = await owner.createChain(true)
    const invitation = team.invites.createLongLivedUserInvite()
    await joiner.createChainFromInvite({ seed: invitation.seed }, team.teamId!, true)
    const provisional = joiner.getActiveChain()
    await db.setCommunity({ id: 'coordinated-community', teamId: team.teamId } as any)
    const params = await spawnLibp2pInstancesInMemory(modules)
    const write = db.setSigChainData.bind(db)
    const pending = new Promise<void>(resolve => {
      finish = resolve
    })
    const writeSpy = jest.spyOn(db, 'setSigChainData').mockImplementationOnce(async (...args) => {
      await pending
      await write(...args)
    })
    const joined = jest.fn()
    network.on(Libp2pEvents.AUTH_JOINED, joined)
    const handle = coordinator.start(
      {
        communityId: 'coordinated-community',
        teamId: team.teamId!,
        expectedUserId: provisional.userId,
        expectedDeviceId: provisional.device.deviceId,
        kind: AdmissionKind.MEMBER,
        preferredTransport: AdmissionTransport.P2P,
        timeoutMs: 30_000,
      },
      new CommunityLifecycle('coordinated-community', params[1])
    )
    await waitForExpect(() => expect(network.admissionContext).toBeDefined())
    await network.dialPeer(ownerNetwork.localAddress)
    await waitForExpect(() => expect(writeSpy).toHaveBeenCalled())
    expect(joiner.getActiveChain()).toBe(provisional)
    expect(provisional.team).toBeNull()
    expect(joined).not.toHaveBeenCalled()
    finish()
    await expect(handle.result).resolves.toMatchObject({ teamId: team.teamId, transport: AdmissionTransport.P2P })
    await handle.drained
    await waitForExpect(() => expect(joined).toHaveBeenCalledTimes(1))
    expect(joiner.getActiveChain()).not.toBe(provisional)
    expect(((await db.getCommunity('coordinated-community')) as any).admissionTransport).toBe(AdmissionTransport.P2P)
    const chain = joiner.getActiveChain()
    expect(chain.team!.hasDevice(provisional.device.deviceId)).toBe(true)
    // Exercise the transferred auth connection after publication, using normal validated sync.
    team.team!.setTeamName('after-admission')
    await waitForExpect(() => expect(chain.team!.teamName).toBe('after-admission'))
  } finally {
    finish?.()
    jest.restoreAllMocks()
    for (const module of modules) {
      const network = await module.resolve(Libp2pService)
      await network.close()
      await module.close()
    }
  }
}, 60_000)
