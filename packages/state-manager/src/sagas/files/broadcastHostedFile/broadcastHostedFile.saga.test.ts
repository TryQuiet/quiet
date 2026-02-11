import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getReduxStoreFactory, type publicChannels } from '../../..'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { applyEmitParams, type Socket } from '../../../types'
import { type communitiesActions } from '../../communities/communities.slice'
import { filesActions } from '../files.slice'
import { type FactoryGirl } from 'factory-girl'
import { broadcastHostedFileSaga } from './broadcastHostedFile.saga'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import {
  type Community,
  type FileMetadata,
  type Identity,
  type Channel,
  SocketActions,
  MessageType,
} from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { generateChannelId } from '@quiet/common'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { getSocketFactory } from '../../../utils/tests/factories'

describe('broadcastHostedFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: Channel
  let generalChannel: Channel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })
    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()
    sailingChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('Channel', {
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

  test('broadcast message for hosted file', async () => {
    const socket = new MockedSocket()

    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const id = Math.random().toString(36).substring(2, 9)

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

    const message = (
      await factory.create('TestMessage', {
        message: {
          id,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelId: generalChannel.id,
          userId: alice.userId,
          media,
        },
      })
    ).message

    const reducer = combineReducers(testReducers)
    await expectSaga(broadcastHostedFileSaga, socket as unknown as Socket, filesActions.broadcastHostedFile(media))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, applyEmitParams(SocketActions.SEND_MESSAGE, message))
      .run()
  })

  test('broadcast message for hosted file (while on non-active channel)', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: sailingChannel.id,
      })
    )

    const id = Math.random().toString(36).substr(2.9)

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

    const message = (
      await factory.create('TestMessage', {
        message: {
          id,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelId: generalChannel.id,
          userId: alice.userId,
          media,
        },
      })
    ).message

    const reducer = combineReducers(testReducers)
    await expectSaga(broadcastHostedFileSaga, socket as unknown as Socket, filesActions.broadcastHostedFile(media))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, applyEmitParams(SocketActions.SEND_MESSAGE, message))
      .run()
  })
})
