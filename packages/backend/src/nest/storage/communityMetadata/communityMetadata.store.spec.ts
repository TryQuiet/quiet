import { jest, beforeEach, describe, it, expect, afterEach, beforeAll, test } from '@jest/globals'
import fs from 'fs'
import { create, IPFS } from 'ipfs-core'
import { EventEmitter } from 'events'
import { TestConfig } from '../../const'
import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../../common/test.module'
import { StorageModule } from '../storage.module'
import { OrbitDb } from '../orbitDb/orbitDb.service'
import PeerId from 'peer-id'
import { CommunityMetadataStore } from './communityMetadata.store'
import { Community, CommunityMetadata } from '@quiet/types'
import { LocalDbService } from '../../local-db/local-db.service'
import { Store, getFactory, prepareStore } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import { IdentityProvider } from 'orbit-db-identity-provider'
// @ts-ignore Hacking around ipfs-log not exporting Entry
import Entry from '../../../../node_modules/ipfs-log/src/entry'

const metaValid = {
  id: 'anId',
  // These are valid certs and form a chain of trust
  rootCa:
    'MIIBRTCB7KADAgECAgEBMAoGCCqGSM49BAMCMAwxCjAIBgNVBAMTAWEwHhcNMTAxMjI4MTAxMDEwWhcNMzAxMjI4MTAxMDEwWjAMMQowCAYDVQQDEwFhMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbifF9IqU0464LTet/71bqXFrIZN6mjQ/eXYEcVJU4nenXx1Br7ZavvtzS7q/wCdy0y4C4thy+5IfrJzxvSxqPqM/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0gAMEUCIQDADbVTK4Tn4pqEffh3zMXgAgrw4lpndAvoa/VmJBeWcgIgVWoI6JC9xT3SKX2oaUoWrv5/hbi5s9+FOCHnAYrK+uo=',
  ownerCertificate:
    'MIIBRTCB7KADAgECAgEBMAoGCCqGSM49BAMCMAwxCjAIBgNVBAMTAWEwHhcNMTAxMjI4MTAxMDEwWhcNMzAxMjI4MTAxMDEwWjAMMQowCAYDVQQDEwFhMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbifF9IqU0464LTet/71bqXFrIZN6mjQ/eXYEcVJU4nenXx1Br7ZavvtzS7q/wCdy0y4C4thy+5IfrJzxvSxqPqM/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0gAMEUCIQDADbVTK4Tn4pqEffh3zMXgAgrw4lpndAvoa/VmJBeWcgIgVWoI6JC9xT3SKX2oaUoWrv5/hbi5s9+FOCHnAYrK+uo=',
}

describe('CommmunityMetadataStore', () => {
  let metaValidWithOwnerId: CommunityMetadata
  let entryValid: Entry

  let module: TestingModule
  let communityMetadataStore: CommunityMetadataStore
  let orbitDbService: OrbitDb
  let localDbService: LocalDbService
  let ipfs: IPFS

  let store: Store
  let factory: FactoryGirl
  let community: Community

  const mockLocalDbService = {
    putOwnerOrbitDbIdentity: jest.fn(),
    // @ts-ignore - OrbitDB's type definition doesn't include identity
    getOwnerOrbitDbIdentity: jest.fn(() => orbitDbService.orbitDb.identity.id),
  }

  beforeAll(async () => {
    store = prepareStore().store
    factory = await getFactory(store)
    community = await factory.create<Community>('Community')
  })

  beforeEach(async () => {
    jest.clearAllMocks()

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule],
    })
      .overrideProvider(LocalDbService)
      .useValue(mockLocalDbService)
      .compile()

    communityMetadataStore = await module.resolve(CommunityMetadataStore)

    orbitDbService = await module.resolve(OrbitDb)
    localDbService = await module.resolve(LocalDbService)

    const peerId = await PeerId.create()
    ipfs = await create()
    await orbitDbService.create(peerId, ipfs)

    const emitter = new EventEmitter()
    await communityMetadataStore.init(emitter)

    metaValidWithOwnerId = {
      ...metaValid,
      // @ts-ignore
      ownerOrbitDbIdentity: orbitDbService.orbitDb.identity.id,
    }

    const op = { op: 'PUT', key: metaValidWithOwnerId.id, value: metaValidWithOwnerId }

    entryValid = await Entry.create(
      ipfs,
      // @ts-ignore
      orbitDbService.orbitDb.identity,
      // @ts-ignore
      communityMetadataStore.store.id,
      op,
      [],
      null,
      [],
      false
    )
  })

  afterEach(async () => {
    await communityMetadataStore.close()
    await orbitDbService.stop()
    await ipfs.stop()
    if (fs.existsSync(TestConfig.ORBIT_DB_DIR)) {
      fs.rmSync(TestConfig.ORBIT_DB_DIR, { recursive: true })
    }
  })

  describe('updateCommunityMetadata', () => {
    test('updates community metadata if the metadata is valid', async () => {
      const ret = await communityMetadataStore.updateCommunityMetadata(metaValid)
      const meta = communityMetadataStore.getCommunityMetadata()

      expect(ret).toStrictEqual(metaValidWithOwnerId)
      expect(meta).toStrictEqual(metaValidWithOwnerId)
    })

    test('does not update community metadata if the metadata is invalid', async () => {
      const metaInvalid = {
        ...metaValid,
        rootCa: 'Something invalid!',
      }
      const ret = await communityMetadataStore.updateCommunityMetadata(metaInvalid)
      const meta = communityMetadataStore.getCommunityMetadata()

      expect(ret).toStrictEqual(undefined)
      expect(meta).toEqual(undefined)
    })
  })

  describe('validateCommunityMetadataEntry', () => {
    test('returns true if the owner ID is expected and entry is otherwise valid', async () => {
      const ret = await communityMetadataStore.validateCommunityMetadataEntry(
        { verify: jest.fn(() => true), verifyIdentity: jest.fn(() => true) } as unknown as typeof IdentityProvider,
        entryValid
      )

      expect(ret).toEqual(true)
    })

    test('returns false if verify returns false and entry is otherwise valid', async () => {
      const ret = await communityMetadataStore.validateCommunityMetadataEntry(
        { verify: jest.fn(() => false), verifyIdentity: jest.fn(() => true) } as unknown as typeof IdentityProvider,
        entryValid
      )

      expect(ret).toEqual(false)
    })

    test('returns false if verifyIdentity returns false and entry is otherwise valid', async () => {
      const ret = await communityMetadataStore.validateCommunityMetadataEntry(
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

      const ret = await communityMetadataStore.validateCommunityMetadataEntry(
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
      const entryInvalid = await Entry.create(
        ipfs,
        // @ts-ignore
        orbitDbService.orbitDb.identity,
        // @ts-ignore
        communityMetadataStore.store.id,
        opInvalid,
        [],
        null,
        [],
        false
      )

      const ret = await communityMetadataStore.validateCommunityMetadataEntry(
        { verify: jest.fn(() => true), verifyIdentity: jest.fn(() => true) } as unknown as typeof IdentityProvider,
        entryInvalid
      )

      expect(ret).toEqual(false)
    })
  })
})
