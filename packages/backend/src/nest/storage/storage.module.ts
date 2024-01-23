import { Module } from '@nestjs/common'
import { StorageService } from './storage.service'
import { UserProfileStore } from './UserProfileStore'
import { LocalDbModule } from '../local-db/local-db.module'
import { IpfsFileManagerModule } from '../ipfs-file-manager/ipfs-file-manager.module'
import { OrbitDb } from './orbitDb/orbitDb.service'
import { CertificatesRequestsStore } from './certifacteRequests/certificatesRequestsStore'
import { CertificatesStore } from './certificates/certificates.store'
import { CommunityMetadataStore } from './communityMetadata/communityMetadata.store'

@Module({
  imports: [LocalDbModule, IpfsFileManagerModule],
  providers: [
    StorageService,
    OrbitDb,
    CertificatesStore,
    CommunityMetadataStore,
    CertificatesRequestsStore,
    UserProfileStore,
  ],
  exports: [StorageService],
})
export class StorageModule {}
