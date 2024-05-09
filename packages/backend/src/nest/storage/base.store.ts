import KeyValueStore from 'orbit-db-kvstore'
import Store from 'orbit-db-store'
import EventStore from 'orbit-db-eventstore'
import { EventEmitter } from 'events'
import Logger from '../common/logger'

const logger = Logger('store')

abstract class StoreBase<V, S extends KeyValueStore<V> | EventStore<V>> extends EventEmitter {
  protected abstract store: S | undefined

  getStore() {
    if (!this.store) {
      throw new Error('Store not initialized')
    }
    return this.store
  }

  getAddress(): Store['address'] {
    return this.getStore().address
  }

  async close(): Promise<void> {
    logger('Closing', this.getAddress())
    await this.store?.close()
  }

  abstract init(): Promise<void>
  abstract clean(): void
}

export abstract class KeyValueStoreBase<V> extends StoreBase<V, KeyValueStore<V>> {
  protected store: KeyValueStore<V> | undefined
  abstract setEntry(key: string, value: V): Promise<V>
  abstract getEntry(key?: string): V | null
}

export abstract class EventStoreBase<V> extends StoreBase<V, EventStore<V>> {
  protected store: EventStore<V> | undefined
  abstract addEntry(value: V): Promise<string>
  abstract getEntries(): Promise<V[]>
}
