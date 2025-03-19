import factoryGirl from 'factory-girl'

import { CustomReduxAdapter } from './reduxAdapter'

import { Store } from '../../sagas/store.types'

import { createMessageSignatureTestHelper, createPeerIdTestHelper } from './helpers'

import { DateTime } from 'luxon'

import { communities, identity, messages, publicChannels, users, errors } from '../..'

import { generateChannelId } from '@quiet/common'

import { createRootCertificateTestHelper } from '@quiet/identity'

import { ChannelMessage, FileMetadata, MessageType, SendingStatus } from '@quiet/types'

export const generateMessageFactoryContentWithId = (
  channelId: string,
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
    author: 'alice',
    media: media || undefined,
  }
}

export const getFactory = async (store: Store) => {
  // @ts-ignore
  const factory = new factoryGirl.FactoryGirl()

  factory.setAdapter(new CustomReduxAdapter(store))

  const registrarUrl = 'http://ugmx77q2tnm5fliyfxfeen5hsuzjtbsz44tsldui2ju7vl5xj4d447yd.onion'

  factory.define(
    'Community',
    communities.actions.addNewCommunity,
    {
      id: factory.sequence('Community.id', (n: number) => n),
      name: factory.sequence('Community.name', (n: number) => `community_${n}`),
      CA: await createRootCertificateTestHelper(registrarUrl),
      peerList: [],
      ownerCertificate: '',
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

  factory.define('Identity', identity.actions.addNewIdentity, {
    communityId: factory.assoc('Community', 'id'),
    hiddenService: {
      onionAddress: 'putnxiwutblglde5i2mczpo37h5n4dvoqkqg2mkxzov7riwqu2owiaid.onion',
      privateKey: 'ED25519-V3:WND1FoFZyY+c1f0uD6FBWgKvSYl4CdKSizSR7djRekW/rqw5fTw+gN80sGk0gl01sL5i25noliw85zF1BUBRDQ==',
    },
    peerId: createPeerIdTestHelper(),
    nickname: factory.sequence('Identity.nickname', (n: number) => `user_${n}`),
    // 21.09.2022 - may be useful for testing purposes
    joinTimestamp: 1663747464000,
    userId: factory.sequence('Identity.userId', (n: number) => `userId_${n}`),
  })

  factory.define('PublicChannelsMessagesBase', messages.actions.addPublicChannelsMessagesBase, {
    channelId: factory.assoc('PublicChannel', 'id'),
  })

  factory.define('PublicChannelSubscription', publicChannels.actions.setChannelSubscribed, {
    channelId: factory.assoc('PublicChannel', 'id'),
  })

  factory.define(
    'PublicChannel',
    publicChannels.actions.addChannel,
    {
      channel: {
        name: factory.sequence('PublicChannel.name', (n: number) => `public-channel-${n}`),
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

  factory.define(
    'Message',
    publicChannels.actions.test_message,
    {
      identity: factory.assoc('Identity'),
      message: {
        id: factory.sequence('Message.id', (n: number) => `${n}`),
        type: MessageType.Basic,
        message: factory.sequence('Message.message', (n: number) => `message_${n}`),
        createdAt: DateTime.utc().valueOf(),
        channelId: generateChannelId('general'),
      },
      verifyAutomatically: true,
    },
    {
      afterBuild: async (action: ReturnType<typeof publicChannels.actions.test_message>) => {
        if (action.payload.verifyAutomatically) {
          // Verify the signature
          await factory.create('MessageVerificationStatus', {
            message: action.payload.message,
            isVerified: true,
          })
        }
        return action
      },
      afterCreate: async (payload: ReturnType<typeof publicChannels.actions.test_message>['payload']) => {
        store.dispatch(
          messages.actions.addMessages({
            messages: [payload.message],
          })
        )

        return payload
      },
    }
  )

  factory.define('CacheMessages', publicChannels.actions.cacheMessages, {
    messages: [],
    channelId: factory.assoc('PublicChannel', 'id'),
    communityId: factory.assoc('Community', 'id'),
  })

  factory.define('MessageVerificationStatus', messages.actions.test_message_verification_status, {
    message: factory.assoc('Message'),
    isVerified: true,
  })

  factory.define('MessageSendingStatus', messages.actions.addMessagesSendingStatus, {
    id: factory.assoc('Message', 'id'),
    status: SendingStatus.Pending,
  })

  factory.define('Error', errors.actions.addError, {
    type: 'community',
    code: 500,
    message: 'Community error',
    community: factory.assoc('Community', 'id'),
  })

  return factory
}
