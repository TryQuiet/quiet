import { type KeyValueType, type EventsType } from '@orbitdb/core'
import { EventEmitter } from 'events'
import { createLogger } from '../common/logger'
import { EncryptedAndSignedPayload } from '../auth/services/crypto/types'
import { KeyValueIndexedValidatedType } from './orbitDb/keyValueIndexedValidated'
import { OrbitDbService } from './orbitDb/orbitDb.service'

const logger = createLogger('store')

abstract class StoreBase<V, S extends KeyValueType<V> | EventsType<V>> extends EventEmitter {
  protected abstract store: S | undefined

  getStore() {
    if (!this.store) {
      throw new Error('Store not initialized')
    }
    return this.store
  }

  getAddress(): string {
    return this.getStore().address
  }

  async close(): Promise<void> {
    logger.info('Closing', this.getAddress())
    await this.getStore().close()
    logger.info('Closed', this.getAddress())
  }

  updateMetadata(metadata: Record<string, any>): void {
    if (this.store == null) {
      throw new Error('Store must be initialized before updating metadata!')
    }
    logger.debug('Updating metadata for OrbitDB store', this.store.address)
    OrbitDbService.updateMetadata(this.store, metadata)
  }

  abstract init(...args: any[]): Promise<void> | Promise<StoreBase<V, S>>
  abstract clean(): void
}

export abstract class KeyValueStoreBase<V, U = V> extends StoreBase<V, KeyValueType<V>> {
  protected store: KeyValueType<V> | undefined
  abstract setEntry(key: string, value: U): Promise<V>
  abstract getEntry(key?: string): Promise<U | null>
}

export abstract class EncryptedKeyValueStoreBase<EncryptedType, DecryptedType> extends StoreBase<
  EncryptedType,
  KeyValueType<EncryptedType>
> {
  protected store: KeyValueType<EncryptedType> | undefined
  abstract encryptEntry(value: DecryptedType): Promise<EncryptedAndSignedPayload>
  abstract decryptEntry(value: EncryptedType): Promise<DecryptedType>
  abstract setEntry(key: string, value: DecryptedType): Promise<EncryptedType>
  abstract getEntry(key?: string): Promise<DecryptedType | null>
}

export abstract class EncryptedKeyValueIndexedValidatedStoreBase<EncryptedType, DecryptedType> extends StoreBase<
  EncryptedType,
  KeyValueIndexedValidatedType<EncryptedType>
> {
  protected store: KeyValueIndexedValidatedType<EncryptedType> | undefined
  abstract encryptEntry(value: DecryptedType): Promise<EncryptedAndSignedPayload>
  abstract decryptEntry(value: EncryptedType): Promise<DecryptedType>
  abstract setEntry(key: string, value: DecryptedType): Promise<EncryptedType>
  abstract getEntry(key?: string): Promise<DecryptedType | null>
}

export abstract class EventStoreBase<V, U = V> extends StoreBase<V, EventsType<V>> {
  protected store: EventsType<V> | undefined
  abstract addEntry(value: U): Promise<string>
  abstract getEntries(): Promise<U[]>
}

export abstract class EncryptedEventStoreBase<EncryptedType, DecryptedType> extends StoreBase<
  EncryptedType,
  EventsType<EncryptedType>
> {
  protected store: EventsType<EncryptedType> | undefined
  abstract encryptEntry(value: DecryptedType): Promise<EncryptedAndSignedPayload>
  abstract decryptEntry(value: EncryptedType): Promise<DecryptedType>
  abstract addEntry(value: DecryptedType): Promise<string>
  abstract getEntries(): Promise<DecryptedType[]>
}
