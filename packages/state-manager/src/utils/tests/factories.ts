import factoryGirl, { ObjectAdapter } from 'factory-girl'

import { CustomReduxAdapter } from './reduxAdapter'
import { Store } from '../../sagas/store.types'
import { createPeerIdTestHelper } from './helpers'
import { DateTime } from 'luxon'
import { communities, identity, messages, publicChannels, users, errors, connection } from '../..'
import { generateChannelId } from '@quiet/common'
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
  NetworkInfo,
  SendMessagePayload,
  SocketActions,
  UploadFilePayload,
  UserProfile,
  Identity,
  ResponseLaunchCommunityPayload,
  ResponseCreateCommunityPayload,
  ResponseJoinCommunityPayload,
  UserProfileDisplayData,
  InvitationData,
  InvitationPair,
  InvitationDataVersion,
  InvitationAuthData,
  DeleteChannelPayload,
  ErrorPayload,
  ConnectionProcessInfo,
  SetConnectionProcessInfoPayload,
  User,
  PublicChannel,
  TestMessage,
} from '@quiet/types'
import { InviteResult } from '@localfirst/auth'
import { createLogger } from '../logger'

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
    userId: (Math.random() * 10 ** 18).toString(36),
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

  factory.define<PublicChannel>('PublicChannel', Object, {
    id: factory.sequence('PublicChannel.id', (n: number) => generateChannelId(`publicChannel${n}`)),
    name: factory.sequence('PublicChannel.name', (n: number) => `public-channel-${n}`),
    description: factory.sequence('PublicChannel.description', (n: number) => `description-${n}`),
    owner: factory.assoc('User', 'userId'),
    timestamp: DateTime.utc().toSeconds(),
  })

  factory.define<UserProfileDisplayData>('UserProfileDisplayData', Object, {
    photo: 'dGVzdAo=',
    nickname: factory.sequence('UserProfileDisplayData.nickname', (n: number) => `userProfile.nickname_${n}`),
    bio: factory.sequence('UserProfileDisplayData.bio', (n: number) => `bio_${n}`),
  })

  factory.define<UserProfile>('UserProfile', Object, {
    userId: factory.sequence('UserProfile.userId', (n: number) => `userId_${n}`),
    nickname: factory.sequence('UserProfile.nickname', (n: number) => `userProfile.nickname_${n}`),
    photo: 'dGVzdAo=',
    bio: factory.sequence('UserProfile.bio', (n: number) => `bio_${n}`),
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

  factory.define<InvitationAuthData>('InvitationAuthData', Object, {
    communityName: 'community-name',
    seed: 'seed',
  })

  factory.define<InvitationData>('InvitationData', Object, {
    version: InvitationDataVersion.v2,
    authData: factory.assoc('InvitationAuthData'),
    pairs: [factory.assoc('InvitationPair')],
    psk: 'psk',
    ownerOrbitDbIdentity: 'owner-orbit-db-identity',
  })

  return factory
}

export const getReduxStoreFactory = async (store: Store) => {
  // @ts-ignore
  const factory = new factoryGirl.FactoryGirl()
  const baseTypes = await getBaseTypesFactory()

  factory.setAdapter(new CustomReduxAdapter(store))

  factory.define<ReturnType<typeof communities.actions.addNewCommunity>['payload']>(
    'Community',
    communities.actions.addNewCommunity,
    {
      id: factory.sequence('Community.id', (n: number) => n.toString()),
      name: factory.sequence('Community.name', (n: number) => `community_${n}`),
      peerList: [],
      ownership: CommunityOwnership.Owner,
    },
    {
      afterCreate: async (payload: ReturnType<typeof communities.actions.addNewCommunity>['payload']) => {
        // Set current community if there's no current community set yet
        const currentCommunity = communities.selectors.currentCommunity(store.getState())
        if (!currentCommunity) {
          store.dispatch(communities.actions.setCurrentCommunity(payload.id))
        }
        // Create 'general' channel
        await factory.create('PublicChannel', {
          communityId: payload.id,
          channel: {
            name: 'general',
            description: 'Welcome to channel #general',
            timestamp: DateTime.utc().toSeconds(),
            owner: 'alice',
            id: generateChannelId('general'),
          },
        })
        return payload
      },
    }
  )

  factory.define<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
    'Identity',
    identity.actions.addNewIdentity,
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

  factory.define<ReturnType<typeof users.actions.setUserProfile>['payload']>(
    'UserProfile',
    users.actions.setUserProfile,
    {
      nickname: factory.sequence('UserProfile.nickname', (n: number) => `user_${n}`),
      photo: 'dGVzdAo=',
      bio: factory.sequence('UserProfile.bio', (n: number) => `bio_${n}`),
      userId: factory.assoc('User', 'userId'),
    }
  )

  factory.define<ReturnType<typeof users.actions.setUser>['payload']>('User', users.actions.setUser, {
    userId: factory.sequence('User.userId', (n: number) => `userId_${n}`),
    isRegistered: true,
    isDuplicated: false,
  })

  factory.define<ReturnType<typeof users.actions.setUsers>['payload']>('RemoveUser', users.actions.setUsers, [
    factory.assoc('User', 'userId'),
  ])

  factory.define<ReturnType<typeof messages.actions.addPublicChannelsMessagesBase>['payload']>(
    'PublicChannelsMessagesBase',
    messages.actions.addPublicChannelsMessagesBase,
    {
      channelId: factory.assoc('PublicChannel', 'id'),
    }
  )

  factory.define<ReturnType<typeof publicChannels.actions.setChannelSubscribed>['payload']>(
    'PublicChannelSubscription',
    publicChannels.actions.setChannelSubscribed,
    {
      channelId: factory.assoc('PublicChannel', 'id'),
    }
  )

  factory.define<ReturnType<typeof publicChannels.actions.addChannel>['payload']>(
    'PublicChannel',
    publicChannels.actions.addChannel,
    {
      channel: {
        name: 'publicChannel',
        description: 'Description',
        timestamp: DateTime.utc().toSeconds(),
        owner: factory.assoc('Identity', 'nickname'),
        id: generateChannelId(factory.sequence('PublicChannel.name', (n: number) => `publicChannel${n}`).toString()),
      },
    },
    {
      afterCreate: async (payload: ReturnType<typeof publicChannels.actions.addChannel>['payload']) => {
        await factory.create('PublicChannelsMessagesBase', {
          channelId: payload.channel.id,
        })
        await factory.create('PublicChannelSubscription', {
          channelId: payload.channel.id,
        })
        return payload
      },
    }
  )

  factory.define<ReturnType<typeof messages.actions.addMessages>['payload']>(
    'AddMessages',
    messages.actions.addMessages,
    {
      messages: [baseTypes.assoc('ChannelMessage')],
      isVerified: true,
    }
  )

  factory.define(
    'TestMessage',
    publicChannels.actions.test_message,
    {
      message: {
        id: factory.sequence('Message.id', (n: number) => `${n}`),
        type: MessageType.Basic,
        message: factory.sequence('Message.message', (n: number) => `message_${n}`),
        createdAt: DateTime.utc().valueOf(),
        channelId: generateChannelId('general'),
        userId: factory.assoc('UserProfile', 'userId'),
      },
      verifyAutomatically: true,
    },
    {
      afterBuild: async action => {
        if (action.payload.verifyAutomatically) {
          await factory.create('MessageVerificationStatus', {
            message: action.payload.message,
            isVerified: true,
          })
        }
        return action
      },
      afterCreate: async payload => {
        store.dispatch(
          messages.actions.addMessages({
            messages: [payload.message],
          })
        )
        return payload
      },
    }
  )

  factory.define<ReturnType<typeof publicChannels.actions.cacheMessages>['payload']>(
    'CacheMessages',
    publicChannels.actions.cacheMessages,
    {
      messages: [],
      channelId: factory.assoc('PublicChannel', 'id'),
    }
  )

  factory.define<ReturnType<typeof messages.actions.test_message_verification_status>['payload']>(
    'MessageVerificationStatus',
    messages.actions.test_message_verification_status,
    {
      message: factory.assoc('TestMessage'),
      isVerified: true,
    }
  )

  factory.define<ReturnType<typeof messages.actions.addMessagesSendingStatus>['payload']>(
    'MessageSendingStatus',
    messages.actions.addMessagesSendingStatus,
    {
      message: factory.assoc('TestMessage'),
      status: SendingStatus.Pending,
    }
  )

  factory.define<ReturnType<typeof errors.actions.addError>['payload']>('Error', errors.actions.addError, {
    type: 'community',
    code: 500,
    message: 'Community error',
    community: factory.assoc('Community', 'id'),
  })

  factory.define<ReturnType<typeof connection.actions.setConnectionProcess>['payload']>(
    'setConnectionProcess',
    connection.actions.setConnectionProcess,
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
    },
    identity: baseTypes.assoc('Identity', 'communityId'),
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
    },
    identity: baseTypes.assoc('Identity', 'communityId'),
  })

  // TODO: implement with multiple community support
  // factory.define<InitCommunityPayload>(SocketActions.LAUNCH_COMMUNITY, Object, {
  //   id: 'launched-community-id',
  //   name: 'Launched Community',
  //   username: 'community-member',
  // })

  // factory.define<ResponseLaunchCommunityPayload>(`${SocketActions.LAUNCH_COMMUNITY}_response`, Object, {
  //   id: 'launched-community-id',
  // })

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

  factory.define<UploadFilePayload>(SocketActions.UPLOAD_FILE, Object, {
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
    id: 'new-channel-id',
    name: 'Test Channel',
    description: 'A channel used for tests',
  })

  factory.define<CreateChannelResponse>(`${SocketActions.CREATE_CHANNEL}_response`, Object, {
    channel: {
      id: 'new-channel-id',
      name: 'Test Channel',
      description: 'A channel used for tests',
      owner: 'test-owner',
      timestamp: Date.now(),
    },
  })

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
  factory.define<UserProfile>(SocketActions.SET_USER_PROFILE, Object, {
    userId: 'user-id',
  })

  // Migration
  factory.define<Record<string, any>['payload']>(SocketActions.LOAD_MIGRATION_DATA, Object, {
    legacyVersion: 'v1',
    data: {},
  })

  // Local First Auth
  factory.define<string>(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, Object, () => 'invite-code')

  factory.define<{ valid: boolean; newInvite?: InviteResult }>(
    `${SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE}_response`,
    Object,
    {
      valid: true,
    }
  )

  return factory
}
