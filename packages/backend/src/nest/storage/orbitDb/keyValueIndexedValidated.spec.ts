import fs from 'fs'

import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import { Entry, IPFSAccessController, type LogEntry } from '@orbitdb/core'

import { SigChainService } from '../../auth/sigchain.service'
import { SigChainModule } from '../../auth/sigchain.service.module'
import { TestModule } from '../../common/test.module'
import { spawnLibp2pInstancesInMemory } from '../../common/test-utils'
import { IpfsModule } from '../../ipfs/ipfs.module'
import { IpfsService } from '../../ipfs/ipfs.service'
import { Libp2pModule } from '../../libp2p/libp2p.module'
import { Libp2pService } from '../../libp2p/libp2p.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { StorageModule } from '../storage.module'
import { OrbitDbService } from './orbitDb.service'
import { OrbitDbOp } from './orbitdb.types'
import { KeyValueIndexedValidated, KeyValueIndexedValidatedType } from './keyValueIndexedValidated'

type ValidateFn = (entry: LogEntry<string>) => Promise<boolean>

type Operation =
  | { op: OrbitDbOp.PUT; value: string }
  | {
      op: OrbitDbOp.DEL
    }

type ConcurrentHead = 'winner' | 'loser'

const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>(promiseResolve => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

describe('KeyValueIndexedValidated', () => {
  let module: TestingModule
  let libp2pService: Libp2pService
  let ipfsService: IpfsService
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let storeSequence = 0
  const openStores = new Set<KeyValueIndexedValidatedType<string>>()

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, Libp2pModule, IpfsModule, SigChainModule],
    }).compile()

    libp2pService = await module.resolve(Libp2pService)
    await spawnLibp2pInstancesInMemory([module])

    ipfsService = await module.resolve(IpfsService)
    await ipfsService.createInstance()

    localDbService = await module.resolve(LocalDbService)
    const sigchainService = module.get<SigChainService>(SigChainService)
    await sigchainService.createChain(true)

    orbitDbService = await module.resolve(OrbitDbService)
    await orbitDbService.create(ipfsService.ipfsInstance!)
  })

  afterAll(async () => {
    await orbitDbService?.stop()
    if (fs.existsSync(orbitDbService.orbitDbDir)) {
      fs.rmSync(orbitDbService.orbitDbDir, { recursive: true })
    }
    await ipfsService?.stop()
    await libp2pService?.close()
    await localDbService?.close()
    await module?.close()
  })

  afterEach(async () => {
    const stores = [...openStores]
    openStores.clear()
    await Promise.all(stores.map(async store => store.close()))
  })

  const openStore = async ({ name, validateFn }: { name?: string; validateFn?: ValidateFn } = {}) => {
    const storeName = name ?? `validated-index-${++storeSequence}`
    const store = await orbitDbService.open<KeyValueIndexedValidatedType<string>>(storeName, {
      type: 'KeyValueIndexedValidated',
      Database: KeyValueIndexedValidated(validateFn),
      AccessController: IPFSAccessController({ write: ['*'] }),
      sync: false,
    })
    openStores.add(store)
    return store
  }

  const reopenStore = async (store: KeyValueIndexedValidatedType<string>, validateFn?: ValidateFn) => {
    const address = store.address
    await store.close()
    openStores.delete(store)
    const reopened = await orbitDbService.open<KeyValueIndexedValidatedType<string>>(address, {
      type: 'KeyValueIndexedValidated',
      Database: KeyValueIndexedValidated(validateFn),
      AccessController: IPFSAccessController({ write: ['*'] }),
      sync: false,
    })
    openStores.add(reopened)
    return reopened
  }

  const applyOperations = async (store: KeyValueIndexedValidatedType<string>, key: string, operations: Operation[]) => {
    for (const operation of operations) {
      if (operation.op === OrbitDbOp.PUT) {
        await store.put(key, operation.value)
      } else {
        await store.del(key)
      }
    }
  }

  const getProjection = async (store: KeyValueIndexedValidatedType<string>) =>
    Object.fromEntries((await store.all()).map(({ key, value }) => [key, value]))

  const createConcurrentEntry = async (
    store: KeyValueIndexedValidatedType<string>,
    clockId: string,
    operation: Operation
  ) =>
    Entry.create(
      store.identity,
      store.log.id,
      {
        op: operation.op,
        key: 'key',
        value: operation.op === OrbitDbOp.PUT ? operation.value : null,
      },
      { id: clockId, time: 1 },
      []
    )

  describe('ordinary key/value projection', () => {
    it('indexes a PUT', async () => {
      const store = await openStore()

      await store.put('key', 'value')

      expect(await store.get('key')).toEqual('value')
    })

    it.each<{
      expected: string | undefined
      name: string
      operations: Operation[]
    }>([
      {
        name: 'keeps the newest of repeated PUTs',
        operations: [
          { op: OrbitDbOp.PUT, value: 'first' },
          { op: OrbitDbOp.PUT, value: 'second' },
          { op: OrbitDbOp.PUT, value: 'third' },
        ],
        expected: 'third',
      },
      {
        name: 'lets DEL supersede PUT',
        operations: [{ op: OrbitDbOp.PUT, value: 'value' }, { op: OrbitDbOp.DEL }],
        expected: undefined,
      },
      {
        name: 'lets PUT recreate a deleted key',
        operations: [{ op: OrbitDbOp.DEL }, { op: OrbitDbOp.PUT, value: 'recreated' }],
        expected: 'recreated',
      },
      {
        name: 'keeps a key absent after repeated DELs',
        operations: [{ op: OrbitDbOp.DEL }, { op: OrbitDbOp.DEL }],
        expected: undefined,
      },
      {
        name: 'supports PUT then DEL then PUT',
        operations: [{ op: OrbitDbOp.PUT, value: 'old' }, { op: OrbitDbOp.DEL }, { op: OrbitDbOp.PUT, value: 'new' }],
        expected: 'new',
      },
    ])('$name', async ({ expected, operations }) => {
      const store = await openStore()

      await applyOperations(store, 'key', operations)

      expect(await store.get('key')).toEqual(expected)
    })

    it('indexes independent keys without cross-key interference', async () => {
      const store = await openStore()

      await store.put('alpha', 'one')
      await store.put('beta', 'two')
      await store.put('removed', 'three')
      await store.del('removed')
      await store.put('gamma', 'four')

      expect(await getProjection(store)).toEqual({ alpha: 'one', beta: 'two', gamma: 'four' })
    })

    it('all and iterator return only visible indexed records', async () => {
      const store = await openStore({ validateFn: async entry => entry.payload.key !== 'invalid' })

      await store.put('alpha', 'one')
      await store.put('beta', 'two')
      await store.put('invalid', 'hidden')
      await store.put('removed', 'three')
      await store.del('removed')

      expect(await getProjection(store)).toEqual({ alpha: 'one', beta: 'two' })

      const records = []
      for await (const record of (store as any).iterator({ amount: 1 })) {
        records.push(record)
      }
      expect(records).toHaveLength(1)
      expect(['alpha', 'beta']).toContain(records[0].key)
    })
  })

  describe('validation and retry ordering', () => {
    it('keeps an older valid PUT visible until the newer PUT becomes valid', async () => {
      let validateNewPut = false
      const store = await openStore({
        validateFn: async entry => entry.payload.value !== 'new' || validateNewPut,
      })

      await store.put('key', 'old')
      await store.put('key', 'new')

      expect(await store.get('key')).toEqual('old')

      validateNewPut = true
      await store.retryIndexingUnindexedEntries()

      expect(await store.get('key')).toEqual('new')
    })

    it('keeps a valid tombstone effective until a newer PUT becomes valid', async () => {
      let validateNewPut = false
      const store = await openStore({
        validateFn: async entry => entry.payload.op === OrbitDbOp.DEL || validateNewPut,
      })

      await store.del('key')
      await store.put('key', 'new')

      expect(await store.get('key')).toBeUndefined()

      validateNewPut = true
      await store.retryIndexingUnindexedEntries()

      expect(await store.get('key')).toEqual('new')
    })

    it('keeps an older valid PUT visible until the newer DEL becomes valid', async () => {
      let validateDelete = false
      const store = await openStore({
        validateFn: async entry => entry.payload.op !== OrbitDbOp.DEL || validateDelete,
      })

      await store.put('key', 'old')
      await store.del('key')

      expect(await store.get('key')).toEqual('old')

      validateDelete = true
      await store.retryIndexingUnindexedEntries()

      expect(await store.get('key')).toBeUndefined()
    })

    it('preserves a newer PUT when an older PUT becomes valid later', async () => {
      let validateOldPut = false
      const store = await openStore({
        validateFn: async entry => entry.payload.value !== 'old' || validateOldPut,
      })

      await store.put('key', 'old')
      await store.put('key', 'new')
      validateOldPut = true
      await store.retryIndexingUnindexedEntries()

      expect(await store.get('key')).toEqual('new')
    })

    it('keeps a key deleted when an older PUT becomes valid later', async () => {
      let validateOldPut = false
      const store = await openStore({
        validateFn: async entry => entry.payload.op === OrbitDbOp.DEL || validateOldPut,
      })

      await store.put('key', 'old')
      await store.del('key')
      validateOldPut = true
      await store.retryIndexingUnindexedEntries()

      expect(await store.get('key')).toBeUndefined()
    })

    it('preserves a newer PUT when an older DEL becomes valid later', async () => {
      let validateOldDelete = false
      const store = await openStore({
        validateFn: async entry => entry.payload.op === OrbitDbOp.PUT || validateOldDelete,
      })

      await store.del('key')
      await store.put('key', 'new')
      validateOldDelete = true
      await store.retryIndexingUnindexedEntries()

      expect(await store.get('key')).toEqual('new')
    })

    it('preserves the newest PUT when a full history becomes valid in one traversal', async () => {
      let canValidate = false
      const store = await openStore({ validateFn: async () => canValidate })

      await store.put('key', 'old')
      await store.del('key')
      await store.put('key', 'new')
      canValidate = true
      await store.retryIndexingUnindexedEntries()

      expect(await store.get('key')).toEqual('new')
    })

    it('recovers a newly-valid direct ancestor', async () => {
      let validateAncestor = false
      const store = await openStore({
        validateFn: async entry => entry.payload.key !== 'ancestor' || validateAncestor,
      })

      await store.put('ancestor', 'old')
      await store.put('direct-descendant', 'value')
      validateAncestor = true
      await store.retryIndexingUnindexedEntries()

      expect(await getProjection(store)).toEqual({ ancestor: 'old', 'direct-descendant': 'value' })
    })

    it('recovers a newly-valid ancestor behind indexed descendants', async () => {
      let validateAncestor = false
      const store = await openStore({
        validateFn: async entry => entry.payload.key !== 'ancestor' || validateAncestor,
      })

      await store.put('ancestor', 'old')
      await store.put('first-descendant', 'one')
      await store.put('second-descendant', 'two')
      validateAncestor = true
      await store.retryIndexingUnindexedEntries()

      expect(await getProjection(store)).toEqual({
        ancestor: 'old',
        'first-descendant': 'one',
        'second-descendant': 'two',
      })
    })

    it('revalidates a permanently invalid ancestor behind indexed descendants', async () => {
      let ancestorValidationAttempts = 0
      const store = await openStore({
        validateFn: async entry => {
          if (entry.payload.key !== 'ancestor') return true
          ancestorValidationAttempts += 1
          return false
        },
      })

      await store.put('ancestor', 'old')
      await store.put('first-descendant', 'one')
      await store.put('second-descendant', 'two')
      const attemptsBeforeRetry = ancestorValidationAttempts

      await store.retryIndexingUnindexedEntries()

      expect(ancestorValidationAttempts).toBeGreaterThan(attemptsBeforeRetry)
      expect(await store.get('ancestor')).toBeUndefined()
    })

    it('finishes retries and revalidates a permanently invalid head', async () => {
      const validationAttempts: string[] = []
      const store = await openStore({
        validateFn: async entry => {
          if (entry.payload.key === 'invalid') {
            validationAttempts.push(entry.hash)
            return false
          }
          return true
        },
      })

      await store.put('valid', 'visible')
      await store.put('invalid', 'hidden')
      await store.retryIndexingUnindexedEntries()
      await store.retryIndexingUnindexedEntries()

      expect(validationAttempts).toHaveLength(3)
      expect(await getProjection(store)).toEqual({ valid: 'visible' })
    })

    it('does not revalidate an entry after it has been successfully indexed', async () => {
      let canValidate = true
      const validateFn = jest.fn(async () => canValidate)
      const store = await openStore({ validateFn })

      await store.put('key', 'value')
      canValidate = false
      await store.retryIndexingUnindexedEntries()

      expect(validateFn).toHaveBeenCalledTimes(1)
      expect(await store.get('key')).toEqual('value')
    })
  })

  describe('persistence and reopening', () => {
    it('persists visible values and deletions across close and reopen', async () => {
      let validationCallsAfterReopen = 0
      const store = await openStore()

      await store.put('retained', 'value')
      await store.put('removed', 'value')
      await store.del('removed')

      const reopened = await reopenStore(store, async () => {
        validationCallsAfterReopen += 1
        return false
      })
      await reopened.retryIndexingUnindexedEntries()

      expect(validationCallsAfterReopen).toBe(0)
      expect(await getProjection(reopened)).toEqual({ retained: 'value' })
    })

    it('recovers an unindexed head after close and reopen', async () => {
      const store = await openStore({ validateFn: async () => false })

      await store.put('key', 'value')
      expect(await store.get('key')).toBeUndefined()

      const reopened = await reopenStore(store, async () => true)
      await reopened.retryIndexingUnindexedEntries()

      expect(await reopened.get('key')).toEqual('value')
    })
  })

  describe('concurrent LWW heads', () => {
    it.each<{
      arrivalOrder: ConcurrentHead[]
      expected: string | undefined
      loser: Operation
      name: string
      winner: Operation
    }>([
      {
        name: 'higher-LWW PUT beats a lower-LWW DEL when the winner arrives first',
        winner: { op: OrbitDbOp.PUT, value: 'winner' },
        loser: { op: OrbitDbOp.DEL },
        arrivalOrder: ['winner', 'loser'],
        expected: 'winner',
      },
      {
        name: 'higher-LWW PUT beats a lower-LWW DEL when the winner arrives last',
        winner: { op: OrbitDbOp.PUT, value: 'winner' },
        loser: { op: OrbitDbOp.DEL },
        arrivalOrder: ['loser', 'winner'],
        expected: 'winner',
      },
      {
        name: 'higher-LWW DEL beats a lower-LWW PUT when the winner arrives first',
        winner: { op: OrbitDbOp.DEL },
        loser: { op: OrbitDbOp.PUT, value: 'loser' },
        arrivalOrder: ['winner', 'loser'],
        expected: undefined,
      },
      {
        name: 'higher-LWW DEL beats a lower-LWW PUT when the winner arrives last',
        winner: { op: OrbitDbOp.DEL },
        loser: { op: OrbitDbOp.PUT, value: 'loser' },
        arrivalOrder: ['loser', 'winner'],
        expected: undefined,
      },
    ])('$name', async ({ arrivalOrder, expected, loser, winner }) => {
      const store = await openStore()
      const entries = {
        winner: await createConcurrentEntry(store, 'z-winner', winner),
        loser: await createConcurrentEntry(store, 'a-loser', loser),
      }

      for (const label of arrivalOrder) {
        await store.applyOperation(entries[label].bytes)
      }

      expect(await store.log.heads()).toHaveLength(2)
      expect(await store.get('key')).toEqual(expected)
    })

    it.each<{
      arrivalOrder: ConcurrentHead[]
      name: string
    }>([
      { name: 'winner arrives first', arrivalOrder: ['winner', 'loser'] },
      { name: 'winner arrives last', arrivalOrder: ['loser', 'winner'] },
    ])(
      'falls back to a valid concurrent head and promotes the LWW winner after retry: $name',
      async ({ arrivalOrder }) => {
        let validateWinner = false
        const store = await openStore({
          validateFn: async entry => entry.clock.id !== 'z-winner' || validateWinner,
        })
        const entries = {
          winner: await createConcurrentEntry(store, 'z-winner', { op: OrbitDbOp.PUT, value: 'winner' }),
          loser: await createConcurrentEntry(store, 'a-loser', { op: OrbitDbOp.PUT, value: 'fallback' }),
        }

        for (const label of arrivalOrder) {
          await store.applyOperation(entries[label].bytes)
        }
        expect(await store.get('key')).toEqual('fallback')

        validateWinner = true
        await store.retryIndexingUnindexedEntries()

        expect(await store.get('key')).toEqual('winner')
      }
    )

    it.each<{
      arrivalOrder: ConcurrentHead[]
      name: string
    }>([
      { name: 'winner arrives first', arrivalOrder: ['winner', 'loser'] },
      { name: 'winner arrives last', arrivalOrder: ['loser', 'winner'] },
    ])(
      'falls back to a valid PUT and promotes an initially-invalid LWW DEL after retry: $name',
      async ({ arrivalOrder }) => {
        let validateWinner = false
        const store = await openStore({
          validateFn: async entry => entry.clock.id !== 'z-winner' || validateWinner,
        })
        const entries = {
          winner: await createConcurrentEntry(store, 'z-winner', { op: OrbitDbOp.DEL }),
          loser: await createConcurrentEntry(store, 'a-loser', { op: OrbitDbOp.PUT, value: 'fallback' }),
        }

        for (const label of arrivalOrder) {
          await store.applyOperation(entries[label].bytes)
        }
        expect(await store.get('key')).toEqual('fallback')

        validateWinner = true
        await store.retryIndexingUnindexedEntries()

        expect(await store.get('key')).toBeUndefined()
      }
    )
  })

  describe('unsupported operations and events', () => {
    it('does not repeatedly revalidate an unsupported operation', async () => {
      const validateFn = jest.fn(async () => true)
      const store = await openStore({ validateFn })

      await store.addOperation({ op: 'UNSUPPORTED', key: 'key', value: 'ignored' })
      const callsAfterInsertion = validateFn.mock.calls.length
      await store.retryIndexingUnindexedEntries()
      await store.retryIndexingUnindexedEntries()

      expect(validateFn).toHaveBeenCalledTimes(callsAfterInsertion)
      expect(await store.get('key')).toBeUndefined()
    })

    it('emits update only after a valid entry is visible in the index', async () => {
      const store = await openStore()
      const handler = async (entry: LogEntry<string>) => {
        if (entry.id === store.address && entry.payload.key === 'key') {
          resolveVisibleOnUpdate(await store.get('key'))
        }
      }
      let resolveVisibleOnUpdate!: (value: string | undefined) => void
      const visibleOnUpdate = new Promise<string | undefined>(resolve => {
        resolveVisibleOnUpdate = resolve
      })
      store.events.on('update', handler)

      try {
        await store.put('key', 'value')

        await expect(visibleOnUpdate).resolves.toEqual('value')
      } finally {
        store.events.off('update', handler)
      }
    })

    it('emits an oplog update for invalid data but does not emit another update when retry exposes it', async () => {
      let canValidate = false
      const store = await openStore({ validateFn: async () => canValidate })
      const updates: LogEntry<string>[] = []
      const handler = (entry: LogEntry<string>) => {
        if (entry.id === store.address) updates.push(entry)
      }
      store.events.on('update', handler)

      try {
        await store.put('key', 'value')
        expect(updates).toHaveLength(1)
        expect(await store.get('key')).toBeUndefined()

        canValidate = true
        await store.retryIndexingUnindexedEntries()

        expect(updates).toHaveLength(1)
        expect(await store.get('key')).toEqual('value')
      } finally {
        store.events.off('update', handler)
      }
    })

    it('emits an error without an update when validation throws, then recovers on retry', async () => {
      const validationError = new Error('validation failed')
      let shouldThrow = true
      const store = await openStore({
        validateFn: async () => {
          if (shouldThrow) throw validationError
          return true
        },
      })
      const errors: Error[] = []
      const updates: LogEntry<string>[] = []
      const onError = (error: Error) => errors.push(error)
      const onUpdate = (entry: LogEntry<string>) => {
        if (entry.id === store.address) updates.push(entry)
      }
      store.events.on('error', onError)
      store.events.on('update', onUpdate)

      try {
        expect(await store.put('key', 'value')).toBeUndefined()
        expect(errors).toContain(validationError)
        expect(updates).toHaveLength(0)
        expect(await store.log.heads()).toHaveLength(1)
        expect(await store.get('key')).toBeUndefined()

        shouldThrow = false
        await store.retryIndexingUnindexedEntries()

        expect(await store.get('key')).toEqual('value')
      } finally {
        store.events.off('error', onError)
        store.events.off('update', onUpdate)
      }
    })
  })

  describe('retry concurrency', () => {
    it('serializes a retry with a newer write to the same key', async () => {
      let allowOldPut = false
      let oldPutAttemptsAfterRetry = 0
      const retryEnteredValidation = deferred()
      const releaseRetryValidation = deferred()
      const newerWriteEnteredValidation = deferred()
      const store = await openStore({
        validateFn: async entry => {
          if (entry.payload.value !== 'old') {
            newerWriteEnteredValidation.resolve()
            return true
          }
          if (!allowOldPut) return false

          oldPutAttemptsAfterRetry += 1
          if (oldPutAttemptsAfterRetry === 1) {
            retryEnteredValidation.resolve()
            await releaseRetryValidation.promise
          }
          return true
        },
      })

      await store.put('key', 'old')
      allowOldPut = true

      const retry = store.retryIndexingUnindexedEntries()
      await retryEnteredValidation.promise

      const newerWrite = store.put('key', 'new')
      let timeout: ReturnType<typeof setTimeout> | undefined
      const newerWriteRanBeforeRetryFinished = await Promise.race([
        newerWriteEnteredValidation.promise.then(() => true),
        new Promise<boolean>(resolve => {
          timeout = setTimeout(() => resolve(false), 1000)
        }),
      ])
      if (timeout) clearTimeout(timeout)

      if (newerWriteRanBeforeRetryFinished) {
        await newerWrite
      }

      releaseRetryValidation.resolve()
      await Promise.all([retry, newerWrite])

      expect(await store.get('key')).toEqual('new')
    })

    it('allows retry and a write to different keys to complete without losing either value', async () => {
      let allowBlockedPut = false
      let blockedPutAttemptsAfterRetry = 0
      const retryEnteredValidation = deferred()
      const releaseRetryValidation = deferred()
      const store = await openStore({
        validateFn: async entry => {
          if (entry.payload.key !== 'blocked') return true
          if (!allowBlockedPut) return false

          blockedPutAttemptsAfterRetry += 1
          if (blockedPutAttemptsAfterRetry === 1) {
            retryEnteredValidation.resolve()
            await releaseRetryValidation.promise
          }
          return true
        },
      })

      await store.put('blocked', 'old')
      allowBlockedPut = true

      const retry = store.retryIndexingUnindexedEntries()
      await retryEnteredValidation.promise
      const independentWrite = store.put('independent', 'new')

      releaseRetryValidation.resolve()
      await Promise.all([retry, independentWrite])

      expect(await getProjection(store)).toEqual({ blocked: 'old', independent: 'new' })
    })
  })
})
