import { jest, beforeEach, describe, it, expect, afterEach, beforeAll, test } from '@jest/globals'
import { IdentityProvider } from 'orbit-db-identity-provider'

import { KeyValueIndex } from './keyValueIndex'

const key = 'theKey'
const entry = {
  payload: { op: 'PUT', key: key, value: 'isWithin' },
  // These fields are not checked currently
  hash: '',
  id: '',
  next: [''],
  v: 1,
  clock: {
    // Not sure why this type is defined like this:
    // https://github.com/orbitdb/orbit-db-types/blob/ed41369e64c054952c1e47505d598342a4967d4c/LogEntry.d.ts#L8C9-L8C17
    id: '' as 'string',
    time: 1,
  },
  key: '',
  identity: {
    id: '',
    publicKey: '',
    signatures: { id: '', publicKey: '' },
    type: '',
  },
  sig: '',
}

describe('KeyValueIndex', () => {
  test('updateIndex adds entry if it is valid', async () => {
    const validateFn = async (idProvider: typeof IdentityProvider, entry: LogEntry<string>): Promise<boolean> => true
    const index = new KeyValueIndex<string>(jest.fn() as unknown as typeof IdentityProvider, validateFn)
    await index.updateIndex({ values: [entry] })
    expect(index.get(key)).toEqual('isWithin')
  })

  test('updateIndex skips entry if it is invalid', async () => {
    const validateFn = async (idProvider: typeof IdentityProvider, entry: LogEntry<string>): Promise<boolean> => false
    const index = new KeyValueIndex<string>(jest.fn() as unknown as typeof IdentityProvider, validateFn)
    await index.updateIndex({ values: [entry] })
    expect(index.get(key)).toEqual(undefined)
  })
})
