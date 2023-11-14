import { jest, beforeEach, describe, it, expect, afterEach, beforeAll, test } from '@jest/globals'
import OrbitDB from 'orbit-db'
import { EventEmitter } from 'events'
import { IdentityProvider } from 'orbit-db-identity-provider'

import { CommunityMetadataStore } from './communityMetadata.store'
import { LocalDbService } from '../../local-db/local-db.service'

const mockOrbitDbStore = {
  load: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  events: { on: jest.fn() },
  all: {},
}
const mockOrbitDb = {
  identity: { id: 'theOwnerId', provider: jest.fn() },
  keyvalue: jest.fn(
    (): {
      load: jest.Mock
      get: jest.Mock
      put: jest.Mock
      events: { on: jest.Mock }
      all: object
    } => {
      return mockOrbitDbStore
    }
  ),
}
const mockLocalDbService = { putOwnerOrbitDbIdentity: jest.fn(), getOwnerOrbitDbIdentity: jest.fn(() => 'theOwnerId') }
const mockEmitter = { emit: jest.fn() }

const metaValid = {
  id: 'anId',
  rootCa:
    'MIIBRTCB7KADAgECAgEBMAoGCCqGSM49BAMCMAwxCjAIBgNVBAMTAWEwHhcNMTAxMjI4MTAxMDEwWhcNMzAxMjI4MTAxMDEwWjAMMQowCAYDVQQDEwFhMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbifF9IqU0464LTet/71bqXFrIZN6mjQ/eXYEcVJU4nenXx1Br7ZavvtzS7q/wCdy0y4C4thy+5IfrJzxvSxqPqM/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0gAMEUCIQDADbVTK4Tn4pqEffh3zMXgAgrw4lpndAvoa/VmJBeWcgIgVWoI6JC9xT3SKX2oaUoWrv5/hbi5s9+FOCHnAYrK+uo=',
  ownerCertificate:
    'MIIBRTCB7KADAgECAgEBMAoGCCqGSM49BAMCMAwxCjAIBgNVBAMTAWEwHhcNMTAxMjI4MTAxMDEwWhcNMzAxMjI4MTAxMDEwWjAMMQowCAYDVQQDEwFhMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbifF9IqU0464LTet/71bqXFrIZN6mjQ/eXYEcVJU4nenXx1Br7ZavvtzS7q/wCdy0y4C4thy+5IfrJzxvSxqPqM/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0gAMEUCIQDADbVTK4Tn4pqEffh3zMXgAgrw4lpndAvoa/VmJBeWcgIgVWoI6JC9xT3SKX2oaUoWrv5/hbi5s9+FOCHnAYrK+uo=',
}

const metaValidWithOwnerId = {
  ...metaValid,
  ownerOrbitDbIdentity: 'theOwnerId',
}

const entryValid = {
  payload: { op: 'PUT', key: metaValidWithOwnerId.id, value: metaValidWithOwnerId },
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
    // NOTE: This is where the entry identity is defined!
    id: 'theOwnerId',
    publicKey: '',
    signatures: { id: '', publicKey: '' },
    type: '',
  },
  sig: '',
}

describe('CommmunityMetadataStore/updateCommunityMetadata', () => {
  test('updates community metadata if the metadata is valid', async () => {
    const store = new CommunityMetadataStore()
    await store.init(
      mockOrbitDb as unknown as OrbitDB,
      mockLocalDbService as unknown as LocalDbService,
      mockEmitter as unknown as EventEmitter
    )
    const ret = await store.updateCommunityMetadata(metaValid)

    expect(ret).toStrictEqual(metaValidWithOwnerId)
    expect(mockOrbitDb.keyvalue().put.mock.calls).toEqual([[metaValidWithOwnerId.id, metaValidWithOwnerId]])
  })

  test('does not update community metadata if the metadata is invalid', async () => {
    const metaInvalid = {
      ...metaValid,
      rootCa: 'Something invalid!',
    }
    const store = new CommunityMetadataStore()
    await store.init(
      mockOrbitDb as unknown as OrbitDB,
      mockLocalDbService as unknown as LocalDbService,
      mockEmitter as unknown as EventEmitter
    )
    const ret = await store.updateCommunityMetadata(metaInvalid)

    expect(ret).toStrictEqual(undefined)
    expect(mockOrbitDb.keyvalue().put.mock.calls).toEqual([])
  })
})

describe('CommmunityMetadataStore/validateCommunityMetadataEntry', () => {
  test('returns true if the owner ID is expected and entry is otherwise valid', async () => {
    const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
      mockLocalDbService as unknown as LocalDbService,
      { verifyIdentity: jest.fn(() => true) } as unknown as typeof IdentityProvider,
      entryValid
    )

    expect(ret).toEqual(true)
  })

  test('returns false if the owner ID is unexpected and entry is otherwise valid', async () => {
    const entryInvalid = {
      ...entryValid,
      identity: {
        // NOTE: This is where the entry identity is defined!
        id: 'Not the owner!',
        publicKey: '',
        signatures: { id: '', publicKey: '' },
        type: '',
      },
    }
    const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
      mockLocalDbService as unknown as LocalDbService,
      { verifyIdentity: jest.fn(() => true) } as unknown as typeof IdentityProvider,
      entryInvalid
    )
    expect(ret).toEqual(false)
  })

  test('returns false if the owner cert is unexpected and entry is otherwise valid', async () => {
    const entryInvalid = {
      ...entryValid,
      payload: {
        op: 'PUT',
        key: metaValidWithOwnerId.id,
        value: {
          ...metaValidWithOwnerId,
          rootCa: 'Something invalid!',
        },
      },
    }
    const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
      mockLocalDbService as unknown as LocalDbService,
      { verifyIdentity: jest.fn(() => true) } as unknown as typeof IdentityProvider,
      entryInvalid
    )
    expect(ret).toEqual(false)
  })
})
