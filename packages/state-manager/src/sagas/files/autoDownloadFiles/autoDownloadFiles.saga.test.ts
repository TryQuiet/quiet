import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { generateMessageFactoryContentWithId, getReduxStoreFactory, type publicChannels } from '../../..'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { type communitiesActions } from '../../communities/communities.slice'
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
  SocketActions,
} from '@quiet/types'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { getBaseTypesFactory, getSocketFactory } from '../../../utils/tests/factories'
import { channel } from 'redux-saga'

describe('autoDownloadFilesSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let socket: MockedSocket

  let community: Community
  let alice: Identity

  let sailingChannel: PublicChannel
  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    alice = await factory.create('Identity', {
      communityId: community.id,
    })

    sailingChannel = (
      await factory.create('PublicChannel', {
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.userId,
          id: generateChannelId('sailing'),
        },
      })
    ).channel
  })

  beforeEach(async () => {
    const socketPayloadFactory = await getSocketFactory()
    socket = new MockedSocket()
  })

  test('auto download file of type image', async () => {
    const id = Math.random().toString(36).substring(2, 9)

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
    const baseTypes = await getBaseTypesFactory()
    const message = await factory.create('TestMessage', {
      message: baseTypes.build('ChannelMessage', {
        userId: alice.userId,
        channelId: generalChannel.id,
        type: MessageType.Image,
      }),
      verifyAutomaically: true,
    })

    const reducer = combineReducers(testReducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket as unknown as Socket,
      messagesActions.addMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActions.DOWNLOAD_FILE,
        {
          peerId: alice.networkInfo.peerId.id,
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

    const baseTypes = await getBaseTypesFactory()
    const message = await factory.create('TestMessage', {
      message: baseTypes.build('ChannelMessage', {
        userId: alice.userId,
        channelId: generalChannel.id,
        type: MessageType.File,
        media,
      }),
      verifyAutomaically: true,
    })

    const reducer = combineReducers(testReducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.addMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActions.DOWNLOAD_FILE,
        {
          peerId: alice.networkInfo.peerId.id,
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

    const baseTypes = await getBaseTypesFactory()
    const message = await factory.create('TestMessage', {
      message: baseTypes.build('ChannelMessage', {
        id,
        userId: alice.userId,
        channelId: generalChannel.id,
        type: MessageType.File,
        media,
      }),
      verifyAutomaically: true,
    })

    const reducer = combineReducers(testReducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.addMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.apply(socket, socket.emit, [
        SocketActions.DOWNLOAD_FILE,
        {
          peerId: alice.networkInfo.peerId.id,
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

    const baseTypes = await getBaseTypesFactory()
    const message = await factory.create('TestMessage', {
      message: baseTypes.build('ChannelMessage', {
        id,
        userId: alice.userId,
        channelId: generalChannel.id,
        type: MessageType.File,
        media,
      }),
      verifyAutomaically: true,
    })

    const reducer = combineReducers(testReducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.addMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.apply(socket, socket.emit, [
        SocketActions.DOWNLOAD_FILE,
        {
          peerId: alice.networkInfo.peerId.id,
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

    const baseTypes = await getBaseTypesFactory()
    const message = await factory.create('TestMessage', {
      message: baseTypes.build('ChannelMessage', {
        id,
        userId: alice.userId,
        channelId: generalChannel.id,
        type: MessageType.File,
        media,
      }),
      verifyAutomaically: true,
    })

    const reducer = combineReducers(testReducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.addMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.apply(socket, socket.emit, [
        SocketActions.DOWNLOAD_FILE,
        {
          peerId: alice.networkInfo.peerId.id,
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

    const message = await factory.create('TestMessage', {
      id,
      type: MessageType.Image,
      channelId: generalChannel.id,
      media,
    })

    const reducer = combineReducers(testReducers)
    await expectSaga(
      autoDownloadFilesSaga,
      socket,
      messagesActions.addMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.apply(socket, socket.emit, [
        SocketActions.DOWNLOAD_FILE,
        {
          peerId: alice.networkInfo.peerId.id,
          metadata: media,
        },
      ])
      .run()
  })
})
