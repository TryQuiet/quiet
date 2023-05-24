import {
  setupCrypto,
  keyFromCertificate,
  loadPrivateKey,
  parseCertificate,
  sign
} from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { arrayBufferToString } from 'pvutils'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { Socket } from 'socket.io-client'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { messagesActions } from '../messages.slice'
import { generateMessageId, getCurrentTime } from '../utils/message.utils'
import { sendMessageSaga } from './sendMessage.saga'
import { FactoryGirl } from 'factory-girl'
import { currentChannelAddress } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { Community, FileMetadata, Identity, MessageType, PublicChannel, SocketActionTypes } from '@quiet/types'

describe('sendMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    sailingChannel = (await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
      'PublicChannel',
      {
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          address: 'sailing'
        }
      }
    )).channel
  })

  test('sign and send message in current channel', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const currentChannel = currentChannelAddress(store.getState())

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendMessageSaga,
      socket,
      messagesActions.sendMessage({ message: 'message' })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(parseCertificate), 'certificate'],
        [call.fn(keyFromCertificate), 'publicKey'],
        [call.fn(loadPrivateKey), 'privateKey'],
        [call.fn(sign), jest.fn() as unknown as ArrayBuffer],
        [call.fn(arrayBufferToString), 'signature'],
        [call.fn(generateMessageId), 4],
        [call.fn(getCurrentTime), 8]
      ])
      .apply(socket, socket.emit, [
        SocketActionTypes.SEND_MESSAGE,
        {
          peerId: alice.peerId.id,
          message: {
            id: 4,
            type: MessageType.Basic,
            message: 'message',
            createdAt: 8,
            channelAddress: currentChannel,
            signature: 'signature',
            pubKey: 'publicKey',
            media: undefined
          }
        }
      ])
      .run()
  })

  test('sign and send message in specific channel', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendMessageSaga,
      socket,
      messagesActions.sendMessage({ message: 'message', channelAddress: sailingChannel.address })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(parseCertificate), 'certificate'],
        [call.fn(keyFromCertificate), 'publicKey'],
        [call.fn(loadPrivateKey), 'privateKey'],
        [call.fn(sign), jest.fn() as unknown as ArrayBuffer],
        [call.fn(arrayBufferToString), 'signature'],
        [call.fn(generateMessageId), 16],
        [call.fn(getCurrentTime), 24]
      ])
      .apply(socket, socket.emit, [
        SocketActionTypes.SEND_MESSAGE,
        {
          peerId: alice.peerId.id,
          message: {
            id: 16,
            type: MessageType.Basic,
            message: 'message',
            createdAt: 24,
            channelAddress: sailingChannel.address,
            signature: 'signature',
            pubKey: 'publicKey',
            media: undefined
          }
        }
      ])
      .run()
  })

  test('do not broadcast message until file is uploaded', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const messageId = Math.random().toString(36).substr(2.9)
    const currentChannel = currentChannelAddress(store.getState())

    const media: FileMetadata = {
      cid: 'cid',
      path: `uploading_${messageId}`,
      name: 'file',
      ext: 'ext',
      message: {
        id: messageId,
        channelAddress: currentChannel
      }
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendMessageSaga,
      socket,
      messagesActions.sendMessage({ message: '', media: media })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(parseCertificate), 'certificate'],
        [call.fn(keyFromCertificate), 'publicKey'],
        [call.fn(loadPrivateKey), 'privateKey'],
        [call.fn(sign), jest.fn() as unknown as ArrayBuffer],
        [call.fn(arrayBufferToString), 'signature'],
        [call.fn(generateMessageId), 4],
        [call.fn(getCurrentTime), 8]
      ])
      .not.apply(socket, socket.emit, [
        SocketActionTypes.SEND_MESSAGE,
        {
          peerId: alice.peerId.id,
          message: {
            id: 4,
            type: MessageType.Basic,
            message: 'message',
            createdAt: 8,
            channelAddress: currentChannel,
            signature: 'signature',
            pubKey: 'publicKey',
            media: undefined
          }
        }
      ])
      .run()
  })
})
