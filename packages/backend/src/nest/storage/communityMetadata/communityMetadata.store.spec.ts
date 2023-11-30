import { jest, beforeEach, describe, it, expect, afterEach, beforeAll, test } from '@jest/globals'
import OrbitDB from 'orbit-db'
import fs from 'fs'
import { EventEmitter } from 'events'
import { IdentityProvider } from 'orbit-db-identity-provider'
import { create, IPFS } from 'ipfs-core'
// @ts-ignore Hacking around ipfs-log not exporting Entry
import Entry from '../../../../node_modules/ipfs-log/src/entry'

import { CommunityMetadata } from '@quiet/types'

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

const mockEmitter = { emit: jest.fn() }

const metaValid = {
  id: 'anId',
  // These are valid certs and form a chain of trust
  rootCa:
    'MIIBRTCB7KADAgECAgEBMAoGCCqGSM49BAMCMAwxCjAIBgNVBAMTAWEwHhcNMTAxMjI4MTAxMDEwWhcNMzAxMjI4MTAxMDEwWjAMMQowCAYDVQQDEwFhMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbifF9IqU0464LTet/71bqXFrIZN6mjQ/eXYEcVJU4nenXx1Br7ZavvtzS7q/wCdy0y4C4thy+5IfrJzxvSxqPqM/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0gAMEUCIQDADbVTK4Tn4pqEffh3zMXgAgrw4lpndAvoa/VmJBeWcgIgVWoI6JC9xT3SKX2oaUoWrv5/hbi5s9+FOCHnAYrK+uo=',
  ownerCertificate:
    'MIIBRTCB7KADAgECAgEBMAoGCCqGSM49BAMCMAwxCjAIBgNVBAMTAWEwHhcNMTAxMjI4MTAxMDEwWhcNMzAxMjI4MTAxMDEwWjAMMQowCAYDVQQDEwFhMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbifF9IqU0464LTet/71bqXFrIZN6mjQ/eXYEcVJU4nenXx1Br7ZavvtzS7q/wCdy0y4C4thy+5IfrJzxvSxqPqM/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0gAMEUCIQDADbVTK4Tn4pqEffh3zMXgAgrw4lpndAvoa/VmJBeWcgIgVWoI6JC9xT3SKX2oaUoWrv5/hbi5s9+FOCHnAYrK+uo=',
}

describe('CommmunityMetadataStore', () => {
  let ipfs: IPFS
  let mockLocalDbService: LocalDbService
  let orbitDb: OrbitDB
  let store: CommunityMetadataStore
  let metaValidWithOwnerId: CommunityMetadata
  let entryValid: Entry

  beforeEach(async () => {
    ;({ orbitDb, ipfs } = await createOrbitDbInstance())

    mockLocalDbService = {
      putOwnerOrbitDbIdentity: jest.fn(),
      // @ts-ignore - OrbitDB's type definition doesn't include identity
      getOwnerOrbitDbIdentity: jest.fn(() => orbitDb.identity.id),
    } as unknown as LocalDbService

    store = new CommunityMetadataStore()
    await store.init(orbitDb, mockLocalDbService, mockEmitter as unknown as EventEmitter)

    metaValidWithOwnerId = {
      ...metaValid,
      // @ts-ignore
      ownerOrbitDbIdentity: orbitDb.identity.id,
    }

    const op = { op: 'PUT', key: metaValidWithOwnerId.id, value: metaValidWithOwnerId }
    // @ts-ignore
    entryValid = await Entry.create(ipfs, orbitDb.identity, store.store.id, op, [], null, [], false)
  })

  afterEach(async () => {
    await store.close()
    await orbitDb.stop()
    await ipfs.stop()
    if (fs.existsSync(TestConfig.ORBIT_DB_DIR)) {
      fs.rmSync(TestConfig.ORBIT_DB_DIR, { recursive: true })
    }
  })

  describe('updateCommunityMetadata', () => {
    test('updates community metadata if the metadata is valid', async () => {
      const ret = await store.updateCommunityMetadata(metaValid)
      const meta = await store.getCommunityMetadata()

      expect(ret).toStrictEqual(metaValidWithOwnerId)
      expect(meta).toStrictEqual(metaValidWithOwnerId)
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

  describe('validateCommunityMetadataEntry', () => {
    test('returns true if the owner ID is expected and entry is otherwise valid', async () => {
      const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
        mockLocalDbService as unknown as LocalDbService,
        { verify: jest.fn(() => true), verifyIdentity: jest.fn(() => true) } as unknown as typeof IdentityProvider,
        entryValid
      )

      expect(ret).toEqual(true)
    })

    test('returns false if verify returns false and entry is otherwise valid', async () => {
      const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
        mockLocalDbService as unknown as LocalDbService,
        { verify: jest.fn(() => false), verifyIdentity: jest.fn(() => true) } as unknown as typeof IdentityProvider,
        entryValid
      )

      expect(ret).toEqual(false)
    })

    test('returns false if verifyIdentity returns false and entry is otherwise valid', async () => {
      const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
        mockLocalDbService as unknown as LocalDbService,
        { verify: jest.fn(() => true), verifyIdentity: jest.fn(() => false) } as unknown as typeof IdentityProvider,
        entryValid
      )

      expect(ret).toEqual(false)
    })

    test('returns false if the owner ID is unexpected and entry is otherwise valid', async () => {
      const entryInvalid = {
        ...entryValid,
        identity: {
          ...entryValid.identity,
          // NOTE: This is where the entry identity is defined!
          id: 'Not the owner!',
        },
      }
      const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
        mockLocalDbService as unknown as LocalDbService,
        { verify: jest.fn(() => true), verifyIdentity: jest.fn(() => true) } as unknown as typeof IdentityProvider,
        entryInvalid
      )

      expect(ret).toEqual(false)
    })

    test('returns false if the owner cert is unexpected and entry is otherwise valid', async () => {
      const metaInvalid = {
        ...metaValidWithOwnerId,
        rootCa: 'Something invalid!',
      }
      const opInvalid = { op: 'PUT', key: metaInvalid.id, value: metaInvalid }
      // @ts-ignore
      const entryInvalid = await Entry.create(ipfs, orbitDb.identity, store.store.id, opInvalid, [], null, [], false)
      const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
        mockLocalDbService as unknown as LocalDbService,
        { verify: jest.fn(() => true), verifyIdentity: jest.fn(() => true) } as unknown as typeof IdentityProvider,
        entryInvalid
      )

      expect(ret).toEqual(false)
    })
  })
})
