import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { StoreKeys } from '../../store.keys'
import { Socket } from 'socket.io-client'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { publicChannelsActions } from '../publicChannels.slice'
import {
  identityReducer,
  IdentityState,
  identityActions
} from '../../identity/identity.slice'
import {
  CommunitiesState,
  communitiesReducer,
  communitiesActions
} from '../../communities/communities.slice'
import { communitiesAdapter } from '../../communities/communities.adapter'
import { identityAdapter } from '../../identity/identity.adapter'
import { createChannelSaga } from './createChannel.saga'
import { Store } from '../../store.types'
import { FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { PublicChannel } from '@quiet/types'

describe('createChannelSaga', () => {
  let store: Store
  let factory: FactoryGirl

  beforeAll(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getFactory(store)
  })

  const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

  const channel: PublicChannel = {
    name: 'general',
    description: 'desc',
    owner: 'Howdy',
    timestamp: Date.now(),
    address: 'address'
  }

  test('ask for missing messages', async () => {
    const community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    const identity = await factory.create<
    ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'john' })

    await expectSaga(
      createChannelSaga,
      socket,
      publicChannelsActions.createChannel({
        channel
      })
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Communities]: communitiesReducer
        }),
        {
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identity]
            )
          },
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: community.id,
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            )
          }
        }
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.CREATE_CHANNEL,
        {
          channel: channel
        }
      ])
      .run()
  })
})
