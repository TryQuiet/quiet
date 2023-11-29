import { jest, beforeEach, describe, it, expect, afterEach, beforeAll, test } from '@jest/globals'
import OrbitDB from 'orbit-db'
import fs from 'fs'
import { EventEmitter } from 'events'
import { IdentityProvider } from 'orbit-db-identity-provider'
import { create, IPFS } from 'ipfs-core'

import { CommunityMetadataStore } from './communityMetadata.store'
import { LocalDbService } from '../../local-db/local-db.service'
import { TestConfig } from '../../const'

const createOrbitDbInstance = async () => {
   const ipfs: IPFS = await create()
   // @ts-ignore
   const orbitDb = await OrbitDB.createInstance(ipfs, {
     directory: TestConfig.ORBIT_DB_DIR,
   })

   return { orbitDb, ipfs }
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
  let ipfs: IPFS
  let orbitDb: OrbitDB
  let store: CommunityMetadataStore

  beforeEach(async () => {
    ;({ orbitDb, ipfs } = await createOrbitDbInstance())
    store = new CommunityMetadataStore()
    await store.init(
      orbitDb,
      {
        ...mockLocalDbService,
        // @ts-ignore - OrbitDB's type definition doesn't include identity
        getOwnerOrbitDbIdentity: jest.fn(() => orbitDb.identity.id)
      } as unknown as LocalDbService,
      mockEmitter as unknown as EventEmitter
    )
  })

  afterEach(async () => {
    await store.close()
    await orbitDb.stop()
    await ipfs.stop()
    if (fs.existsSync(TestConfig.ORBIT_DB_DIR)) {
      fs.rmSync(TestConfig.ORBIT_DB_DIR, { recursive: true })
    }
  })

  test('updates community metadata if the metadata is valid', async () => {
    const ret = await store.updateCommunityMetadata(metaValid)
    const meta = await store.getCommunityMetadata()
    // We are using an actual instance of OrbitDb in this case, so we
    // can use the actual identity.
    // @ts-ignore - OrbitDB's type definition doesn't include identity
    const expected = {...metaValidWithOwnerId, ownerOrbitDbIdentity: orbitDb.identity.id}

    expect(ret).toStrictEqual(expected)
    expect(meta).toStrictEqual(expected)
  })

  test('does not update community metadata if the metadata is invalid', async () => {
    const metaInvalid = {
      ...metaValid,
      rootCa: 'Something invalid!',
    }
    const ret = await store.updateCommunityMetadata(metaInvalid)
    const meta = await store.getCommunityMetadata()

    expect(ret).toStrictEqual(undefined)
    expect(meta).toEqual(undefined)
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
