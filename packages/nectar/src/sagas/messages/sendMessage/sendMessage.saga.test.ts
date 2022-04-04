import { combineReducers } from '@reduxjs/toolkit'
import {
  keyFromCertificate,
  loadPrivateKey,
  parseCertificate,
  sign
} from '@quiet/identity'
import { KeyObject } from 'crypto'
import { arrayBufferToString } from 'pvutils'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { Socket } from 'socket.io-client'
import { communitiesAdapter } from '../../communities/communities.adapter'
import {
  communitiesReducer,
  CommunitiesState,
  Community
} from '../../communities/communities.slice'
import { identityAdapter } from '../../identity/identity.adapter'
import { identityReducer, IdentityState } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import {
  channelMessagesAdapter,
  communityChannelsAdapter,
  publicChannelsAdapter
} from '../../publicChannels/publicChannels.adapter'
import {
  publicChannelsReducer,
  PublicChannelsState
} from '../../publicChannels/publicChannels.slice'
import { CommunityChannels, PublicChannel } from '../../publicChannels/publicChannels.types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { StoreKeys } from '../../store.keys'
import { MessageTypes } from '../const/messageTypes'
import { messagesActions } from '../messages.slice'
import { generateMessageId, getCurrentTime } from '../utils/message.utils'
import { sendMessageSaga } from './sendMessage.saga'
import { unreadMessagesAdapter } from '../../publicChannels/markUnreadMessages/unreadMessages.adapter'

describe('sendMessageSaga', () => {
  const communityId = 'id'

  const community: Community = {
    id: communityId,
    name: 'community',
    CA: null,
    rootCa: '',
    peerList: [],
    registrarUrl: 'registrarUrl',
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0
  }

  const identity: Identity = {
    id: communityId,
    hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: 'id', pubKey: 'pubKey', privKey: 'privKey' },
    nickname: '',
    userCsr: undefined,
    userCertificate: ''
  }

  const csr = {
    userCsr: 'userCsr',
    userKey: 'userKey',
    pkcs10: {
      publicKey: jest.fn() as unknown as KeyObject,
      privateKey: jest.fn() as unknown as KeyObject,
      pkcs10: {
        userKey: jest.fn() as unknown
      }
    }
  }

  identity.userCertificate = 'userCertificate'
  identity.userCsr = csr

  const publicChannel: PublicChannel = {
    name: 'general',
    description: 'description',
    owner: 'user',
    timestamp: 0,
    address: 'address',
    messagesSlice: 0
  }

  const communityChannels: CommunityChannels = {
    id: communityId,
    currentChannel: publicChannel.address,
    channels: publicChannelsAdapter.setAll(
      publicChannelsAdapter.getInitialState(),
      [publicChannel]
    ),
    channelMessages: channelMessagesAdapter.getInitialState(),
    unreadMessages: unreadMessagesAdapter.getInitialState()
  }

  test('sign and send message', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    await expectSaga(
      sendMessageSaga,
      socket,
      messagesActions.sendMessage('message')
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.PublicChannels]: publicChannelsReducer
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            )
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identity]
            )
          },
          [StoreKeys.PublicChannels]: {
            ...new PublicChannelsState(),
            channels: communityChannelsAdapter.setAll(
              communityChannelsAdapter.getInitialState(),
              [communityChannels]
            )
          }
        }
      )
      .provide([
        [call.fn(parseCertificate), 'certificate'],
        [call.fn(keyFromCertificate), 'key'],
        [call.fn(loadPrivateKey), 'privKey'],
        [call.fn(sign), jest.fn() as unknown as ArrayBuffer],
        [call.fn(arrayBufferToString), 'signature'],
        [call.fn(generateMessageId), 4],
        [call.fn(getCurrentTime), 8]
      ])
      .apply(socket, socket.emit, [
        SocketActionTypes.SEND_MESSAGE,
        {
          peerId: identity.peerId.id,
          message: {
            id: 4,
            type: MessageTypes.BASIC,
            message: 'message',
            createdAt: 8,
            channelAddress: publicChannel.address,
            signature: 'signature',
            pubKey: 'key'
          }
        }
      ])
      .run()
  })
})
