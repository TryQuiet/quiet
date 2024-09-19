import fs from 'fs'
import { createHelia, type Helia } from 'helia'
import { TestConfig } from '../../const'
import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../../common/test.module'
import { StorageModule } from '../storage.module'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { CommunityMetadataStore } from './communityMetadata.store'
import { Community, CommunityMetadata } from '@quiet/types'
import { LocalDbService } from '../../local-db/local-db.service'
import { Store, getFactory, prepareStore } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import { type IdentitiesType, type LogEntry, Entry } from '@orbitdb/core'
import { createPeerId } from '../../common/utils'

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
  let entryValid: LogEntry<CommunityMetadata>

  let module: TestingModule
  let communityMetadataStore: CommunityMetadataStore
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let ipfs: Helia

  let store: Store
  let factory: FactoryGirl
  let community: Community

  const mockLocalDbService = {
    setCommunity: jest.fn(),
    getCurrentCommunity: jest.fn(() => {
      return {
        // @ts-ignore - OrbitDB's type definition doesn't include identity
        ownerOrbitDbIdentity: orbitDbService.orbitDb.identity.id,
      }
    }),
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

    orbitDbService = await module.resolve(OrbitDbService)
    localDbService = await module.resolve(LocalDbService)

    const peerId = await createPeerId()
    ipfs = await createHelia()
    await orbitDbService.create(peerId, ipfs)

    await communityMetadataStore.init()

    metaValidWithOwnerId = {
      ...metaValid,
      // @ts-ignore
      ownerOrbitDbIdentity: orbitDbService.orbitDb.identity.id,
    }

    const op = { op: 'PUT', key: metaValidWithOwnerId.id, value: metaValidWithOwnerId }

    entryValid = await Entry.create<CommunityMetadata>(
      orbitDbService.orbitDb.identity,
      // @ts-ignore
      communityMetadataStore.store.log.id,
      op
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
      const ret = await communityMetadataStore.setEntry(metaValid.id, metaValid)
      const meta = communityMetadataStore.getEntry()

      expect(ret).toStrictEqual(metaValidWithOwnerId)
      expect(meta).toStrictEqual(metaValidWithOwnerId)
    })

    test('does not update community metadata if the metadata is invalid', async () => {
      const metaInvalid = {
        ...metaValid,
        rootCa: 'Something invalid!',
      }
      expect(communityMetadataStore.setEntry(metaInvalid.id, metaInvalid)).rejects.toThrow()
      const meta = communityMetadataStore.getEntry()
      expect(meta).toEqual(null)
    })
  })

  describe('validateCommunityMetadataEntry', () => {
    test('returns true if the owner ID is expected and entry is otherwise valid', async () => {
      const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
        localDbService,
        { verifyIdentity: jest.fn(() => true) } as unknown as IdentitiesType,
        entryValid
      )

      expect(ret).toEqual(true)
    })

    test('returns false if verify returns false and entry is otherwise valid', async () => {
      const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
        localDbService,
        { verifyIdentity: jest.fn(() => true) } as unknown as IdentitiesType,
        entryValid
      )

      expect(ret).toEqual(false)
    })

    test('returns false if verifyIdentity returns false and entry is otherwise valid', async () => {
      const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
        localDbService,
        { verifyIdentity: jest.fn(() => false) } as unknown as IdentitiesType,
        entryValid
      )

      expect(ret).toEqual(false)
    })

    test('returns false if the owner ID is unexpected and entry is otherwise valid', async () => {
      const op = { op: 'PUT', key: metaValidWithOwnerId.id, value: metaValidWithOwnerId }

      const entryInvalid = await Entry.create<CommunityMetadata>(
        {
          ...orbitDbService.orbitDb.identity,
          // NOTE: This is where the entry identity is defined!
          id: 'Not the owner!',
        },
        // @ts-ignore
        communityMetadataStore.store.log.id,
        op
      )

      const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
        localDbService,
        { verify: jest.fn(() => true), verifyIdentity: jest.fn(() => true) } as unknown as IdentitiesType,
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
      const entryInvalid = await Entry.create<CommunityMetadata>(
        orbitDbService.orbitDb.identity,
        // @ts-ignore
        communityMetadataStore.store.log.id,
        opInvalid
      )

      const ret = await CommunityMetadataStore.validateCommunityMetadataEntry(
        localDbService,
        { verifyIdentity: jest.fn(() => true) } as unknown as IdentitiesType,
        entryInvalid
      )

      expect(ret).toEqual(false)
    })
  })
})
