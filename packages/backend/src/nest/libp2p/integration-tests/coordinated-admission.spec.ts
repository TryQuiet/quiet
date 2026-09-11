import { jest } from '@jest/globals'
import type { TestingModule } from '@nestjs/testing'
import waitForExpect from 'wait-for-expect'
import { AdmissionCoordinator } from '../../admission/admission-coordinator.service'
import { admissionLifecycleCases } from '../../admission/admission-lifecycle.test-cases'
import { CommunityLifecycle } from '../../admission/community-lifecycle'
import { AdmissionKind, AdmissionTransport } from '../../admission/admission.types'
import { SigChainService } from '../../auth/sigchain.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'

it.each(admissionLifecycleCases)(
  'admits a $kind and syncs over P2P: $lifecycle',
  async ({ kind, lifecycle }) => {
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
      if (kind === AdmissionKind.DEVICE) {
        const invitation = team.invites.createDeviceInvite()
        await joiner.createChainFromDeviceInvite(
          {
            seed: invitation.seed,
            userName: invitation.userName,
            deviceName: 'Lifecycle device',
            expectedTeamId: team.teamId!,
            expectedUserId: invitation.userId,
          },
          team.teamId!,
          true
        )
      } else {
        const invitation = team.invites.createLongLivedUserInvite()
        await joiner.createChainFromInvite({ seed: invitation.seed }, team.teamId!, true)
      }
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
      const close = jest.spyOn(network, 'close')
      const lease = new CommunityLifecycle('coordinated-community', params[1])
      const handle = coordinator.start(
        {
          communityId: 'coordinated-community',
          teamId: team.teamId!,
          expectedUserId: provisional.userId,
          expectedDeviceId: provisional.device.deviceId,
          kind,
          preferredTransport: AdmissionTransport.P2P,
          timeoutMs: 30_000,
        },
        lease
      )
      await waitForExpect(() => expect(network.admissionContext).toBeDefined())
      await network.dialPeer(ownerNetwork.localAddress)
      await waitForExpect(() => expect(writeSpy).toHaveBeenCalled())
      expect(joiner.getActiveChain()).toBe(provisional)
      expect(provisional.team).toBeNull()
      expect(joined).not.toHaveBeenCalled()
      expect((await db.getSigChain(team.teamId!))?.serializedTeam).toBeUndefined()
      let settled = false
      void handle.result.then(
        () => {
          settled = true
        },
        () => undefined
      )
      const reason = new Error(lifecycle)
      const stopping =
        lifecycle === 'pause during commit'
          ? lease.pause(reason)
          : lifecycle === 'shutdown during commit'
            ? lease.drain(reason)
            : undefined
      let stopped = false
      void stopping?.then(
        () => {
          stopped = true
        },
        () => undefined
      )
      // Let queued cancellation and cleanup work run while persistence remains blocked.
      await new Promise<void>(resolve => setImmediate(resolve))
      expect(settled).toBe(false)
      expect(stopped).toBe(false)
      expect(close).not.toHaveBeenCalled()
      finish()
      await expect(handle.result).resolves.toMatchObject({
        teamId: team.teamId,
        userId: provisional.userId,
        deviceId: provisional.device.deviceId,
        transport: AdmissionTransport.P2P,
      })
      await handle.drained
      const interruptedCommit = stopping != null
      if (interruptedCommit) {
        await stopping
        expect(joined).not.toHaveBeenCalled()
      } else {
        await waitForExpect(() => expect(joined).toHaveBeenCalledTimes(1))
      }
      if (lifecycle === 'shutdown during commit') {
        expect(close).toHaveBeenCalledTimes(1)
        expect(network.libp2pInstance).toBeNull()
        expect(network.admissionContext).toBeUndefined()
        expect(joiner.hasAdmissionPersistenceBarrier(team.teamId!)).toBe(false)
        await network.closeDatastore()
        await joiner.deleteChain(team.teamId!, false)
        await joiner.loadChain(team.teamId!, true)
        await network.createInstance(params[1])
        await network.dialPeer(ownerNetwork.localAddress)
      } else if (lifecycle !== 'uninterrupted') {
        if (lifecycle === 'pause after commit') await lease.pause(reason)
        await network.pause()
        expect(network.admissionContext).toBeUndefined()
        await network.resume([ownerNetwork.localAddress])
      }
      expect(joiner.getActiveChain()).not.toBe(provisional)
      expect(((await db.getCommunity('coordinated-community')) as any).admissionTransport).toBe(
        kind === AdmissionKind.MEMBER ? AdmissionTransport.P2P : undefined
      )
      const chain = joiner.getActiveChain()
      expect(chain.userId).toBe(provisional.userId)
      expect(chain.device.deviceId).toBe(provisional.device.deviceId)
      expect(chain.isPendingDeviceAdmission).toBe(false)
      expect(chain.team!.hasDevice(provisional.device.deviceId)).toBe(true)
      expect(joiner.hasAdmissionPersistenceBarrier(team.teamId!)).toBe(false)
      // Exercise normal validated sync, including a new auth connection after pause/resume.
      team.team!.setTeamName('after-admission')
      await waitForExpect(() => expect(chain.team!.teamName).toBe('after-admission'))
      await lease.drain(reason)
    } finally {
      finish?.()
      jest.restoreAllMocks()
      for (const module of modules) {
        const network = await module.resolve(Libp2pService)
        await network.close()
        await module.close()
      }
    }
  },
  60_000
)
