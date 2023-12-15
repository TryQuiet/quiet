import { EventEmitter } from 'events'
import KeyValueStore from 'orbit-db-kvstore'
import { IdentityProvider } from 'orbit-db-identity-provider'
// @ts-ignore Hacking around ipfs-log not exporting Entry
import Entry from '../../../../node_modules/ipfs-log/src/entry'
import { CommunityMetadata } from '@quiet/types'
import { loadCertificate } from '@quiet/identity'
import { StorageEvents } from '../storage.types'
import { KeyValueIndex } from '../orbitDb/keyValueIndex'
import { LocalDbService } from '../../local-db/local-db.service'
import { OrbitDb } from '../orbitDb/orbitDb.service'
import { Injectable } from '@nestjs/common'
import Logger from '../../common/logger'

/**
 * Helper function that allows one to use partial-application with a
 * constructor. Given a classname and constructor params, returns a
 * new constructor which can be called like normal (`new x()`).
 *
 * This is useful because in OrbitDB they expect the store index to be
 * constructable with zero arguments, so they call it with the `new`
 * keyword.
 */
function constructPartial(constructor: (...args: any[]) => any, args: any[]) {
  return constructor.bind.apply(constructor, [null, ...args])
}

@Injectable()
export class CommunityMetadataStore {
  public store: KeyValueStore<CommunityMetadata>

  private readonly logger = Logger(CommunityMetadataStore.name)

  constructor(
    private readonly orbitDbService: OrbitDb,
    private readonly localDbService: LocalDbService
  ) {}

  public async init(emitter: EventEmitter) {
    this.logger('Initializing community metadata key/value store')

    // If the owner initializes the CommunityMetadataStore, then the
    // ID would be undefined at this point when they first create the
    // community. This would mean that they wouldn't be able to to
    // validate an entry's ownership when writing or replicating.
    //
    // As a quick solution, we dynamically retrieve the owner's
    // identity in the validation function. So after the owner sets it
    // when calling updateCommunityMetadata, the validation function
    // could then retrieve it. In our case, this is probably fine,
    // because only the owner would be in the network by the time they
    // first call updateCommunityMetadata.
    //
    // However, I think it might be simpler to pass the owner's
    // OrbitDB identity when creating the store. For this we need to
    // know at the time of initialization whether or not someone is
    // the owner.

    this.store = await this.orbitDbService.orbitDb.keyvalue<CommunityMetadata>('community-metadata', {
      replicate: false,
      // Partially construct index so that we can include an
      // IdentityProvider in the index validation logic.

      // @ts-expect-error
      Index: constructPartial(CommunityMetadataKeyValueIndex, [
        // @ts-expect-error - OrbitDB's type declaration of OrbitDB lacks identity
        this.orbitDbService.orbitDb.identity.provider,
        this.localDbService,
      ]),

      accessController: {
        write: ['*'],
      },
    })

    this.store.events.on('write', (_address, entry) => {
      this.logger('Saved community metadata locally')
      emitter.emit(StorageEvents.COMMUNITY_METADATA_SAVED, entry.payload.value)
    })

    this.store.events.on('replicated', async () => {
      this.logger('Replicated community metadata')
      // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
      // TODO: Is this necessary here?
      await this.store.load({ fetchEntryTimeout: 15000 })
      const meta = this.getCommunityMetadata()
      if (meta) {
        emitter.emit(StorageEvents.COMMUNITY_METADATA_SAVED, meta)
      }
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.store.load({ fetchEntryTimeout: 15000 })
    this.logger('Loaded community metadata to memory')
    const meta = this.getCommunityMetadata()
    if (meta) {
      emitter.emit(StorageEvents.COMMUNITY_METADATA_SAVED, meta)
    }
  }

  public getAddress() {
    return this.store?.address
  }

  public async close() {
    await this.store?.close()
  }

  public async updateCommunityMetadata(newMeta: CommunityMetadata): Promise<CommunityMetadata | undefined> {
    console.log({ newMeta })
    try {
      // TODO: Also check OrbitDB identity when updating community metadata
      const valid = await CommunityMetadataStore.validateCommunityMetadata(newMeta)
      if (!valid) {
        // TODO: Send validation errors to frontend or replicate
        // validation on frontend?
        this.logger.error('Failed to update community metadata')
        return
      }

      this.logger(`About to update community metadata`, newMeta?.id)
      if (!newMeta.id) return

      // FIXME: update community metadata if it has changed (so that
      // we can migrate community metadata easily)
      const oldMeta = this.store.get(newMeta.id)
      if (oldMeta?.ownerCertificate && oldMeta?.rootCa) {
        return oldMeta
      }

      this.logger(`Updating community metadata`)
      // @ts-expect-error - OrbitDB's type declaration of OrbitDB lacks identity
      const ownerOrbitDbIdentity = this.orbitDbService.orbitDb.identity.id
      const meta = {
        ...oldMeta,
        ...newMeta,
        ownerOrbitDbIdentity,
      }

      // putOwnerOrbitDbIdentity goes before store.put because the
      // store's KeyValueIndex calls getOwnerOrbitDbIdentity
      this.localDbService.putOwnerOrbitDbIdentity(ownerOrbitDbIdentity)

      // FIXME: I think potentially there is a subtle developer
      // experience bug here. Internally OrbitDB will call
      // validateCommunityMetadataEntry and so validation may pass in
      // this method, but still the entry is not added to the internal
      // index. How can we detect that?
      await this.store.put(meta.id, meta)

      return meta
    } catch (err) {
      this.logger.error('Failed to add community metadata', err)
    }
  }

  public static async validateCommunityMetadata(communityMetadata: CommunityMetadata): Promise<boolean> {
    // FIXME: Add additional validation to verify communityMetadata
    // contains required fields.

    try {
      // TODO: Should we sign community metadata with root private key
      // and verify? I'm not sure it matters that much.

      const rootCert = loadCertificate(communityMetadata.rootCa)
      const ownerCert = loadCertificate(communityMetadata.ownerCertificate)

      // Verify that owner certificate is signed by root certificate
      return await ownerCert.verify(rootCert)
    } catch (err) {
      console.error('Failed to validate community metadata:', communityMetadata.id, err?.message)
      return false
    }
  }

  public static async validateCommunityMetadataEntry(
    localDbService: LocalDbService,
    identityProvider: typeof IdentityProvider,
    entry: LogEntry<CommunityMetadata>
  ): Promise<boolean> {
    try {
      if (entry.payload.key !== entry.payload.value.id) {
        console.error('Failed to verify community metadata entry:', entry.hash, 'entry key != payload id')
        return false
      }

      const ownerOrbitDbIdentity = await localDbService.getOwnerOrbitDbIdentity()
      if (!ownerOrbitDbIdentity) {
        console.error('Failed to verify community metadata entry:', entry.hash, 'owner identity is invalid')
        return false
      }

      if (entry.identity.id !== ownerOrbitDbIdentity) {
        console.error('Failed to verify community metadata entry:', entry.hash, 'entry identity != owner identity')
        return false
      }

      const entryVerified = await Entry.verify(identityProvider, entry)
      if (!entryVerified) {
        console.error('Failed to verify community metadata entry:', entry.hash, 'invalid entry signature')
        return false
      }

      const identityVerified = await identityProvider.verifyIdentity(entry.identity)
      if (!identityVerified) {
        console.error('Failed to verify community metadata entry:', entry.hash, 'entry identity verification failed')
        return false
      }

      const valid = await CommunityMetadataStore.validateCommunityMetadata(entry.payload.value)
      return valid
    } catch (err) {
      console.error('Failed to verify community metadata entry:', entry.hash, err?.message)
      return false
    }
  }

  public getCommunityMetadata(): CommunityMetadata | undefined {
    const metadata = Object.values(this.store.all)

    if (metadata.length > 0) {
      return metadata[0]
    }
  }
}

export class CommunityMetadataKeyValueIndex extends KeyValueIndex<CommunityMetadata> {
  constructor(identityProvider: typeof IdentityProvider, localDbService: LocalDbService) {
    super(identityProvider, CommunityMetadataStore.validateCommunityMetadataEntry.bind(null, localDbService))
  }
}
