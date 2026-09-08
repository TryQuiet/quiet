import factoryGirl, { ObjectAdapter } from 'factory-girl'

import { CustomReduxAdapter } from './reduxAdapter'
import { Store } from '../../sagas/store.types'
import { createPeerIdTestHelper } from './helpers'
import { DateTime } from 'luxon'
import { generateTestChannelId } from '@quiet/common'
import {
  ChannelMessage,
  CommunityOwnership,
  FileMetadata,
  MessageType,
  SendingStatus,
  CancelDownloadPayload,
  CreateChannelPayload,
  CreateChannelResponse,
  DeleteChannelResponse,
  DeleteFilesFromChannelSocketPayload,
  DownloadFilePayload,
  GetMessagesPayload,
  InitCommunityPayload,
  MessagesLoadedPayload,
  SendMessagePayload,
  SocketActions,
  SocketEvents,
  AttachFilePayload,
  UserProfile,
  Identity,
  ResponseLaunchCommunityPayload,
  ResponseCreateCommunityPayload,
  ResponseJoinCommunityPayload,
  UserProfileDisplayData,
  InvitationData,
  InvitationPair,
  InvitationDataVersion,
  DeleteChannelPayload,
  ErrorPayload,
  ConnectionProcessInfo,
  User,
  PublicChannel,
  Community,
  SetUserProfilePayload,
  SetUserProfileResponse,
  LaunchCommunityPayload,
  HCaptchaFormResponse,
  HCaptchaRequest,
  InviteResultWithSalt,
  AddMembersChannelPayload,
  AddMembersChannelResponse,
  AddMembersChannelStatus,
  FileMessage,
  FileEncryptionMetadata,
  UserProfilesUpdatedPayload,
  ChannelOperationStatus,
  type InvitationAuthDataV5,
  type InvitationAuthDataV4,
  type SetChannelPermissionsPayload,
  type TestMessage,
} from '@quiet/types'
import { createLogger } from '../logger'
import { communitiesActions } from '../../sagas/communities/communities.slice'
import { communitiesSelectors } from '../../sagas/communities/communities.selectors'
import { identityActions } from '../../sagas/identity/identity.slice'
import { usersActions } from '../../sagas/users/users.slice'
import { messagesActions } from '../../sagas/messages/messages.slice'
import { publicChannelsActions } from '../../sagas/publicChannels/publicChannels.slice'
import { errorsActions } from '../../sagas/errors/errors.slice'
import { connectionActions } from '../../sagas/appConnection/connection.slice'
import { randomBytes } from 'crypto'

const logger = createLogger('factories')

export const generateMessageFactoryContentWithId = (
  channelId: string,
  userId: string,
  type?: MessageType,
  media?: FileMetadata
): ChannelMessage => {
  return {
    id: (Math.random() * 10 ** 18).toString(36),
    type: type || MessageType.Basic,
    message: (Math.random() * 10 ** 18).toString(36),
    createdAt: DateTime.utc().valueOf(),
    channelId,
    userId: userId || (Math.random() * 10 ** 18).toString(36),
    media: media || undefined,
  }
}

export const getBaseTypesFactory = async () => {
  const factory = new factoryGirl.FactoryGirl()
  factory.setAdapter(new ObjectAdapter())

  factory.define<Identity>('Identity', Object, {
    communityId: 'community-id',
    networkInfo: {
      hiddenService: {
        onionAddress: 'putnxiwutblglde5i2mczpo37h5n4dvoqkqg2mkxzov7riwqu2owiaid.onion',
        privateKey:
          'ED25519-V3:WND1FoFZyY+c1f0uD6FBWgKvSYl4CdKSizSR7djRekW/rqw5fTw+gN80sGk0gl01sL5i25noliw85zF1BUBRDQ==',
      },
      peerId: createPeerIdTestHelper(),
    },
    joinTimestamp: 1663747464000,
    userId: factory.sequence('Identity.userId', (n: number) => `userId_${n}`),
  })

  factory.define<Community>('Community', Object, {
    id: factory.sequence('Community.id', (n: number) => n.toString()),
    name: factory.sequence('Community.name', (n: number) => `community_${n}`),
    peerList: [],
    ownership: CommunityOwnership.Owner,
    teamId: factory.sequence('Community.teamId', (n: number) => `team_id_${n}`),
  })

  factory.define<PublicChannel>('PublicChannel', Object, {
    id: factory.sequence('PublicChannel.id', (n: number) => generateTestChannelId(`publicChannel${n}`)),
    name: factory.sequence('PublicChannel.name', (n: number) => `public-channel-${n}`),
    description: factory.sequence('PublicChannel.description', (n: number) => `description-${n}`),
    public: true,
    owner: factory.assoc('User', 'userId'),
    timestamp: DateTime.utc().toSeconds(),
    teamId: factory.assoc('Community', 'teamId'),
  })

  factory.define<UserProfileDisplayData>('UserProfileDisplayData', Object, {
    photo: 'dGVzdAo=',
    nickname: factory.sequence('UserProfileDisplayData.nickname', (n: number) => `userProfile.nickname_${n}`),
    bio: factory.sequence('UserProfileDisplayData.bio', (n: number) => `bio_${n}`),
  })

  factory.define<FileMessage>('FileMessage', Object, {
    id: factory.sequence('FileMessage.id', (n: number) => `profile-photo-user-profile-photo-cid-${n}-${n}`),
    channelId: '__profile-photo__',
  })

  factory.define<FileEncryptionMetadata>('FileEncryptionMetadata', Object, {
    header: factory.sequence('FileEncryptionMetadata.header', (n: number) => randomBytes(32).toString('base64')),
    recipient: {
      generation: 0,
      type: 'ROLE',
      name: 'MEMBER',
    },
  })

  factory.define<FileMetadata>('FileMetadata', Object, {
    cid: factory.sequence('FileMetadata.cid', (n: number) => `user-profile-photo-cid-${n}`),
    path: factory.sequence('FileMetadata.path', (n: number) => `/foo/bar/user-profile-photo-cid-${n}.png`),
    ext: '.png',
    name: factory.sequence('FileMetadata.name', (n: number) => `user-profile-photo-name-${n}`),
    message: factory.assoc('FileMessage'),
    size: factory.sequence('FileMetadata.size', (n: number) => 1024 + n),
    width: factory.sequence('FileMetadata.width', (n: number) => 100 + n),
    height: factory.sequence('FileMetadata.height', (n: number) => 100 + n),
    enc: factory.assoc('FileEncryptionMetadata'),
  })

  factory.define<UserProfile>('UserProfile', Object, {
    userId: factory.sequence('UserProfile.userId', (n: number) => `userId_${n}`),
    nickname: factory.sequence('UserProfile.nickname', (n: number) => `userProfile.nickname_${n}`),
    photo: undefined,
    bio: factory.sequence('UserProfile.bio', (n: number) => `bio_${n}`),
    profilePhoto: factory.assoc('FileMetadata'),
  })

  factory.define<User>('User', Object, {
    userId: factory.sequence('User.userId', (n: number) => `userId_${n}`),
    isRegistered: true,
    isDuplicated: false,
  })

  factory.define<ChannelMessage>('ChannelMessage', Object, {
    id: factory.sequence('ChannelMessage.id', (n: number) => `${n}`),
    type: MessageType.Basic,
    message: factory.sequence('ChannelMessage.message', (n: number) => `message_${n}`),
    createdAt: DateTime.utc().valueOf(),
    channelId: 'channel-id',
    userId: factory.sequence('ChannelMessage.userId', (n: number) => `userId_${n}`),
  })

  factory.define<InvitationPair>('InvitationPair', Object, {
    peerId: createPeerIdTestHelper().toString(),
    onionAddress: 'putnxiwutblglde5i2mczpo37h5n4dvoqkqg2mkxzov7riwqu2owiaid.onion',
  })

  factory.define<InvitationAuthDataV4 | InvitationAuthDataV5>('InvitationAuthData', Object, {
    communityName: 'community-name',
    seed: 'seed',
    teamId: 'abc123',
  })

  factory.define<InvitationData>('InvitationData', Object, {
    version: InvitationDataVersion.v4,
    authData: factory.assoc('InvitationAuthData'),
    pairs: [factory.assoc('InvitationPair')],
    psk: 'psk',
  })

  return factory
}

export const getReduxStoreFactory = async (store: Store) => {
  // @ts-ignore
  const factory = new factoryGirl.FactoryGirl()
  const baseTypes = await getBaseTypesFactory()

  factory.setAdapter(new CustomReduxAdapter(store))

  factory.define<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
    'Community',
    communitiesActions.addNewCommunity,
    {
      id: factory.sequence('Community.id', (n: number) => n.toString()),
      name: factory.sequence('Community.name', (n: number) => `community_${n}`),
      peerList: [],
      ownership: CommunityOwnership.Owner,
      teamId: factory.sequence('Community.teamId', (n: number) => `team_id_${n.toString()}`),
    },
    {
      afterCreate: async (payload: ReturnType<typeof communitiesActions.addNewCommunity>['payload']) => {
        // Set current community if there's no current community set yet
        const currentCommunity = communitiesSelectors.currentCommunity(store.getState())
        if (!currentCommunity) {
          store.dispatch(communitiesActions.setCurrentCommunity(payload.id))
        }
        // Create 'general' channel
        await factory.create('PublicChannel', {
          communityId: payload.id,
          channel: {
            name: 'general',
            description: 'Welcome to channel #general',
            timestamp: DateTime.utc().toSeconds(),
            owner: 'alice',
            id: generateTestChannelId('general'),
            public: true,
            teamId: payload.teamId,
          },
        })
        return payload
      },
    }
  )

  factory.define<ReturnType<typeof publicChannelsActions.setChannelPermissions>['payload']>(
    'ChannelPermissions',
    publicChannelsActions.setChannelPermissions,
    {
      genericPermissions: {
        public: {
          create: true,
          delete: true,
        },
        private: {
          create: true,
        },
      },
      channelSpecificPermissions: [],
    } as SetChannelPermissionsPayload
  )

  factory.define<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
    'Identity',
    identityActions.addNewIdentity,
    {
      communityId: factory.assoc('Community', 'id'),
      networkInfo: {
        hiddenService: {
          onionAddress: 'putnxiwutblglde5i2mczpo37h5n4dvoqkqg2mkxzov7riwqu2owiaid.onion',
          privateKey:
            'ED25519-V3:WND1FoFZyY+c1f0uD6FBWgKvSYl4CdKSizSR7djRekW/rqw5fTw+gN80sGk0gl01sL5i25noliw85zF1BUBRDQ==',
        },
        peerId: createPeerIdTestHelper(),
      },
      // 21.09.2022 - may be useful for testing purposes
      joinTimestamp: 1663747464000,
      userId: factory.assoc('UserProfile', 'userId'),
    }
  )

  factory.define<ReturnType<typeof usersActions.setUserProfile>['payload']>(
    'UserProfile',
    usersActions.setUserProfile,
    {
      nickname: factory.sequence('UserProfile.nickname', (n: number) => `user_${n}`),
      photo: 'dGVzdAo=',
      bio: factory.sequence('UserProfile.bio', (n: number) => `bio_${n}`),
      userId: factory.assoc('User', 'userId'),
      userData: {
        peerId: createPeerIdTestHelper().id,
        onionAddress: 'putnxiwutblglde5i2mczpo37h5n4dvoqkqg2mkxzov7riwqu2owiaid.onion',
      },
    }
  )

  factory.define<ReturnType<typeof usersActions.setUser>['payload']>('User', usersActions.setUser, {
    userId: factory.sequence('User.userId', (n: number) => `userId_${n}`),
    isRegistered: true,
    isDuplicated: false,
  })

  factory.define<ReturnType<typeof usersActions.setUsers>['payload']>('RemoveUser', usersActions.setUsers, [
    factory.assoc('User', 'userId'),
  ])

  factory.define<ReturnType<typeof messagesActions.addPublicChannelsMessagesBase>['payload']>(
    'PublicChannelsMessagesBase',
    messagesActions.addPublicChannelsMessagesBase,
    {
      channelId: factory.assoc('PublicChannel', 'id'),
    }
  )

  factory.define<ReturnType<typeof publicChannelsActions.setChannelSubscribed>['payload']>(
    'PublicChannelSubscription',
    publicChannelsActions.setChannelSubscribed,
    {
      channelId: factory.assoc('PublicChannel', 'id'),
    }
  )

  factory.define(
    'PublicChannel',
    publicChannelsActions.addChannel,
    {
      channel: factory.sequence('PublicChannel.channel', (n: number) => {
        const name = `public-channel-${n}`
        return {
          name,
          description: 'Description',
          timestamp: DateTime.utc().toSeconds(),
          owner: 'alice', // simpler than nested assoc; tests only need non‑undefined
          id: generateTestChannelId(name),
          public: true,
          teamId: factory.assoc('Community', 'teamId'),
        }
      }),
      status: ChannelOperationStatus.SUCCESS,
    },
    {
      afterCreate: async (payload: ReturnType<typeof publicChannelsActions.addChannel>['payload']) => {
        await factory.create('PublicChannelsMessagesBase', {
          channelId: payload.channel!.id,
        })
        await factory.create('PublicChannelSubscription', {
          channelId: payload.channel!.id,
        })
        return payload
      },
    }
  )

  factory.define<ReturnType<typeof messagesActions.addMessages>['payload']>(
    'AddMessages',
    messagesActions.addMessages,
    {
      messages: [baseTypes.assoc('ChannelMessage')],
      isVerified: true,
    }
  )

  factory.define(
    'TestMessage',
    publicChannelsActions.test_message,
    {
      message: {
        id: factory.sequence('Message.id', (n: number) => `${n}`),
        type: MessageType.Basic,
        message: factory.sequence('Message.message', (n: number) => `message_${n}`),
        createdAt: DateTime.utc().valueOf(),
        channelId: generateTestChannelId('general'),
        userId: factory.assoc('UserProfile', 'userId'),
      },
      verifyAutomatically: true,
    },
    {
      afterBuild: async (action: { payload: TestMessage }) => {
        if (action.payload.verifyAutomatically) {
          await factory.create('MessageVerificationStatus', {
            message: action.payload.message,
            isVerified: true,
          })
        }
        return action
      },
      afterCreate: async (payload: TestMessage) => {
        store.dispatch(
          messagesActions.addMessages({
            messages: [payload.message],
          })
        )
        return payload
      },
    }
  )

  factory.define<ReturnType<typeof publicChannelsActions.cacheMessages>['payload']>(
    'CacheMessages',
    publicChannelsActions.cacheMessages,
    {
      messages: [],
      channelId: factory.assoc('PublicChannel', 'id'),
    }
  )

  factory.define<ReturnType<typeof messagesActions.test_message_verification_status>['payload']>(
    'MessageVerificationStatus',
    messagesActions.test_message_verification_status,
    {
      message: factory.assoc('TestMessage'),
      isVerified: true,
    }
  )

  factory.define<ReturnType<typeof messagesActions.addMessagesSendingStatus>['payload']>(
    'MessageSendingStatus',
    messagesActions.addMessagesSendingStatus,
    {
      message: factory.assoc('TestMessage'),
      status: SendingStatus.Pending,
    }
  )

  factory.define<ReturnType<typeof errorsActions.addError>['payload']>('Error', errorsActions.addError, {
    type: 'community',
    code: 500,
    message: 'Community error',
    community: factory.assoc('Community', 'id'),
  })

  factory.define<ReturnType<typeof connectionActions.setConnectionProcess>['payload']>(
    'setConnectionProcess',
    connectionActions.setConnectionProcess,
    {
      info: ConnectionProcessInfo.INITIALIZING_IPFS,
      isOwner: true,
    }
  )

  return factory
}

/**
 * Defines factories related to socket events (both payload and response).
 * This function should be called once in your test setup (e.g., beforeAll).
 */
export const getSocketFactory = async () => {
  const factory = new factoryGirl.FactoryGirl()
  factory.setAdapter(new ObjectAdapter())
  const baseTypes = await getBaseTypesFactory()

  //
  // PAYLOAD FACTORIES
  //

  // Application events
  // These events don't need payloads (START, CLOSE)
  factory.define(SocketActions.START, Object, {})
  factory.define(SocketActions.CLOSE, Object, {})
  factory.define(SocketActions.CONNECTION, Object, {})
  factory.define(SocketActions.DISCONNECT, Object, {})
  factory.define<ErrorPayload>(SocketActions.ERROR, Object, {
    type: 'test',
    code: undefined,
    message: undefined,
    community: undefined,
    trace: undefined,
  })

  // Community events
  factory.define<InitCommunityPayload>(SocketActions.JOIN_COMMUNITY, Object, {
    id: 'community-id',
    name: 'Test Community',
    username: 'test-user',
    inviteData: baseTypes.build<InvitationData>('InvitationData'),
  })

  factory.define<ResponseJoinCommunityPayload>(`${SocketActions.JOIN_COMMUNITY}_response`, Object, {
    id: 'community-id',
    community: {
      id: 'community-id',
      name: 'Test Community',
      ownership: CommunityOwnership.User,
      peerList: ['peer-1', 'peer-2'],
      teamId: 'abc123',
    },
    identity: baseTypes.assoc('Identity', 'communityId'),
    profile: baseTypes.assoc('UserProfile'),
  })

  factory.define<InitCommunityPayload>(SocketActions.CREATE_COMMUNITY, Object, {
    id: factory.assoc(`${SocketActions.CREATE_COMMUNITY}_response`, 'id'),
    name: 'New Community',
    username: 'community-owner',
  })

  factory.define<ResponseCreateCommunityPayload>(`${SocketActions.CREATE_COMMUNITY}_response`, Object, {
    id: 'new-community-id',
    community: {
      id: 'new-community-id',
      name: 'New Community',
      ownership: CommunityOwnership.Owner,
      peerList: [],
      teamId: 'abc123',
    },
    identity: baseTypes.assoc('Identity', 'communityId'),
    profile: baseTypes.assoc('UserProfile'),
  })

  factory.define<LaunchCommunityPayload>(SocketActions.LAUNCH_COMMUNITY, Object, {
    id: 'launched-community-id',
  })

  factory.define<ResponseLaunchCommunityPayload>(`${SocketActions.LAUNCH_COMMUNITY}_response`, Object, {
    id: 'launched-community-id',
  })

  // LEAVE_COMMUNITY has no payload
  factory.define(SocketActions.LEAVE_COMMUNITY, Object, {})

  // Messages events
  factory.define<SendMessagePayload>(SocketActions.SEND_MESSAGE, Object, {
    message: {
      id: 'msg-id-1',
      type: 1, // MessageType.Basic
      message: 'Hello from the test!',
      createdAt: Date.now(),
      channelId: 'channel-id',
      userId: 'user-id',
    },
  })

  factory.define<DownloadFilePayload>(SocketActions.DOWNLOAD_FILE, Object, {
    metadata: {
      path: '/path/to/file',
      name: 'test-file.png',
      ext: '.png',
      cid: 'file-cid',
      message: {
        id: 'msg-id-1',
        channelId: 'channel-id',
      },
      size: 12345,
    },
    peerId: 'peer-id',
  })

  factory.define<CancelDownloadPayload>(SocketActions.CANCEL_DOWNLOAD, Object, {
    mid: 'message-id',
    peerId: 'peer-id',
  })

  factory.define<AttachFilePayload>(SocketActions.ATTACH_FILE, Object, {
    file: {
      path: '/path/to/file',
      name: 'test-file.png',
      ext: '.png',
      cid: 'file-cid',
      message: {
        id: 'msg-id-1',
        channelId: 'channel-id',
      },
      size: 12345,
    },
    peerId: 'peer-id',
  })

  factory.define<GetMessagesPayload>(SocketActions.GET_MESSAGES, Object, {
    ids: ['msg-id-1', 'msg-id-2'],
    peerId: 'peer-id',
    channelId: 'channel-id',
    communityId: 'community-id',
  })

  factory.define<MessagesLoadedPayload>(`${SocketActions.GET_MESSAGES}_response`, Object, {
    messages: [
      {
        id: 'msg-id-1',
        type: 1, // MessageType.Basic
        message: 'Test message 1',
        createdAt: Date.now(),
        channelId: 'channel-id',
        userId: 'user-id',
      },
    ],
  })

  factory.define<CreateChannelPayload>(SocketActions.CREATE_CHANNEL, Object, {
    name: 'Test Channel',
    description: 'A channel used for tests',
    teamId: 'foobar',
  })

  factory.define<CreateChannelResponse>(`${SocketActions.CREATE_CHANNEL}_response`, Object, {
    channel: {
      id: 'new-channel-id',
      name: 'Test Channel',
      description: 'A channel used for tests',
      owner: 'test-owner',
      timestamp: Date.now(),
      public: true,
      teamId: 'foobar',
    },
    status: ChannelOperationStatus.SUCCESS,
  })

  factory.define<AddMembersChannelPayload>(SocketActions.ADD_MEMBERS_TO_CHANNEL, Object, {
    channelId: 'new-channel-id',
    channelName: 'Test Channel',
    memberIds: [],
  } as AddMembersChannelPayload)

  factory.define<AddMembersChannelResponse>(`${SocketActions.ADD_MEMBERS_TO_CHANNEL}_response`, Object, {
    channelId: 'new-channel-id',
    status: AddMembersChannelStatus.SUCCESS,
  } as AddMembersChannelResponse)

  factory.define<DeleteChannelPayload>(SocketActions.DELETE_CHANNEL, Object, {
    channelId: 'channel-to-delete',
  })

  factory.define<DeleteChannelResponse>(`${SocketActions.DELETE_CHANNEL}_response`, Object, {
    channelId: 'channel-to-delete',
    deleted: true,
  })

  factory.define<DeleteFilesFromChannelSocketPayload>(SocketActions.DELETE_FILES_FROM_CHANNEL, Object, {
    messages: {
      'msg-id-1': {
        id: 'msg-id-1',
        type: 4, // MessageType.File
        message: 'File message',
        createdAt: Date.now(),
        channelId: 'channel-id',
        userId: 'user-id',
        media: {
          path: '/path/to/file',
          name: 'test-file.png',
          ext: '.png',
          cid: 'file-cid',
          message: {
            id: 'msg-id-1',
            channelId: 'channel-id',
          },
        },
      },
    },
  })

  // User profile events
  factory.define<SetUserProfilePayload>(SocketActions.SET_USER_PROFILE, Object, {
    profile: {
      userId: 'user-id',
      nickname: 'Test User',
      photo: 'dGVzdAo=',
      bio: 'This is a test user profile',
      userData: {
        onionAddress: 'test.onion',
        peerId: 'peer-id',
      },
    },
  })

  factory.define<UserProfilesUpdatedPayload>(SocketActions.USER_PROFILES_UPDATED, Object, {
    new: [
      {
        userId: 'user-id',
        nickname: 'Test User',
        photo: 'dGVzdAo=',
        bio: 'This is a test user profile',
        userData: {
          onionAddress: 'test.onion',
          peerId: 'peer-id',
        },
      },
    ],
    updates: [],
  })

  factory.define<SetUserProfileResponse>(`${SocketActions.SET_USER_PROFILE}_response`, Object, {
    success: true,
    error: undefined,
  })

  // Migration
  factory.define<Record<string, any>['payload']>(SocketActions.LOAD_MIGRATION_DATA, Object, {
    legacyVersion: 'v1',
    data: {},
  })

  // Local First Auth
  factory.define<string>(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, Object, () => 'invite-code')

  factory.define<{ valid: boolean; newInvite?: InviteResultWithSalt }>(
    `${SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE}_response`,
    Object,
    {
      valid: true,
    }
  )

  // Captcha events
  factory.define<HCaptchaFormResponse>(SocketActions.HCAPTCHA_FORM_RESPONSE, Object, {
    token: 'test-hcaptcha-token',
    error: undefined,
    cancelled: false,
  })

  factory.define<HCaptchaRequest>(SocketActions.HCAPTCHA_REQUEST, Object, {
    siteKey: 'test-site-key',
  })

  factory.define<string>(SocketEvents.HCAPTCHA_SITE_KEY, Object, () => 'test-site-key')

  factory.define<boolean>(SocketEvents.HCAPTCHA_VERIFICATION_UPDATE, Object, () => true)

  factory.define<boolean>(SocketActions.TOGGLE_P2P, Object, () => true)

  // Push notification events
  factory.define<{ deviceToken: string; bundleId: string; platform: 'ios' | 'android' }>(
    SocketActions.SEND_DEVICE_TOKEN,
    Object,
    {
      deviceToken: 'test-device-token',
      bundleId: 'com.quietmobile',
      platform: 'ios',
    }
  )

  return factory
}
