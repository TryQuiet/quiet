import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import { SigChainService } from './sigchain.service'
import { createLogger } from '../common/logger'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDbModule } from '../local-db/local-db.module'
import { TestModule } from '../common/test.module'
import { SigChainModule } from './sigchain.service.module'
import { SigChain } from './sigchain'
import { SocketEvents } from '@quiet/types'
import waitForExpect from 'wait-for-expect'
import { SigchainEvents } from './types'
import { AdmittingTeamReplacedError, PersistenceBacklogError } from './sigchain.service'

const logger = createLogger('auth:sigchainManager.spec')

describe('SigChainService', () => {
  let module: TestingModule
  let sigChainService: SigChainService
  let localDbService: LocalDbService
  let handleChainUpdateSpy: jest.SpiedFunction<any>
  let sigChainTest: SigChain
  let sigChainTest2: SigChain
  let sigChainTest3: SigChain

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, SigChainModule, LocalDbModule],
    }).compile()
    sigChainService = await module.resolve(SigChainService)
    localDbService = await module.resolve(LocalDbService)
    handleChainUpdateSpy = jest.spyOn(sigChainService as any, 'handleChainUpdate').mockImplementation(() => {
      logger.debug('MOCK: handling chain update')
    })
  })

  beforeEach(async () => {
    if (localDbService.getStatus() === 'closed') {
      await localDbService.open()
    }
  })

  afterAll(async () => {
    handleChainUpdateSpy.mockReset()
    await localDbService.close()
    await module.close()
  })

  it('should throw an error when trying to get an active chain without setting one', async () => {
    expect(() => sigChainService.getActiveChain()).toThrowError()
  })
  it('should throw an error when trying to set an active chain that does not exist', async () => {
    expect(() => sigChainService.setActiveChain('nonexistent')).toThrowError()
  })
  it('should add a new chain and it not be active if not set to be', async () => {
    sigChainTest = await sigChainService.createChain(false)
    expect(() => sigChainService.getActiveChain()).toThrowError()
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
    sigChainService.setActiveChain(sigChainTest.teamId!)
    expect(sigChainService.getActiveChain()).toBe(sigChainTest)
  })
  it('should add a new chain and it be active if set to be', async () => {
    sigChainTest2 = await sigChainService.createChain(true)
    expect(sigChainService.getActiveChain()).toBe(sigChainTest2)
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
    const prevSigChain = sigChainService.getChain(sigChainTest.teamId!)
    expect(prevSigChain).toBeDefined()
    expect(prevSigChain).not.toBe(sigChainTest2)
  })
  it('should delete nonactive chain without changing active chain', async () => {
    sigChainService.setActiveChain(sigChainTest2.teamId!)
    await sigChainService.deleteChain(sigChainTest.teamId!, false)
    expect(() => sigChainService.getChain(sigChainTest.teamId!)).toThrowError()
    expect(sigChainService.getActiveChain()).toBeDefined()
  })
  it('should delete active chain and set active chain to undefined', async () => {
    await sigChainService.deleteChain(sigChainTest2.teamId!, false)
    expect(sigChainService.getActiveChain).toThrowError()
  })
  it('should save and load sigchain using nestjs service', async () => {
    const TEAM_NAME = 'test3'
    sigChainTest3 = await sigChainService.createChain(true)
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
    await sigChainService.saveChain(sigChainTest3.teamId!)
    await sigChainService.deleteChain(sigChainTest3.teamId!, false)
    const loadedSigChain = await sigChainService.loadChain(sigChainTest3.teamId!, true)
    expect(loadedSigChain).toBeDefined()
    expect(sigChainService.getActiveChain()).toBe(loadedSigChain)
  })
  it('should delete sigchains from disk', async () => {
    await sigChainService.deleteChain(sigChainTest3.teamId!, true)
    expect(() => sigChainService.getChain(sigChainTest3.teamId!)).toThrowError()
    await expect(sigChainService.loadChain(sigChainTest3.teamId!, true)).rejects.toThrowError()
  })
  // with random team names this is impossible in the cases we care about
  it.skip('should not allow duplicate chains to be added', async () => {
    await sigChainService.createChain(false)
    await expect(sigChainService.createChain(false)).rejects.toThrowError()
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
  })
  it('should handle concurrent chain operations correctly', async () => {
    const [chain1, chain2] = await Promise.all([sigChainService.createChain(true), sigChainService.createChain(false)])
    expect(sigChainService.getChain(chain1.teamId!)).toBeDefined()
    expect(sigChainService.getChain(chain2.teamId!)).toBeDefined()
    expect(handleChainUpdateSpy).toBeCalledTimes(2)
  })
})

describe('SigChainService - listener lifecycle', () => {
  let module: TestingModule
  let sigChainService: SigChainService
  let localDbService: LocalDbService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, SigChainModule, LocalDbModule],
    }).compile()
    sigChainService = await module.resolve(SigChainService)
    localDbService = await module.resolve(LocalDbService)
    await localDbService.open()
  })

  afterAll(async () => {
    await localDbService.close()
    await module.close()
  })

  it('does not accumulate listeners on chains when switching active chain', async () => {
    const chainA: SigChain = await sigChainService.createChain(true)
    // chainA is active: one listener attached
    expect(chainA.listenerCount(SigchainEvents.UPDATED)).toBe(1)

    const chainB: SigChain = await sigChainService.createChain(true)
    // Active switched A → B. detachSocketListeners(A) must have removed A's listener.
    expect(chainA.listenerCount(SigchainEvents.UPDATED)).toBe(0)
    expect(chainB.listenerCount(SigchainEvents.UPDATED)).toBe(1)

    sigChainService.setActiveChain(chainA.teamId!)
    // Active switched B → A. detachSocketListeners(B) must have removed B's listener,
    // and attachSocketListeners(A) adds exactly one to A.
    expect(chainA.listenerCount(SigchainEvents.UPDATED)).toBe(1)
    expect(chainB.listenerCount(SigchainEvents.UPDATED)).toBe(0)
  })

  it('does not emit iOS-native key or device events on non-ios platforms', async () => {
    const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')

    await sigChainService.createChain(true)

    expect(emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)).toHaveLength(0)
    expect(emitSpy.mock.calls.filter(([event]) => event === SocketEvents.DEVICE_CREDENTIALS_UPDATED)).toHaveLength(0)
  })

  it('emits new keys to iOS once and does not resend already-stored keys', async () => {
    const originalPlatform = process.platform
    const originalQpsAllowed = process.env.QPS_ALLOWED
    Object.defineProperty(process, 'platform', { value: 'ios' })
    process.env.QPS_ALLOWED = 'true'

    try {
      const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')
      const chain = await sigChainService.createChain(true)
      const teamId = chain.teamId!

      await waitForExpect(async () => {
        const keyCalls = emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)
        expect(keyCalls).toHaveLength(1)
        expect((keyCalls[0][1] as { keys: unknown[] }).keys.length).toBeGreaterThan(0)
        const storedKeys = await localDbService.getKeysStoredInKeychain(teamId)
        expect(storedKeys).toHaveLength((keyCalls[0][1] as { keys: unknown[] }).keys.length)
      })

      const storedKeysAfterFirstUpdate = await localDbService.getKeysStoredInKeychain(teamId)

      chain.emit('updated')

      await new Promise(resolve => setTimeout(resolve, 25))

      expect(emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)).toHaveLength(1)
      expect(await localDbService.getKeysStoredInKeychain(teamId)).toEqual(storedKeysAfterFirstUpdate)
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
      if (originalQpsAllowed == null) {
        delete process.env.QPS_ALLOWED
      } else {
        process.env.QPS_ALLOWED = originalQpsAllowed
      }
    }
  })

  // Regression: the ledger only proves a key was emitted once, not that native storage
  // still holds it. QSS sign-in passes resendAll=true so a device that missed or lost
  // the keys (dropped emit, reinstall) gets them again without a sigchain mutation.
  it('resends already-stored keys to native storage when forced, without growing the ledger', async () => {
    const originalPlatform = process.platform
    const originalQpsAllowed = process.env.QPS_ALLOWED
    Object.defineProperty(process, 'platform', { value: 'android' })
    process.env.QPS_ALLOWED = 'true'

    try {
      const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')
      const chain = await sigChainService.createChain(true)
      const teamId = chain.teamId!

      await waitForExpect(async () => {
        expect(emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)).toHaveLength(1)
      })
      const ledgerAfterFirst = await localDbService.getKeysStoredInKeychain(teamId)
      expect(ledgerAfterFirst.length).toBeGreaterThan(0)

      // default path: nothing new, nothing emitted
      await sigChainService.updateKeysInNativeStorage(teamId)
      expect(emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)).toHaveLength(1)

      // forced path: everything re-emitted, ledger unchanged
      await sigChainService.updateKeysInNativeStorage(teamId, true)
      const keyCalls = emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)
      expect(keyCalls).toHaveLength(2)
      expect((keyCalls[1][1] as { keys: unknown[] }).keys.length).toBe(ledgerAfterFirst.length)
      expect(await localDbService.getKeysStoredInKeychain(teamId)).toEqual(ledgerAfterFirst)
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
      process.env.QPS_ALLOWED = originalQpsAllowed
    }
  })

  it('emits new keys to Android once and does not resend already-stored keys', async () => {
    const originalPlatform = process.platform
    const originalQpsAllowed = process.env.QPS_ALLOWED
    Object.defineProperty(process, 'platform', { value: 'android' })
    process.env.QPS_ALLOWED = 'true'

    try {
      const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')
      const chain = await sigChainService.createChain(true)
      const teamId = chain.teamId!

      await waitForExpect(async () => {
        const keyCalls = emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)
        expect(keyCalls).toHaveLength(1)
        expect((keyCalls[0][1] as { keys: unknown[] }).keys.length).toBeGreaterThan(0)
        const storedKeys = await localDbService.getKeysStoredInKeychain(teamId)
        expect(storedKeys).toHaveLength((keyCalls[0][1] as { keys: unknown[] }).keys.length)
      })

      const storedKeysAfterFirstUpdate = await localDbService.getKeysStoredInKeychain(teamId)

      chain.emit('updated')

      await new Promise(resolve => setTimeout(resolve, 25))

      expect(emitSpy.mock.calls.filter(([event]) => event === SocketEvents.KEYS_UPDATED)).toHaveLength(1)
      expect(await localDbService.getKeysStoredInKeychain(teamId)).toEqual(storedKeysAfterFirstUpdate)
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
      if (originalQpsAllowed == null) {
        delete process.env.QPS_ALLOWED
      } else {
        process.env.QPS_ALLOWED = originalQpsAllowed
      }
    }
  })

  it('emits device credentials for the NSE on ios', async () => {
    const originalPlatform = process.platform
    const originalQpsAllowed = process.env.QPS_ALLOWED
    Object.defineProperty(process, 'platform', { value: 'ios' })
    process.env.QPS_ALLOWED = 'true'

    try {
      const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')
      const chain = await sigChainService.createChain(true)

      await waitForExpect(() => {
        const deviceCalls = emitSpy.mock.calls.filter(([event]) => event === SocketEvents.DEVICE_CREDENTIALS_UPDATED)
        expect(deviceCalls).toHaveLength(1)
        expect(deviceCalls[0][1]).toEqual({
          deviceId: chain.device.deviceId,
          teamId: chain.teamId!,
          signingPrivateKey: chain.device.keys.signature.secretKey,
        })
      })
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
      if (originalQpsAllowed == null) {
        delete process.env.QPS_ALLOWED
      } else {
        process.env.QPS_ALLOWED = originalQpsAllowed
      }
    }
  })

  it('emits device credentials for the NSE on android', async () => {
    const originalPlatform = process.platform
    const originalQpsAllowed = process.env.QPS_ALLOWED
    Object.defineProperty(process, 'platform', { value: 'android' })
    process.env.QPS_ALLOWED = 'true'

    try {
      const emitSpy = jest.spyOn(sigChainService.serverIoProvider.io, 'emit')
      const chain = await sigChainService.createChain(true)

      await waitForExpect(() => {
        const deviceCalls = emitSpy.mock.calls.filter(([event]) => event === SocketEvents.DEVICE_CREDENTIALS_UPDATED)
        expect(deviceCalls).toHaveLength(1)
        expect(deviceCalls[0][1]).toEqual({
          deviceId: chain.device.deviceId,
          teamId: chain.teamId!,
          signingPrivateKey: chain.device.keys.signature.secretKey,
        })
      })
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
      if (originalQpsAllowed == null) {
        delete process.env.QPS_ALLOWED
      } else {
        process.env.QPS_ALLOWED = originalQpsAllowed
      }
    }
  })
})

// QSS-006: the sigchain has to be on disk before anything downstream of a chain
// update acts on it. handleChainUpdate used to fire two un-awaited writes of the
// same value and emit UPDATED without waiting for either, so a crash between the
// event and the write left us without an entry a peer was already relying on,
// and a write failure was invisible to every caller.
describe('SigChainService - durable chain writes', () => {
  let module: TestingModule
  let sigChainService: SigChainService
  let localDbService: LocalDbService
  let chain: SigChain
  let teamId: string

  const deferred = <T = void>() => {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, SigChainModule, LocalDbModule],
    }).compile()
    sigChainService = await module.resolve(SigChainService)
    localDbService = await module.resolve(LocalDbService)
    await localDbService.open()
    chain = await sigChainService.createChain(true)
    teamId = chain.teamId!
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await localDbService.close()
    await module.close()
  })

  it('writes the chain exactly once per chain update', async () => {
    const setSigChainSpy = jest.spyOn(localDbService, 'setSigChain')

    chain.emit(SigchainEvents.UPDATED)

    await waitForExpect(() => {
      expect(setSigChainSpy).toHaveBeenCalledTimes(1)
    })
    // Give any second, un-awaited write the chance to land before we conclude
    // there is only one.
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(setSigChainSpy).toHaveBeenCalledTimes(1)
    expect(setSigChainSpy).toHaveBeenCalledWith(chain, teamId)
  })

  it('emits UPDATED only after the write has resolved', async () => {
    const write = deferred()
    jest.spyOn(localDbService, 'setSigChain').mockImplementation(async () => {
      await write.promise
    })
    const updates: string[] = []
    sigChainService.on(SigchainEvents.UPDATED, (id: string) => updates.push(id))

    chain.emit(SigchainEvents.UPDATED)

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(updates).toHaveLength(0)

    write.resolve()

    await waitForExpect(() => {
      expect(updates).toEqual([teamId])
    })
  })

  it('serializes writes for a team so a stale serialization cannot land last', async () => {
    const order: string[] = []
    const firstWrite = deferred()
    let writeCount = 0
    jest.spyOn(localDbService, 'setSigChain').mockImplementation(async () => {
      const n = ++writeCount
      order.push(`start-${n}`)
      if (n === 1) {
        await firstWrite.promise
      }
      order.push(`end-${n}`)
    })

    const first = sigChainService.persistChain(teamId)
    // Wait until the first write has actually reached the database. A caller
    // arriving after that cannot be served by it, because that write already
    // serialized the team.
    await waitForExpect(() => {
      expect(order).toEqual(['start-1'])
    })

    const second = sigChainService.persistChain(teamId)
    // The second write must not begin while the first is still in flight,
    // otherwise the earlier serialization can be committed after the later one.
    expect(writeCount).toBe(1)

    firstWrite.resolve()
    await Promise.all([first, second])

    expect(order).toEqual(['start-1', 'end-1', 'start-2', 'end-2'])
  })

  // private#203 M-4: a peer that can restart the handshake was able to queue an
  // unbounded number of serialize-and-write tasks, delaying every other write
  // for the team. Ordinary writes now coalesce onto one pending task, and the
  // admission gate refuses rather than growing the queue without limit.
  it('coalesces writes queued before the disk is reached into a single write', async () => {
    const write = deferred()
    let started = 0
    const setSigChainSpy = jest.spyOn(localDbService, 'setSigChain').mockImplementation(async () => {
      started += 1
      await write.promise
    })

    const first = sigChainService.persistChain(teamId)
    await waitForExpect(() => {
      expect(started).toBe(1)
    })

    // Twenty more updates arrive while that write is in flight. They describe
    // the same live chain, so one further write covers all of them.
    const queued = Array.from({ length: 20 }, () => sigChainService.persistChain(teamId))
    expect(sigChainService.pendingPersistCount(teamId)).toBe(21)

    write.resolve()
    await Promise.all([first, ...queued])

    expect(setSigChainSpy).toHaveBeenCalledTimes(2)
    expect(sigChainService.pendingPersistCount(teamId)).toBe(0)
  })

  it('gives every coalesced admission its own completion, resolved by a write that saw its state', async () => {
    const order: string[] = []
    const write = deferred()
    let started = 0
    jest.spyOn(localDbService, 'setSigChain').mockImplementation(async () => {
      started += 1
      if (started === 1) {
        await write.promise
      }
      order.push(`write-${started}`)
    })

    const blocking = sigChainService.persistChain(teamId)
    await waitForExpect(() => {
      expect(started).toBe(1)
    })

    // Two admissions for the same head share one write, and neither completion
    // can be skipped: both must still be told when that write lands.
    const settled: string[] = []
    const admissionA = sigChainService.persistChain(teamId, 'admission').then(() => settled.push('a'))
    const admissionB = sigChainService.persistChain(teamId, 'admission').then(() => settled.push('b'))

    expect(settled).toHaveLength(0)

    write.resolve()
    await Promise.all([blocking, admissionA, admissionB])

    expect(settled.sort()).toEqual(['a', 'b'])
    // One shared write served both admissions, and it started after they were
    // queued, so it serialized their state.
    expect(order).toEqual(['write-1', 'write-2'])
  })

  it('fails the admission gate closed past the pending-write bound', async () => {
    const write = deferred()
    jest.spyOn(localDbService, 'setSigChain').mockImplementation(async () => {
      await write.promise
    })

    const bound = 64
    const queued = Array.from({ length: bound }, () => sigChainService.persistChain(teamId).catch(() => undefined))
    expect(sigChainService.pendingPersistCount(teamId)).toBe(bound)

    await expect(sigChainService.persistChain(teamId, 'admission')).rejects.toThrow(/already pending/)

    write.resolve()
    await Promise.all(queued)
  })

  it('still accepts ordinary updates at the bound, because they add no new work', async () => {
    const write = deferred()
    let started = 0
    const setSigChainSpy = jest.spyOn(localDbService, 'setSigChain').mockImplementation(async () => {
      started += 1
      await write.promise
    })

    const bound = 64
    const queued = Array.from({ length: bound }, () => sigChainService.persistChain(teamId))
    await waitForExpect(() => {
      expect(started).toBe(1)
    })
    expect(sigChainService.pendingPersistCount(teamId)).toBe(bound)

    // An update at the bound is served rather than refused: it joins the write
    // already queued behind the running one instead of adding another.
    const extra = sigChainService.persistChain(teamId)
    expect(setSigChainSpy).toHaveBeenCalledTimes(1)

    write.resolve()
    await Promise.all([...queued, extra])
    expect(setSigChainSpy).toHaveBeenCalledTimes(2)
  })

  it('does not serialize writes for different teams against each other', async () => {
    const otherChain = await sigChainService.createChain(false)
    const otherTeamId = otherChain.teamId!
    const started: string[] = []
    const block = deferred()
    jest.spyOn(localDbService, 'setSigChain').mockImplementation(async (_chain: SigChain, id: string) => {
      started.push(id)
      await block.promise
    })

    const first = sigChainService.persistChain(teamId)
    const second = sigChainService.persistChain(otherTeamId)

    await waitForExpect(() => {
      expect(started.sort()).toEqual([teamId, otherTeamId].sort())
    })

    block.resolve()
    await Promise.all([first, second])
  })

  it('propagates write failures to the caller instead of swallowing them', async () => {
    jest.spyOn(localDbService, 'setSigChain').mockRejectedValueOnce(new Error('disk is on fire'))

    await expect(sigChainService.persistChain(teamId)).rejects.toThrow('disk is on fire')
  })

  it('does not let a failed write block later writes for the same team', async () => {
    const setSigChainSpy = jest.spyOn(localDbService, 'setSigChain').mockRejectedValueOnce(new Error('disk is on fire'))

    await expect(sigChainService.persistChain(teamId)).rejects.toThrow('disk is on fire')
    await expect(sigChainService.persistChain(teamId)).resolves.toBeUndefined()
    expect(setSigChainSpy).toHaveBeenCalledTimes(2)
  })

  it('does not emit UPDATED when the write fails', async () => {
    jest.spyOn(localDbService, 'setSigChain').mockRejectedValue(new Error('disk is on fire'))
    const updates: string[] = []
    sigChainService.on(SigchainEvents.UPDATED, (id: string) => updates.push(id))

    chain.emit(SigchainEvents.UPDATED)

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(updates).toHaveLength(0)
  })
})

/**
 * private#203 iteration-3 M-1. The rollback itself opened a hole: it installed a
 * clean replacement team and lifted the write block before the connections
 * holding the discarded team were closed, and the gate looked its team up by ID.
 * A second connection could then have the replacement persisted, have its gate
 * resolve on that write, and go on to release an acceptance serialized from the
 * discarded graph, carrying an admission that never reached disk.
 */
describe('SigChainService - admission gate isolation', () => {
  let module: TestingModule
  let sigChainService: SigChainService
  let localDbService: LocalDbService
  let chain: SigChain
  let teamId: string

  const deferred = <T = void>() => {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, SigChainModule, LocalDbModule],
    }).compile()
    sigChainService = await module.resolve(SigChainService)
    localDbService = await module.resolve(LocalDbService)
    await localDbService.open()
    chain = await sigChainService.createChain(true)
    teamId = chain.teamId!
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await localDbService.close()
    await module.close()
  })

  it('refuses a gate holding the discarded team, during the rollback and after it', async () => {
    const discarded = chain.team!

    // A's write fails, so the rollback guard goes up synchronously.
    sigChainService.beginChainRollback(teamId)

    // B reaches its gate in the window before the replacement is installed. It
    // still holds the same object, so only the block can stop it.
    await expect(sigChainService.persistAdmittedTeam(discarded)).rejects.toThrow(/never persisted|rollback/)

    // The reload installs a different team object.
    await sigChainService.restoreChainToDurableState(teamId)
    expect(chain.team).not.toBe(discarded)

    // B reaches its gate after the reload. Looking the team up by ID would find
    // the clean replacement and let this succeed.
    await expect(sigChainService.persistAdmittedTeam(discarded)).rejects.toBeInstanceOf(AdmittingTeamReplacedError)
  })

  it('does not resolve a gate on the discarded team with a write of the replacement', async () => {
    const discarded = chain.team!
    const writes: unknown[] = []
    jest.spyOn(localDbService, 'setSigChainFromTeam').mockImplementation(async (team: any) => {
      writes.push(team)
    })

    sigChainService.beginChainRollback(teamId)
    // Attach the handler immediately: this gate rejects while the reload is
    // still awaiting, and an unhandled rejection would fail the run.
    const gate = sigChainService.persistAdmittedTeam(discarded).then(
      () => 'resolved',
      () => 'rejected'
    )
    await sigChainService.restoreChainToDurableState(teamId)

    expect(await gate).toBe('rejected')
    // Whatever else happened, no write of the replacement was allowed to stand
    // in for the discarded team's admission.
    expect(writes).not.toContain(chain.team)
  })

  it('waits for a put that was already in flight before reading durable state', async () => {
    const put = deferred()
    const order: string[] = []
    jest.spyOn(localDbService, 'setSigChainFromTeam').mockImplementation(async () => {
      order.push('put-start')
      await put.promise
      order.push('put-end')
    })

    // A write is mid-put, holding bytes serialized before the rollback.
    const inFlight = sigChainService.persistChain(teamId)
    await waitForExpect(() => {
      expect(order).toEqual(['put-start'])
    })

    sigChainService.beginChainRollback(teamId)
    const restore = sigChainService.restoreChainToDurableState(teamId).then(() => order.push('restored'))

    // The restore must not read the stored value while that put can still land.
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(order).toEqual(['put-start'])

    put.resolve()
    await inFlight
    await restore

    expect(order).toEqual(['put-start', 'put-end', 'restored'])
  })

  it('shares one write across repeated gates for the same head, and rolls nothing back', async () => {
    const write = deferred()
    let started = 0
    jest.spyOn(localDbService, 'setSigChainFromTeam').mockImplementation(async () => {
      started += 1
      await write.promise
    })

    const team = chain.team!
    const gates = Array.from({ length: 80 }, () => sigChainService.persistAdmittedTeam(team))

    await waitForExpect(() => {
      expect(started).toBe(1)
    })
    // Eighty gates for one head, one write, and nowhere near the backlog bound:
    // a peer re-running the handshake cannot spend the team's capacity or push
    // it into a rollback (audit L-2).
    expect(sigChainService.pendingPersistCount(teamId)).toBe(1)

    write.resolve()
    await Promise.all(gates)

    expect(started).toBe(1)
    expect(sigChainService.rollbackCount(teamId)).toBe(0)

    // The head is durable now, so another gate for it costs no write at all.
    await sigChainService.persistAdmittedTeam(team)
    expect(started).toBe(1)
  })

  it('refuses for capacity without rolling the team back', async () => {
    const write = deferred()
    jest.spyOn(localDbService, 'setSigChainFromTeam').mockImplementation(async () => {
      await write.promise
    })

    const queued = Array.from({ length: 64 }, () => sigChainService.persistChain(teamId))
    await expect(sigChainService.persistChain(teamId, 'admission')).rejects.toBeInstanceOf(PersistenceBacklogError)
    expect(sigChainService.rollbackCount(teamId)).toBe(0)

    write.resolve()
    await Promise.all(queued)
  })
})
