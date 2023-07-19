import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getFactory, MessageType, type publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from 'socket.io-client'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { filesActions } from '../files.slice'
import { type FactoryGirl } from 'factory-girl'
import { broadcastHostedFileSaga } from './broadcastHostedFile.saga'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { type Community, type FileMetadata, type Identity, type PublicChannel, SocketActionTypes } from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { generateChannelId } from '@quiet/common'

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

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })
    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()
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

  test('broadcast message for hosted file', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const id = Math.random().toString(36).substr(2.9)

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
        message: {
          id,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelId: generalChannel.id,
          signature: '',
          pubKey: '',
          media,
        },
      })
    ).message

    const reducer = combineReducers(reducers)
    await expectSaga(broadcastHostedFileSaga, socket, filesActions.broadcastHostedFile(media))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.SEND_MESSAGE,
        {
          peerId: alice.peerId.id,
          message: {
            ...message,
            media: {
              ...media,
              path: null,
            },
          },
        },
      ])
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
        message: {
          id,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelId: generalChannel.id,
          signature: '',
          pubKey: '',
          media,
        },
      })
    ).message

    const reducer = combineReducers(reducers)
    await expectSaga(broadcastHostedFileSaga, socket, filesActions.broadcastHostedFile(media))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.SEND_MESSAGE,
        {
          peerId: alice.peerId.id,
          message: {
            ...message,
            media: {
              ...media,
              path: null,
            },
          },
        },
      ])
      .run()
  })
})
