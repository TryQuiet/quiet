import KeyValueStore from 'orbit-db-kvstore'
import Store from 'orbit-db-store'
import Logger from '../common/logger'
import EventStore from 'orbit-db-eventstore'
import { EventEmitter } from 'events'

export default abstract class LocalStore<V, S extends KeyValueStore<V> | EventStore<V>> extends EventEmitter {
  protected logger: ReturnType<typeof Logger>
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
    await this.store?.close()
  }

  abstract clean(): void
  abstract addEntry(entry: V): Promise<V | undefined>
}
