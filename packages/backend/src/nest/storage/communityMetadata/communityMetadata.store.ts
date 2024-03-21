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
import createLogger from '../../common/logger'
import { constructPartial } from '@quiet/common'

const logger = createLogger('CommunityMetadataStore')

@Injectable()
export class CommunityMetadataStore extends EventEmitter {
  public store: KeyValueStore<CommunityMetadata>

  constructor(
    private readonly orbitDbService: OrbitDb,
    private readonly localDbService: LocalDbService
  ) {
    super()
  }

  public async init() {
    logger('Initializing community metadata key/value store')

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
      // IdentityProvider in the index validation logic. OrbitDB
      // expects the store index to be constructable with zero
      // arguments.
      //
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

    this.store.events.on('replicated', async () => {
      logger('Replicated community metadata')
      // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
      // TODO: Is this necessary here?
      await this.store.load({ fetchEntryTimeout: 15000 })
      const meta = this.getCommunityMetadata()
      if (meta) {
        this.emit(StorageEvents.COMMUNITY_METADATA_STORED, meta)
      }
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.store.load({ fetchEntryTimeout: 15000 })
    const meta = this.getCommunityMetadata()
    if (meta) {
      this.emit(StorageEvents.COMMUNITY_METADATA_STORED, meta)
    }
    logger('Loaded community metadata to memory')
  }

  public getAddress() {
    return this.store?.address
  }

  public async close() {
    await this.store?.close()
  }

  public async updateCommunityMetadata(newMeta: CommunityMetadata): Promise<CommunityMetadata | undefined> {
    try {
      // TODO: Also check OrbitDB identity when updating community metadata
      const valid = await CommunityMetadataStore.validateCommunityMetadata(newMeta)
      if (!valid) {
        // TODO: Send validation errors to frontend or replicate
        // validation on frontend?
        logger.error('Failed to update community metadata')
        return
      }

      logger(`About to update community metadata`, newMeta?.id)
      if (!newMeta.id) return

      // FIXME: update community metadata if it has changed (so that
      // we can migrate community metadata easily)
      const oldMeta = this.store.get(newMeta.id)
      if (oldMeta?.ownerCertificate && oldMeta?.rootCa) {
        return oldMeta
      }

      logger(`Updating community metadata`)
      // @ts-expect-error - OrbitDB's type declaration of OrbitDB lacks identity
      const ownerOrbitDbIdentity = this.orbitDbService.orbitDb.identity.id
      const meta = {
        ...oldMeta,
        ...newMeta,
        ownerOrbitDbIdentity,
      }

      // Updating this here before store.put because the store's KeyValueIndex
      // then uses the updated Community object.
      const community = await this.localDbService.getCurrentCommunity()
      if (community) {
        await this.localDbService.setCommunity({ ...community, ownerOrbitDbIdentity })
      } else {
        throw new Error('Current community missing')
      }

      // FIXME: I think potentially there is a subtle developer
      // experience bug here. Internally OrbitDB will call
      // validateCommunityMetadataEntry and so validation may pass in
      // this method, but still the entry is not added to the internal
      // index. How can we detect that?
      await this.store.put(meta.id, meta)

      return meta
    } catch (err) {
      logger.error('Failed to add community metadata', err)
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
      logger.error('Failed to validate community metadata:', communityMetadata.id, err?.message)
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
        logger.error('Failed to verify community metadata entry:', entry.hash, 'entry key != payload id')
        return false
      }

      const community = await localDbService.getCurrentCommunity()
      const ownerOrbitDbIdentity = community?.ownerOrbitDbIdentity
      if (!ownerOrbitDbIdentity) {
        logger.error('Failed to verify community metadata entry:', entry.hash, 'owner identity is invalid')
        return false
      }

      if (entry.identity.id !== ownerOrbitDbIdentity) {
        logger.error('Failed to verify community metadata entry:', entry.hash, 'entry identity != owner identity')
        return false
      }

      const entryVerified = await Entry.verify(identityProvider, entry)
      if (!entryVerified) {
        logger.error('Failed to verify community metadata entry:', entry.hash, 'invalid entry signature')
        return false
      }

      const identityVerified = await identityProvider.verifyIdentity(entry.identity)
      if (!identityVerified) {
        logger.error('Failed to verify community metadata entry:', entry.hash, 'entry identity verification failed')
        return false
      }

      const valid = await CommunityMetadataStore.validateCommunityMetadata(entry.payload.value)
      return valid
    } catch (err) {
      logger.error('Failed to verify community metadata entry:', entry.hash, err?.message)
      return false
    }
  }

  public getCommunityMetadata(): CommunityMetadata | undefined {
    const metadata = Object.values(this.store.all)

    if (metadata.length > 0) {
      return metadata[0]
    }
  }

  public clean() {
    // FIXME: Add correct typings on object fields.

    // @ts-ignore
    this.store = undefined
  }
}

export class CommunityMetadataKeyValueIndex extends KeyValueIndex<CommunityMetadata> {
  constructor(identityProvider: typeof IdentityProvider, localDbService: LocalDbService) {
    super(identityProvider, CommunityMetadataStore.validateCommunityMetadataEntry.bind(null, localDbService))
  }
}
