import { AccessControllerType, IdentitiesType, LogEntry, Events, LogType } from '@orbitdb/core'
import { type Helia } from 'helia'
import { createLogger } from '../../common/logger'
import { abortableAsyncIterable } from '../../common/utils'
import { OrbitDbService } from './orbitDb.service'

const logger = createLogger('orbitdb:eventsWithStorage')

export const EventsWithStorage =
  (pinIpfs = true) =>
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
    ipfs: Helia
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
    logger.info(`Initializing Events OrbitDB database using custom storage`)

    const { entryStorage, indexStorage, headsStorage } = await OrbitDbService.createDefaultStorage(
      directory,
      address,
      ipfs,
      pinIpfs
    )

    // Set up the underlying Events database
    const db = await Events()({
      ipfs,
      identity,
      address,
      name,
      access,
      directory,
      meta,
      headsStorage,
      entryStorage,
      indexStorage,
      referencesCount,
      syncAutomatically,
      onUpdate,
      events: OrbitDbService.events,
    })

    db.events.on('error', error => {
      logger.error(`Error on OrbitDB DB ${db.address}`, error)
    })

    const iterator = async function* ({ gt, gte, lt, lte, amount }: any = {}) {
      const abortController = new AbortController()
      try {
        const it = abortableAsyncIterable(db.log.iterator({ gt, gte, lt, lte, amount }), abortController.signal)
        for await (const event of it) {
          const hash = event.hash
          const value = event.payload.value
          yield { hash, value }
        }
      } catch (e) {
        if (!abortController.signal.aborted) {
          abortController.abort(e)
        }
        db.events.emit('error', e)
      }
    }

    const get = async (hash: string): Promise<unknown> => {
      try {
        // OrbitDB Events DB get may throw or return undefined
        const result = await db.get(hash)
        return result
      } catch (e) {
        db.events.emit('error', e)
        return undefined
      }
    }

    // Canonical: expose all, get, iterator, and type
    const all = async (): Promise<{ hash: string; value: unknown }[]> => {
      try {
        return await db.all()
      } catch (e) {
        db.events.emit('error', e)
        return []
      }
    }

    return {
      ...db,
      iterator,
      get,
      all,
      type: EventsWithStorage.type,
    }
  }

EventsWithStorage.type = 'events'
