import { IdentityProvider } from 'orbit-db-identity-provider'

import createLogger from '../../common/logger'

const logger = createLogger('KeyValueIndex')

type ValidateFn<T> = (identityProvider: typeof IdentityProvider, entry: LogEntry<T>) => Promise<boolean>

/**
 * Modified from:
 * https://github.com/orbitdb/orbit-db-kvstore/blob/main/src/KeyValueIndex.js
 *
 * Adds validation function that validates each entry before adding it
 * to the index. This is used to validate each entry in OrbitDB upon
 * retrieval (vs write). When this was written, OrbitDB access
 * controllers didn't validate each entry which we want to do. In the
 * latest version of OrbitDB, access controllers now validate each
 * entry, but there might still be other reasons why we would want to
 * continue using this (e.g. flexibility in how we treat "invalid"
 * data).
 *
 * TODO: Save latest entry and only iterate over new entries in updateIndex
 */
export class KeyValueIndex<T> {
  private _index: Record<string, any>
  private validateFn: ValidateFn<T>
  private identityProvider: typeof IdentityProvider

  constructor(identityProvider: typeof IdentityProvider, validateFn: ValidateFn<T>) {
    this._index = {}
    this.validateFn = validateFn
    this.identityProvider = identityProvider
  }

  get(key: string) {
    return this._index[key]
  }

  async updateIndex(oplog: { values: LogEntry<T>[] }) {
    const values: LogEntry<T>[] = []
    const handled: Record<string, boolean> = {}

    for (const v of oplog.values) {
      if (await this.validateFn(this.identityProvider, v)) {
        values.push(v)
      }
    }

    for (let i = values.length - 1; i >= 0; i--) {
      const item = values[i]
      if (typeof item.payload.key === 'string') {
        if (handled[item.payload.key]) {
          continue
        }
        handled[item.payload.key] = true
        if (item.payload.op === 'PUT') {
          this._index[item.payload.key] = item.payload.value
          continue
        }
        if (item.payload.op === 'DEL') {
          delete this._index[item.payload.key]
          continue
        }
      } else {
        logger.error(`Failed to update key/value index - key is not string: ${item.payload.key}`)
      }
    }
  }
}
