import factoryGirl from 'factory-girl'
import { CustomReduxAdapter } from './reduxAdapter'
import { Store } from '../../sagas/store.types'
import { communities, identity, messages, publicChannels, users, errors, DownloadState } from '../..'
import {
  createMessageSignatureTestHelper,
  createPeerIdTestHelper,
  createRootCertificateTestHelper,
  createUserCertificateTestHelper
} from './helpers'
import { getCrypto } from 'pkijs'
import { stringToArrayBuffer } from 'pvutils'
import { keyObjectFromString, verifySignature } from '@quiet/identity'
import { MessageType, SendingStatus } from '../../sagas/messages/messages.types'
import { DateTime } from 'luxon'
import { messagesActions } from '../../sagas/messages/messages.slice'
import { currentCommunity } from '../../sagas/communities/communities.selectors'
import { publicChannelsActions } from '../../sagas/publicChannels/publicChannels.slice'
import { filesActions } from '../../sagas/files/files.slice'
import { identityActions } from '../../sagas/identity/identity.slice'

export const getFactory = async (store: Store) => {
  const factory = new factoryGirl.FactoryGirl()

  factory.setAdapter(new CustomReduxAdapter(store))

  factory.define(
    'Community',
    communities.actions.addNewCommunity,
    {
      id: factory.sequence('Community.id', n => n),
      name: factory.sequence('Community.name', n => `community_${n}`),
      CA: await createRootCertificateTestHelper(
        factory.sequence('Community.name', n => `community_${n}`)
      ),
      registrarUrl: 'http://ugmx77q2tnm5fliyfxfeen5hsuzjtbsz44tsldui2ju7vl5xj4d447yd.onion',
      rootCa: '',
      peerList: []
    },
    {
      afterCreate: async (
        payload: ReturnType<typeof communities.actions.addNewCommunity>['payload']
      ) => {
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
            address: 'general'
          }
        })
        return payload
      }
    }
  )

  factory.define(
    'Identity',
    identity.actions.addNewIdentity,
    {
      id: factory.assoc('Community', 'id'),
      hiddenService: {
        onionAddress: 'putnxiwutblglde5i2mczpo37h5n4dvoqkqg2mkxzov7riwqu2owiaid.onion',
        privateKey:
          'ED25519-V3:WND1FoFZyY+c1f0uD6FBWgKvSYl4CdKSizSR7djRekW/rqw5fTw+gN80sGk0gl01sL5i25noliw85zF1BUBRDQ=='
      },
      peerId: createPeerIdTestHelper(),
      dmKeys: {
        publicKey: '9f016defcbe48829db163e86b28efb10318faf3b109173105e3dc024e951bb1b',
        privateKey: '4dcebbf395c0e9415bc47e52c96fcfaf4bd2485a516f45118c2477036b45fc0b'
      },
      nickname: factory.sequence('Identity.nickname', n => `user_${n}`),
      userCertificate: undefined,
      // 21.09.2022 - may be useful for testing purposes
      joinTimestamp: 1663747464000
    },
    {
      afterBuild: async (action: ReturnType<typeof identity.actions.addNewIdentity>) => {
        const requestCertificate = action.payload.userCertificate === undefined
        const community = communities.selectors.selectEntities(store.getState())[action.payload.id]
        if (requestCertificate && community.CA) {
          const userCertData = await createUserCertificateTestHelper(
            {
              nickname: action.payload.nickname,
              commonName: action.payload.hiddenService.onionAddress,
              peerId: action.payload.peerId.id
            },
            community.CA
          )
          action.payload.userCsr = userCertData.userCsr
          action.payload.userCertificate = userCertData.userCert.userCertString
          // Store user's certificate even if the user won't be stored itself
          // (to be able to display messages sent by this user)
          await factory.create('UserCertificate', {
            certificate: action.payload.userCertificate
          })
        }
        return action
      }
    }
  )

  factory.define('UserCertificate', users.actions.storeUserCertificate, {
    certificate: factory.assoc('Identity', 'userCertificate')
  })

  factory.define('PublicChannelsMessagesBase', messages.actions.addPublicChannelsMessagesBase, {
    channelAddress: factory.assoc('PublicChannel', 'address')
  })

  factory.define('PublicChannelSubscription', publicChannels.actions.setChannelSubscribed, {
    channelAddress: factory.assoc('PublicChannel', 'address')
  })

  factory.define(
    'PublicChannel',
    publicChannels.actions.addChannel,
    {
      channel: {
        name: factory.sequence('PublicChannel.name', n => `public-channel-${n}`),
        description: 'Description',
        timestamp: DateTime.utc().toSeconds(),
        owner: factory.assoc('Identity', 'nickname'),
        address: ''
      }
    },
    {
      afterBuild: (action: ReturnType<typeof publicChannels.actions.addChannel>) => {
        action.payload.channel.address = action.payload.channel.name
        return action
      },
      afterCreate: async (
        payload: ReturnType<typeof publicChannels.actions.addChannel>['payload']
      ) => {
        await factory.create('PublicChannelsMessagesBase', ({ channelAddress: payload.channel.address }))
        await factory.create('PublicChannelSubscription', ({ channelAddress: payload.channel.address }))
        return payload
      }
    }
  )

  factory.define(
    'Message',
    publicChannels.actions.test_message,
    {
      identity: factory.assoc('Identity'),
      message: {
        id: factory.sequence('Message.id', n => `${n}`),
        type: MessageType.Basic,
        message: factory.sequence('Message.message', n => `message_${n}`),
        createdAt: DateTime.utc().valueOf(),
        channelAddress: 'general',
        signature: '',
        pubKey: ''
      },
      verifyAutomatically: false
    },
    {
      afterBuild: async (action: ReturnType<typeof publicChannels.actions.test_message>) => {
        let signatureGenerated: boolean = false

        // Generate signature if not specified
        if (action.payload.message.signature === '') {
          signatureGenerated = true
          const { signature, pubKey } = await createMessageSignatureTestHelper(
            action.payload.message.message,
            action.payload.identity.userCertificate,
            action.payload.identity.userCsr.userKey
          )
          action.payload.message.signature = signature
          action.payload.message.pubKey = pubKey
        }

        if (action.payload.verifyAutomatically) {
          // Mock verification status (which will always be true as the signature has been generated by the factory)
          if (signatureGenerated) {
            await factory.create('MessageVerificationStatus', {
              message: action.payload.message,
              isVerified: true
            })
          } else {
            // Verify the signature
            const crypto = getCrypto()
            const cryptoKey = await keyObjectFromString(action.payload.message.pubKey, crypto)
            const signature = stringToArrayBuffer(action.payload.message.signature)
            const isVerified = await verifySignature(
              signature,
              action.payload.message.message,
              cryptoKey
            )
            await factory.create('MessageVerificationStatus', {
              message: action.payload.message,
              isVerified
            })
          }
        }
        return action
      },
      afterCreate: async (
        payload: ReturnType<typeof publicChannels.actions.test_message>['payload']
      ) => {
        const community = currentCommunity(store.getState())
        store.dispatch(messagesActions.incomingMessages({
          messages: [payload.message]
        }))

        return payload
      }
    }
  )

  factory.define('CacheMessages', publicChannelsActions.cacheMessages, {
    messages: [],
    channelAddress: factory.assoc('PublicChannel', 'address'),
    communityId: factory.assoc('Community', 'id')
  })

  factory.define('MessageVerificationStatus', messages.actions.test_message_verification_status, {
    message: factory.assoc('Message'),
    isVerified: true
  })

  factory.define('MessageSendingStatus', messages.actions.addMessagesSendingStatus, {
    id: factory.assoc('Message', 'id'),
    status: SendingStatus.Pending
  })

  factory.define('Error', errors.actions.addError, {
    type: 'community',
    code: 500,
    message: 'Community error',
    community: factory.assoc('Community', 'id')
  })

  return factory
}
