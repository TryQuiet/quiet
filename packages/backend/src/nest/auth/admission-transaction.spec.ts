import { jest } from '@jest/globals'
import { SigChain } from './sigchain'
import { SigChainService } from './sigchain.service'
import { AdmissionCandidate, AdmissionKind, AdmissionRequest, AdmissionTransport } from '../admission/admission.types'
import type { SigChainSaveData } from './types'

const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve()
}

function fixture() {
  const admitted = SigChain.create()
  const base = SigChain.createFromTeam(admitted.team!, structuredClone(admitted.localUserContext))
  base.context = { ...base.localUserContext, invitationSeed: 'seed', expectedTeamId: admitted.team!.id }
  const write = jest.fn<(snapshot: SigChainSaveData, teamId: string) => Promise<void>>(async () => undefined)
  const db = { getStatus: () => 'open', setSigChainData: write }
  const service = new SigChainService({ io: { emit: jest.fn() } } as any, db as any, {} as any)
  service.addChain(base, true, admitted.team!.id)
  const request: AdmissionRequest = {
    communityId: 'community',
    teamId: admitted.team!.id,
    expectedUserId: admitted.userId,
    expectedDeviceId: admitted.device.deviceId,
    kind: AdmissionKind.MEMBER,
    preferredTransport: AdmissionTransport.P2P,
    timeoutMs: 120_000,
  }
  const transaction = service.beginAdmission(request)
  const chain = transaction.stage()
  const candidate: AdmissionCandidate = {
    chain,
    team: admitted.team!,
    user: admitted.user,
    teamId: request.teamId,
    userId: request.expectedUserId,
    deviceId: request.expectedDeviceId,
    kind: request.kind,
    transport: AdmissionTransport.P2P,
  }
  return { base, admitted, service, request, transaction, chain, candidate, write }
}

it('keeps provisional state private until the immutable snapshot is durable and restores that identity', async () => {
  const f = fixture()
  let finish!: () => void
  f.write.mockImplementationOnce(
    async () =>
      new Promise<void>(resolve => {
        finish = resolve
      })
  )
  const commit = f.transaction.commit(f.candidate)
  await flush()
  expect(f.write).toHaveBeenCalledTimes(1)
  expect(f.service.getActiveChain()).toBe(f.base)
  expect(f.service.getActiveChain().team).toBeNull()
  expect(f.chain.team).toBe(f.admitted.team)
  const snapshot = f.write.mock.calls[0][0]
  expect(snapshot.localUserContext).not.toBe(f.chain.localUserContext)
  const restored = SigChain.load(
    Buffer.from(snapshot.serializedTeam!, 'base64'),
    snapshot.localUserContext,
    snapshot.teamKeyRing!
  )
  expect(restored.team!.id).toBe(f.request.teamId)
  expect(restored.device.deviceId).toBe(f.request.expectedDeviceId)
  finish()
  await commit
  expect(f.service.getActiveChain()).toBe(f.chain)
  expect(f.service.hasAdmissionPersistenceBarrier(f.request.teamId)).toBe(false)
})

it.each(['teamId', 'userId', 'deviceId'] as const)('rejects a wrong %s before writing or publishing', async field => {
  const f = fixture()
  await expect(f.transaction.commit({ ...f.candidate, [field]: 'wrong' })).rejects.toMatchObject({ kind: 'validation' })
  expect(f.write).not.toHaveBeenCalled()
  expect(f.service.getActiveChain()).toBe(f.base)
  f.transaction.discard()
})

it('refuses a candidate from another staged transaction', async () => {
  const f = fixture()
  await expect(f.transaction.commit({ ...f.candidate, chain: f.base })).rejects.toMatchObject({ kind: 'validation' })
  expect(f.write).not.toHaveBeenCalled()
  f.transaction.discard()
})

it('retains the persistence barrier and original context after an uncertain write', async () => {
  const f = fixture()
  f.write.mockRejectedValueOnce(new Error('database write failed'))
  await expect(f.transaction.commit(f.candidate)).rejects.toMatchObject({ kind: 'recovery' })
  expect(f.service.getActiveChain()).toBe(f.base)
  expect(f.base.team).toBeNull()
  expect(f.service.hasAdmissionPersistenceBarrier(f.request.teamId)).toBe(true)
})

it('does not allow post-commit saves to enqueue a stale provisional snapshot', async () => {
  const f = fixture()
  const blocked = f.service.saveChain(f.request.teamId)
  await flush()
  expect(f.write).not.toHaveBeenCalled()
  await f.transaction.commit(f.candidate)
  await blocked
  await f.service.saveChain(f.request.teamId)
  expect(f.write).toHaveBeenCalledTimes(2)
  expect(f.write.mock.calls[1][0].serializedTeam).toEqual(f.write.mock.calls[0][0].serializedTeam)
})

it('rejects a candidate with a different admission kind before writing', async () => {
  const f = fixture()
  await expect(f.transaction.commit({ ...f.candidate, kind: AdmissionKind.DEVICE })).rejects.toMatchObject({
    kind: 'validation',
  })
  expect(f.write).not.toHaveBeenCalled()
  f.transaction.discard()
})

it('does not publish when the persistence backlog definitively refuses the snapshot', async () => {
  const f = fixture()
  ;(f.service as any).stateFor(f.request.teamId).waiters = (SigChainService as any).MAX_PENDING_PERSISTS_PER_TEAM
  await expect(f.transaction.commit(f.candidate)).rejects.toMatchObject({ kind: 'persistence' })
  expect(f.write).not.toHaveBeenCalled()
  expect(f.service.getActiveChain()).toBe(f.base)
  f.transaction.discard()
})

it('keeps the selected snapshot immutable while ordinary saves wait for publication', async () => {
  const f = fixture()
  let finish!: () => void
  f.write.mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        finish = resolve
      })
  )
  const commit = f.transaction.commit(f.candidate)
  await flush()
  const snapshot = f.write.mock.calls[0][0]
  const savedName = snapshot.localUserContext.user.userName
  f.chain.user.userName = 'changed after capture'
  let saved = false
  const blocked = f.service.saveChain(f.request.teamId).then(() => {
    saved = true
  })
  await flush()
  expect(saved).toBe(false)
  expect(snapshot.localUserContext.user.userName).toBe(savedName)
  finish()
  await commit
  await blocked
  expect(f.write).toHaveBeenCalledTimes(1)
  expect(f.service.getActiveChain()).toBe(f.chain)
})

it('rejects saves waiting on an admission that is discarded', async () => {
  const f = fixture()
  const blocked = f.service.saveChain(f.request.teamId)
  await flush()
  f.transaction.discard()
  await expect(blocked).rejects.toThrow('Admission persistence cancelled')
  expect(f.write).not.toHaveBeenCalled()
  expect(f.service.getActiveChain()).toBe(f.base)
})

it('rejects waiting and future saves after an uncertain write while retaining the barrier', async () => {
  const f = fixture()
  const blocked = f.service.saveChain(f.request.teamId)
  const blockedResult = expect(blocked).rejects.toMatchObject({ kind: 'recovery' })
  await flush()
  f.write.mockRejectedValueOnce(new Error('write outcome unknown'))
  await expect(f.transaction.commit(f.candidate)).rejects.toMatchObject({ kind: 'recovery' })
  await blockedResult
  await expect(f.service.saveChain(f.request.teamId)).rejects.toMatchObject({ kind: 'recovery' })
  expect(f.service.hasAdmissionPersistenceBarrier(f.request.teamId)).toBe(true)
  expect(f.write).toHaveBeenCalledTimes(1)
})

it.each(['success', 'recovery'] as const)('settles every concurrent save waiter after admission %s', async outcome => {
  const f = fixture()
  let finish!: () => void
  let fail!: (error: Error) => void
  f.write.mockImplementationOnce(
    () =>
      new Promise<void>((resolve, reject) => {
        finish = resolve
        fail = reject
      })
  )
  const commit = f.transaction.commit(f.candidate)
  const commitResult = Promise.allSettled([commit])
  await flush()
  let settled = false
  const waiters = Promise.allSettled(Array.from({ length: 32 }, () => f.service.saveChain(f.request.teamId)))
  void waiters.then(() => {
    settled = true
  })
  await flush()
  expect(settled).toBe(false)
  expect(f.write).toHaveBeenCalledTimes(1)
  if (outcome === 'success') finish()
  else fail(new Error('write outcome unknown'))
  const [result] = await commitResult
  const saves = await waiters
  if (outcome === 'success') {
    expect(result.status).toBe('fulfilled')
    expect(saves.every(save => save.status === 'fulfilled')).toBe(true)
    expect(f.service.getActiveChain()).toBe(f.chain)
    expect(f.service.hasAdmissionPersistenceBarrier(f.request.teamId)).toBe(false)
  } else {
    expect(result).toMatchObject({ status: 'rejected', reason: { kind: 'recovery' } })
    for (const save of saves) expect(save).toMatchObject({ status: 'rejected', reason: { kind: 'recovery' } })
    await expect(f.service.saveChain(f.request.teamId)).rejects.toMatchObject({ kind: 'recovery' })
    expect(f.service.getActiveChain()).toBe(f.base)
    expect(f.service.hasAdmissionPersistenceBarrier(f.request.teamId)).toBe(true)
  }
  expect(f.write).toHaveBeenCalledTimes(1)
  expect(f.service.pendingPersistCount(f.request.teamId)).toBe(0)
})

it('refuses a second staged candidate while the selected snapshot is being written', async () => {
  const f = fixture()
  const second = f.transaction.stage()
  let finish!: () => void
  f.write.mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        finish = resolve
      })
  )
  const commit = f.transaction.commit(f.candidate)
  await flush()
  await expect(f.transaction.commit({ ...f.candidate, chain: second })).rejects.toMatchObject({ kind: 'validation' })
  expect(f.write).toHaveBeenCalledTimes(1)
  expect(f.service.getActiveChain()).toBe(f.base)
  finish()
  await commit
  expect(f.service.getActiveChain()).toBe(f.chain)
  expect(f.write).toHaveBeenCalledTimes(1)
})

it('requires recovery if the active community changes after the snapshot write starts', async () => {
  const f = fixture()
  let finish!: () => void
  f.write.mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        finish = resolve
      })
  )
  const commit = f.transaction.commit(f.candidate)
  const rejectedCommit = expect(commit).rejects.toMatchObject({ kind: 'recovery' })
  const save = f.service.saveChain(f.request.teamId)
  const rejectedSave = expect(save).rejects.toMatchObject({ kind: 'recovery' })
  await flush()
  const replacement = SigChain.create()
  f.service.addChain(replacement, true, replacement.team!.id)
  finish()
  await rejectedCommit
  await rejectedSave
  expect(f.service.getActiveChain()).toBe(replacement)
  expect(f.service.getChain(f.request.teamId)).toBe(f.base)
  expect(f.service.hasAdmissionPersistenceBarrier(f.request.teamId)).toBe(true)
  await expect(f.service.saveChain(f.request.teamId)).rejects.toMatchObject({ kind: 'recovery' })
  expect(f.write).toHaveBeenCalledTimes(1)
})

it('does not let a discarded transaction cancel the replacement admission barrier', async () => {
  const f = fixture()
  f.transaction.discard()
  const replacement = f.service.beginAdmission(f.request)
  const chain = replacement.stage()
  const waiting = f.service.saveChain(f.request.teamId)
  await flush()
  f.transaction.discard()
  expect(f.service.hasAdmissionPersistenceBarrier(f.request.teamId)).toBe(true)
  expect(f.write).not.toHaveBeenCalled()
  await replacement.commit({ ...f.candidate, chain })
  await waiting
  expect(f.service.getActiveChain()).toBe(chain)
  expect(f.service.hasAdmissionPersistenceBarrier(f.request.teamId)).toBe(false)
  expect(f.write).toHaveBeenCalledTimes(1)
})
