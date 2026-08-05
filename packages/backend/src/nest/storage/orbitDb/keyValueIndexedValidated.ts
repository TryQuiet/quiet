export type KeyValueIndexedValidatedType<T = any> = KeyValueType<T> & {
  retryIndexingUnindexedEntries: () => Promise<void>
}
/**
 * Forked from:
 * https://github.com/orbitdb/orbitdb/blob/9ddffd346a26937902cacf0a33ee8210bdc637a0/src/databases/keyvalue-indexed.js
 *
 * Adds validation function that validates each entry before adding it to the
 * index. This is used to validate each entry in OrbitDB upon retrieval (vs
 * write). In the latest version of OrbitDB, access controllers now validate
 * each entry, but there might still be other reasons why we would want to
 * continue using this (e.g. flexibility in how we treat "invalid" data).
 */

/**
 * @namespace Databases-KeyValueIndexed
 * @memberof module:Databases
 * @description
 * Key-Value database that uses an index in order to provide fast queries.
 *
 * Key-value pairs are stored to the configured storage.
 * @example <caption>Specify a custom storage</caption>
 * import { createHelia } from 'helia'
 * import { createOrbitDB, KeyValueIndexed, IPFSBlockStorage } from 'orbitdb'
 *
 * const ipfs = createHelia()
 * const storage = await IPFSBlockStorage({ ipfs })
 * const orbitdb = await createOrbitDB({ ipfs })
 * const db = await orbitdb.open('my-kv', { Database: KeyValueIndexed({ storage }) })
 *
 * @augments module:Databases~Database
 * @augments module:Databases.Databases-KeyValue
 */
import { AccessControllerType, LevelStorage, IdentitiesType, LogEntry, KeyValueType, LogType } from '@orbitdb/core'
import { HeliaLibp2p, type Helia } from 'helia'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { createLogger } from '../../common/logger'
import { abortableAsyncIterable } from '../../common/utils'
import { KeyValueWithStorage } from './keyValueWithStorage'

import { posixJoin } from './util'
import { OrbitDbOp } from './orbitdb.types'

type ValidateFn<T> = (entry: LogEntry<T>) => Promise<boolean>

const valueEncoding = 'json'

const logger = createLogger('orbitdb:keyValueIndexedValidated')

const isValidOp = (op: string): boolean => op === OrbitDbOp.PUT || op === OrbitDbOp.DEL

/**
 * Defines an index for a KeyValue database.
 * @param {string} [directory] A location for storing the index-related data
 * @return {Index} A Index function.
 */
const Index =
  ({ directory, validateFn }: { directory?: string; validateFn?: ValidateFn<any> } = {}) =>
  async () => {
    const index = await LevelStorage({ path: directory ?? undefined, valueEncoding })
    const indexedEntries = await LevelStorage({
      path: posixJoin(directory ?? './level', '/_indexedEntries/'),
      valueEncoding,
    })

    const update = async (log: LogType, entry: LogEntry, traverseFullLog = false) => {
      const keys = new Set()
      const toBeIndexed = new Set()
      const latest = entry.hash

      // Function to check if a hash is in the entry index
      const isIndexed = async (hash: string) => (await indexedEntries.get(hash)) === true
      const isNotIndexed = async (hash: string) => !(await isIndexed(hash))

      // Function to decide when the log traversal should be stopped
      const shouldStopTraverse = async (entry: LogEntry) => {
        // Retry must revisit invalid entries even when indexed descendants would
        // ordinarily form an early-stop boundary.
        if (traverseFullLog) return false

        // Go through the nexts of an entry and if any is not yet
        // indexed, add it to the list of entries-to-be-indexed
        for await (const hash of entry.next) {
          if (await isNotIndexed(hash)) {
            toBeIndexed.add(hash)
          }
        }
        // If the latest entry and all its nexts are indexed and to-be-indexed list is empty,
        // we don't have anything more to process, so return true to stop the traversal
        return (await isIndexed(latest)) && toBeIndexed.size === 0
      }

      // Traverse the log and stop when everything has been processed
      for await (const entry of log.traverse(null, shouldStopTraverse)) {
        const { hash, payload } = entry
        const { op, key } = payload
        // If an entry is not yet indexed, process it
        if (await isNotIndexed(hash)) {
          if (!isValidOp(op)) {
            logger.warn(`Unsupported entry operation detected: ${op}, skipping indexing`)
            // Unsupported operations can never affect a key/value projection,
            // so mark them terminal instead of reconsidering them on every retry.
            await indexedEntries.put(hash, true)
            toBeIndexed.delete(hash)
            continue
          }

          const isValid = validateFn ? await validateFn(entry) : true
          if (isValid) {
            if (!keys.has(key)) {
              keys.add(key)
              if (op === OrbitDbOp.PUT) {
                await index.put(key as string, encodeEntry(entry))
              } else {
                await index.del(key as string)
              }
            }
            await indexedEntries.put(hash, true)
          } else {
            logger.warn(`Invalid entry detected: ${hash}, skipping indexing`)
          }
          // Remove the entry (hash) from the list of to-be-indexed entries
          toBeIndexed.delete(hash)
        } else if (isValidOp(op)) {
          keys.add(key)
        }
      }
    }

    /**
     * Closes the index and its storages.
     */
    const close = async () => {
      await index.close()
      await indexedEntries.close()
    }

    /**
     * Drops all records from the index and its storages.
     */
    const drop = async () => {
      await index.clear()
      await indexedEntries.clear()
    }

    const encodeEntry = (entry: LogEntry): any => {
      switch (valueEncoding as string) {
        case 'buffer':
          return Buffer.from(JSON.stringify(entry))
        case 'view':
          return Buffer.from(JSON.stringify(entry))
        case 'json':
          return entry
        case 'utf8':
          return JSON.stringify(entry)
        default:
          throw new Error(`Don't know how to handle the encoding ${valueEncoding}`)
      }
    }

    const decodeEntry = (entryBuffer: Uint8Array) => {
      return JSON.parse(uint8ArrayToString(entryBuffer, 'utf8'))
    }

    return {
      get: index.get,
      iterator: index.iterator,
      update,
      close,
      drop,
    }
  }

/**
 * Defines a KeyValueIndexed database.
 * @param {module:Storage} [storage=LevelStorage] A compatible storage where
 * the key/value pairs are indexed.
 * @return {module:Databases.Databases-KeyValueIndexed} A KeyValueIndexed
 * function.
 * @memberof module:Databases
 */
export const KeyValueIndexedValidated =
  (validateFn?: ValidateFn<any>) =>
  async ({
    ipfs,
    identity,
    address,
    name,
    access,
    directory,
    meta,
    referencesCount,
    syncAutomatically,
    onUpdate,
  }: {
    ipfs: HeliaLibp2p
    identity: IdentitiesType
    address: string
    name: string
    access: AccessControllerType
    directory: string
    meta: Record<string, any>
    referencesCount: number
    syncAutomatically: boolean
    onUpdate: (log: LogType, entry: LogEntry) => Promise<void>
  }) => {
    logger.info(`Initializing KeyValueIndexed OrbitDB database using custom storage`)

    // Set up the index
    const index = await Index({ directory: posixJoin(directory || './orbitdb', `./${address}/_index`), validateFn })()
    let indexOperationQueue: Promise<void> = Promise.resolve()
    const enqueueIndexOperation = (operation: () => Promise<void>) => {
      const result = indexOperationQueue.then(operation)
      // Return each failure to its caller without poisoning later index work.
      indexOperationQueue = result.catch(() => undefined)
      return result
    }

    const updateIndex = (log: LogType, entry: LogEntry) => enqueueIndexOperation(() => index.update(log, entry))

    // Set up the underlying KeyValue database
    const keyValueStore: KeyValueType = await KeyValueWithStorage()({
      ipfs,
      identity,
      address,
      name,
      access,
      directory,
      meta,
      referencesCount,
      syncAutomatically,
      onUpdate: updateIndex,
    })

    keyValueStore.events.on('error', error => {
      logger.error(`Error on OrbitDB DB ${keyValueStore.address}`, error)
    })

    /**
     * Traverses the complete log and attempts to index entries that are not currently indexed.
     * Useful for retrying entries that previously failed validation.
     */
    const retryIndexingUnindexedEntries = async () => {
      await enqueueIndexOperation(async () => {
        const [head] = await keyValueStore.log.heads()
        if (head) await index.update(keyValueStore.log, head, true)
      })
    }

    /**
     * Gets a value from the store by key.
     * @function
     * @param {string} key The key of the value to get.
     * @return {*} The value corresponding to key or null.
     * @memberof module:Databases.Databases-KeyValueIndexed
     * @instance
     */
    const get = async (key: string) => {
      try {
        const entry = await index.get(key)
        if (entry) {
          return entry.payload.value
        }
      } catch (e) {
        keyValueStore.events.emit('error', e)
      }

      return undefined
    }

    /**
     * Iterates over keyvalue pairs.
     * @function
     * @param {Object} [filters={}] Various filters to apply to the iterator.
     * @param {string} [filters.amount=-1] The number of results to fetch.
     * @yields [string, string, string] The next key/value as key/value/hash.
     * @memberof module:Databases.Databases-KeyValueIndexed
     * @instance
     */
    const iterator = async function* ({ amount }: { amount?: number } = {}) {
      const abortController = new AbortController()
      try {
        const it = abortableAsyncIterable(index.iterator({ amount, reverse: true }), abortController.signal)
        for await (const record of it) {
          // 'index' is a LevelStorage that returns a [key, value] pair
          const entry = record[1]
          const { key, value } = entry.payload
          const hash = entry.hash
          yield { key, value, hash }
        }
      } catch (e) {
        if (!abortController.signal.aborted) {
          abortController.abort(e)
        }
        keyValueStore.events.emit('error', e)
      }
    }

    const all = async () => {
      const values = []
      for await (const entry of iterator()) {
        values.unshift(entry)
      }
      return values
    }

    /**
     * Closes the index and underlying storage.
     */
    const close = async () => {
      await indexOperationQueue
      await keyValueStore.close()
      await index.close()
    }

    /**
     * Drops all records from the index and underlying storage.
     */
    const drop = async () => {
      await indexOperationQueue
      await keyValueStore.drop()
      await index.drop()
    }

    return {
      ...keyValueStore,
      get,
      iterator,
      all,
      close,
      drop,
      retryIndexingUnindexedEntries,
    }
  }

KeyValueIndexedValidated.type = 'KeyValueIndexedValidated'
