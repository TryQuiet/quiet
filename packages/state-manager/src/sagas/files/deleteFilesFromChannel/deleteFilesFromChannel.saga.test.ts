import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory, MessageType, type PublicChannel, type publicChannels, SocketActionTypes } from '../../..'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { type Identity } from '../../identity/identity.types'
import { type identityActions } from '../../identity/identity.slice'
import { type communitiesActions } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { type Socket } from 'socket.io-client'
import { filesActions } from '../../files/files.slice'
import { deleteFilesFromChannelSaga } from './deleteFilesFromChannel.saga'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { type publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { generateChannelId } from '@quiet/common'
import { type Community } from '@quiet/types'

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
    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    owner = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    photoChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'photo',
          description: 'Welcome to #photo',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.nickname,
          id: generateChannelId('id'),
        },
      })
    ).channel
    const id = Math.random().toString(36).substr(2.9)
    message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>('Message', {
        identity: owner,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelId: photoChannel.id,
          signature: '',
          pubKey: '',
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

    const reducer = combineReducers(reducers)
    await expectSaga(deleteFilesFromChannelSaga, socket, filesActions.deleteFilesFromChannel({ channelId }))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.DELETE_FILES_FROM_CHANNEL,
        {
          messages: {
            [message.id]: message,
          },
        },
      ])

      .run()
  })
})
