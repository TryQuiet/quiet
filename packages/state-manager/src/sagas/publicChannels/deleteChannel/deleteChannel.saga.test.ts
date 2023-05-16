import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import {
  getFactory,
  PublicChannel,
  SocketActionTypes,
} from '../../..'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from '../publicChannels.slice'
import { Identity } from '../../identity/identity.types'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { deleteChannelSaga } from './deleteChannel.saga'
import { Socket } from 'socket.io-client'
import { Community } from '@quiet/types'

describe('deleteChannelSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity

  let photoChannel: PublicChannel

  const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getFactory(store)

    community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    owner = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    photoChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: 'photo',
            description: 'Welcome to #photo',
            timestamp: DateTime.utc().valueOf(),
            owner: owner.nickname,
            address: 'photo'
          }
        }
      )
    ).channel
  })

  test('delete standard channel', async () => {
    const channelAddress = photoChannel.address

    const reducer = combineReducers(reducers)
    await expectSaga(
      deleteChannelSaga,
      socket,
      publicChannelsActions.deleteChannel({ channel: channelAddress })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.DELETE_CHANNEL,
        {
          channel: channelAddress
        }
      ])
      .put(publicChannelsActions.setCurrentChannel({ channelAddress: 'general' }))
      .put(publicChannelsActions.disableChannel({ channelAddress }))
      .run()
  })

  test('delete general channel', async () => {
    const channelAddress = 'general'

    const reducer = combineReducers(reducers)
    await expectSaga(
      deleteChannelSaga,
      socket,
      publicChannelsActions.deleteChannel({ channel: channelAddress })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.DELETE_CHANNEL,
        {
          channel: channelAddress
        }
      ])
      .run()
  })
})
