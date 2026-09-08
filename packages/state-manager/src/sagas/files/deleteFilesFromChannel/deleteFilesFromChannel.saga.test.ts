import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { DateTime } from 'luxon'
import { type Socket } from '../../../types'
import { filesActions } from '../../files/files.slice'
import { deleteFilesFromChannelSaga } from './deleteFilesFromChannel.saga'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { generateTestChannelId } from '@quiet/common'
import { type Community, Identity, MessageType, PublicChannel, SocketActions } from '@quiet/types'
import { getReduxStoreFactory } from '../../../utils/tests/factories'

describe('deleteFilesFromChannelSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity

  let generalChannel: PublicChannel
  let photoChannel: PublicChannel

  let message: any

  const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getReduxStoreFactory(store)

    community = await factory.create('Community')

    owner = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    photoChannel = (
      await factory.create('PublicChannel', {
        channel: {
          name: 'photo',
          description: 'Welcome to #photo',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.userId,
          id: generateTestChannelId('id'),
        },
      })
    ).channel
    const id = Math.random().toString(36).substr(2.9)
    message = (
      await factory.create('TestMessage', {
        identity: owner,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelId: photoChannel.id,
          media: {
            cid: 'cid',
            path: null,
            name: 'image',
            ext: 'png',
            message: {
              id,
              channelId: photoChannel.id,
            },
          },
        },
        verifyAutomatically: true,
      })
    ).message
  })

  test('delete files from channel', async () => {
    const channelId = photoChannel.id

    await expectSaga(
      deleteFilesFromChannelSaga,
      socket as unknown as Socket,
      filesActions.deleteFilesFromChannel({ channelId })
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActions.DELETE_FILES_FROM_CHANNEL,
        {
          messages: {
            [message.id]: message,
          },
        },
      ])

      .run()
  })
})
