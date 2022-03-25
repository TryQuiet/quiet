import factoryGirl from 'factory-girl'
import { CustomReduxAdapter } from './reduxAdapter'
import { Store } from '../../sagas/store.types'
import { communities, identity, messages, publicChannels, users } from '../..'
import {
  createMessageSignatureTestHelper,
  createPeerIdTestHelper,
  createRootCertificateTestHelper,
  createUserCertificateTestHelper
} from './helpers'
import { getCrypto } from 'pkijs'
import { stringToArrayBuffer } from 'pvutils'
import { keyObjectFromString, verifySignature } from '@quiet/identity'
import { MessageType } from '../../sagas/messages/messages.types'
import { DateTime } from 'luxon'

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
      rootCa: ''
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
        await factory.create('CommunityChannels', { id: payload.id })
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
      nickname: factory.sequence('Identity.nickname', n => `user_${n}`)
    },
    {
      afterBuild: async (action: ReturnType<typeof identity.actions.addNewIdentity>) => {
        const community = communities.selectors.selectEntities(store.getState())[action.payload.id]
        if (community.CA) {
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
        }
        return action
      }
    }
  )

  factory.define('UserCertificate', users.actions.storeUserCertificate, {
    certificate: factory.assoc('Identity', 'userCertificate')
  })

  factory.define('CommunityChannels', publicChannels.actions.addPublicChannelsList, {
    id: factory.assoc('Community', 'id')
  })

  factory.define(
    'PublicChannel',
    publicChannels.actions.addChannel,
    {
      communityId: factory.assoc('Identity', 'id'),
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
              verified: true
            })
          } else {
            // Verify the signature
            const crypto = getCrypto()
            const cryptoKey = await keyObjectFromString(action.payload.message.pubKey, crypto)
            const signature = stringToArrayBuffer(action.payload.message.signature)
            const verified = await verifySignature(
              signature,
              action.payload.message.message,
              cryptoKey
            )
            await factory.create('MessageVerificationStatus', {
              message: action.payload.message,
              verified: verified
            })
          }
        }
        return action
      }
    }
  )

  factory.define('MessageVerificationStatus', messages.actions.test_message_verification_status, {
    message: factory.assoc('Message'),
    verified: true
  })

  return factory
}
