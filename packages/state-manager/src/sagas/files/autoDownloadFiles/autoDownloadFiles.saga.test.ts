import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { generateMessageFactoryContentWithId, getFactory, type publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from 'socket.io-client'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { messagesActions } from '../../messages/messages.slice'
import { type FactoryGirl } from 'factory-girl'
import { autoDownloadFilesSaga } from './autoDownloadFiles.saga'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { AUTODOWNLOAD_SIZE_LIMIT } from '../../../constants'
import { generateChannelId } from '@quiet/common'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import {
  type Community,
  type FileMetadata,
  type Identity,
  MessageType,
  type PublicChannel,
  SocketActionTypes,
} from '@quiet/types'

describe('downloadFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: PublicChannel
  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    alice = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    sailingChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          id: generateChannelId('sailing'),
        },
      })
    ).channel
  })

  test('auto download file of type image', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const id = Math.random().toString(36).substr(2.9)

    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'image',
      ext: 'png',
      message: {
        id,
        channelId: generalChannel.id,
      },
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.incomingMessages({
        messages: [
          {
            id,
            type: MessageType.Image,
            message: 'message',
            createdAt: 8,
            channelId: generalChannel.id,
            signature: 'signature',
            pubKey: 'publicKey',
            media,
          },
        ],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: media,
        },
      ])
      .run()
  })

  test('auto download file of type other than image', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const id = Math.random().toString(36).substr(2.9)

    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'file',
      ext: 'ext',
      message: {
        id,
        channelId: generalChannel.id,
      },
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.incomingMessages({
        messages: [
          {
            id,
            type: MessageType.File,
            message: 'message',
            createdAt: 8,
            channelId: generalChannel.id,
            signature: 'signature',
            pubKey: 'publicKey',
            media,
          },
        ],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: media,
        },
      ])
      .run()
  })

  test('do not auto-download already locally stored file', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const id = Math.random().toString(36).substr(2.9)

    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const media: FileMetadata = {
      cid: 'cid',
      path: 'path/to/file.ext',
      name: 'file',
      ext: 'ext',
      message: {
        id,
        channelId: generalChannel.id,
      },
    }

    const message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>('Message', {
        identity: alice,
        message: generateMessageFactoryContentWithId(generalChannel.id),
      })
    ).message

    const reducer = combineReducers(reducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.incomingMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: media,
        },
      ])
      .run()
  })

  test('do not auto-download already locally stored file (from non-active channel)', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const id = Math.random().toString(36).substr(2.9)

    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: sailingChannel.id,
      })
    )

    const media: FileMetadata = {
      cid: 'cid',
      path: 'path/to/file.ext',
      name: 'file',
      ext: 'ext',
      message: {
        id,
        channelId: generalChannel.id,
      },
    }

    const message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>('Message', {
        identity: alice,
        message: generateMessageFactoryContentWithId(generalChannel.id),
      })
    ).message

    const reducer = combineReducers(reducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.incomingMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: media,
        },
      ])
      .run()
  })

  test('do not auto-download file above the size limit', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const id = Math.random().toString(36).substr(2.9)

    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'file',
      ext: 'ext',
      size: AUTODOWNLOAD_SIZE_LIMIT + 1024,
      message: {
        id,
        channelId: generalChannel.id,
      },
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.incomingMessages({
        messages: [
          {
            id,
            type: MessageType.File,
            message: 'message',
            createdAt: 8,
            channelId: generalChannel.id,
            signature: 'signature',
            pubKey: 'publicKey',
            media,
          },
        ],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: media,
        },
      ])
      .run()
  })

  test('do not auto-download image above the size limit', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const id = Math.random().toString(36).substr(2.9)

    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'image',
      ext: 'jpg',
      size: AUTODOWNLOAD_SIZE_LIMIT + 1024,
      message: {
        id,
        channelId: generalChannel.id,
      },
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.incomingMessages({
        messages: [
          {
            id,
            type: MessageType.Image,
            message: 'message',
            createdAt: 8,
            channelId: generalChannel.id,
            signature: 'signature',
            pubKey: 'publicKey',
            media,
          },
        ],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: media,
        },
      ])
      .run()
  })
})
