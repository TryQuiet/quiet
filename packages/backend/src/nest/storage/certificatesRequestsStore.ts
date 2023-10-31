import { EventEmitter } from 'events'
import EventStore from 'orbit-db-eventstore'
import OrbitDB from 'orbit-db'
import { getCrypto } from 'pkijs'
import { stringToArrayBuffer } from 'pvutils'
import * as Block from 'multiformats/block'

import { NoCryptoEngineError } from '@quiet/types'
import { keyObjectFromString } from '@quiet/identity'

import { StorageEvents } from './storage.types'
import createLogger from '../common/logger'

const logger = createLogger('UserProfileStore')

export class CertificatesRequestsStore {
  public orbitDb: OrbitDB
  public store: EventStore<string>

  constructor(orbitDb: OrbitDB) {
    this.orbitDb = orbitDb
  }

  public async init(emitter: EventEmitter) {
    logger('Initializing user profiles key/value store')

    this.store = await this.orbitDb.log<string>('csrs', {
      replicate: false,
      accessController: {
        write: ['*'],
      },
    })

    this.store.events.on('write', (_address, entry) => {
      logger('STORE: Saved user csr locally')
      emitter.emit(StorageEvents.LOADED_USER_CSRS, {
        csrs: [entry.payload.value],
      })
    })

    this.store.events.on('ready', async () => {
      logger('STORE: Loaded user csrs to memory')
      emitter.emit(StorageEvents.LOADED_USER_CSRS, {
        csrs: this.getCsrs(),
      })
    })

    this.store.events.on('replicated', async () => {
      logger('STORE: Replicated user csrs')
      emitter.emit(StorageEvents.LOADED_USER_CSRS, {
        csrs: this.getCsrs(),
      })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.store.load({ fetchEntryTimeout: 15000 })
  }

  public getAddress() {
    return this.store?.address
  }

  public async close() {
    await this.store?.close()
  }

  public async addUserCsr(csr: string) {
    logger('Adding user profile')
    await this.store.add(csr)
    return true
  }

  public static async validateUserCsr(csr: string) {
    try {
      const crypto = getCrypto()
      if (!crypto) {
        throw new NoCryptoEngineError()
      }

      // const profile = userProfile.profile
      // const pubKey = await keyObjectFromString(userProfile.pubKey, crypto)
      // const profileSig = stringToArrayBuffer(userProfile.profileSig)
      // const { bytes } = await Block.encode({
      //   value: profile,
      //   codec: UserProfileStore.codec,
      //   hasher: UserProfileStore.hasher,
      // })
      // const verify = await verifyDataSignature(profileSig, bytes, pubKey)




      // if (!verify) {
      //   logger.error('User profile contains invalid signature', userProfile.pubKey)
      //   return false
      // }

      // We only accept PNG for now. I think some care needs to be used
      // with the Image element since it can make web requests and
      // accepts a variety of formats that we may want to limit. Some
      // interesting thoughts:
      // https://security.stackexchange.com/a/135636

      // 200 KB = 204800 B limit
      //
      // TODO: Perhaps the compression matters and we should check
      // actual dimensions in pixels?
    } catch (err) {
      logger.error('Failed to validate user profile:', csr, err?.message)
      return false
    }

    return true
  }

  // public static async validateCsrEntry(entry: LogEntry<string>) {
  //   let verify = false

  //   try {
  //     if (entry.payload.key !== entry.payload.value.pubKey) {
  //       logger.error('Failed to verify user profile entry:', entry.hash, 'entry key != payload pubKey')
  //       return false
  //     }
  //     verify = await CertificatesRequestsStore.validateUserCsr(entry.payload.value)
  //   } catch (err) {
  //     logger.error('Failed to verify user profile entry:', entry.hash, err?.message)
  //   }

  //   return verify
  // }

  // get all event log entries
  protected getCsrs() {
    return this.store
      .iterator({ limit: -1 })
      .collect()
      .map(e => e.payload.value)
  }
}

/**
 * Modified from:
 * https://github.com/orbitdb/orbit-db-kvstore/blob/main/src/KeyValueIndex.js
 *
 * Adds validation function that validates each entry before adding it
 * to the index.
 *
 * TODO: Save latest entry and only iterate over new entries in updateIndex
 */
// export class KeyValueIndex<T> {
//   private _index: Record<string, any>
//   private validateFn: (entry: LogEntry<T>) => Promise<boolean>

//   constructor(validateFn: (entry: LogEntry<T>) => Promise<boolean>) {
//     this._index = {}
//     this.validateFn = validateFn
//   }

//   get(key: string) {
//     return this._index[key]
//   }

//   async updateIndex(oplog: { values: LogEntry<T>[] }) {
//     const values: LogEntry<T>[] = []
//     const handled: Record<string, boolean> = {}

//     for (const v of oplog.values) {
//       if (await this.validateFn(v)) {
//         values.push(v)
//       }
//     }

//     for (let i = values.length - 1; i >= 0; i--) {
//       const item = values[i]
//       if (typeof item.payload.key === 'string') {
//         if (handled[item.payload.key]) {
//           continue
//         }
//         handled[item.payload.key] = true
//         if (item.payload.op === 'PUT') {
//           this._index[item.payload.key] = item.payload.value
//           continue
//         }
//         if (item.payload.op === 'DEL') {
//           delete this._index[item.payload.key]
//           continue
//         }
//       } else {
//         logger.error(`Failed to update key/value index - key is not string: ${item.payload.key}`)
//       }
//     }
//   }
// }

// export class UserProfileKeyValueIndex extends KeyValueIndex<UserProfile> {
//   constructor() {
//     super(UserProfileStore.validateUserCsr)
//   }
// }
