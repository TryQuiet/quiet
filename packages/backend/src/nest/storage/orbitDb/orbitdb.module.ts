import { forwardRef, Module } from '@nestjs/common'
import { LocalDbModule } from '../../local-db/local-db.module'
import { IpfsModule } from '../../ipfs/ipfs.module'
import { IpfsFileManagerModule } from '../../ipfs-file-manager/ipfs-file-manager.module'
import { SigChainModule } from '../../auth/sigchain.service.module'
import { OrbitDbService } from './orbitDb.service'
import { CommunityMetadataStore } from '../communityMetadata/communityMetadata.store'
import { UserProfileStore } from '../userProfile/userProfile.store'
import { ChannelsService } from '../channels/channels.service'
import { PublicChannelMessagesService } from '../channels/messages/public-channel-messages.service'
import { CommonModule } from '../../common/common.module'
import { LFAIdentityProvider } from './identity/lfa/lfa-identity.provider'
import { LFAIdentities } from './identity/lfa/lfa-identity.service'
import { PrivateChannelMessagesService } from '../channels/messages/private-channel-messages.service'
import { NotificationTokensStore } from '../notifications/notificationTokens.store'
import { MessagesAccessController } from '../channels/messages/orbitdb/MessagesAccessController'
import { PrivateMessagesAccessController } from '../channels/messages/orbitdb/PrivateMessagesAccessController'

@Module({
  imports: [
    LocalDbModule,
    forwardRef(() => IpfsModule),
    forwardRef(() => IpfsFileManagerModule),
    SigChainModule,
    CommonModule,
  ],
  providers: [
    OrbitDbService,
    CommunityMetadataStore,
    UserProfileStore,
    ChannelsService,
    PublicChannelMessagesService,
    PrivateChannelMessagesService,
    NotificationTokensStore,
    LFAIdentityProvider,
    LFAIdentities,
    MessagesAccessController,
    PrivateMessagesAccessController,
  ],
  exports: [
    OrbitDbService,
    CommunityMetadataStore,
    UserProfileStore,
    ChannelsService,
    PublicChannelMessagesService,
    PrivateChannelMessagesService,
    NotificationTokensStore,
    LFAIdentityProvider,
    LFAIdentities,
    MessagesAccessController,
    PrivateMessagesAccessController,
  ],
})
export class OrbitDbModule {}
