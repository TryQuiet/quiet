import { combineReducers, PayloadAction } from '@reduxjs/toolkit'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory, getSocketFactory } from '../../../utils/tests/factories'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { identityAdapter } from '../../identity/identity.adapter'
import { identityActions, identityReducer, IdentityState } from '../../identity/identity.slice'
import { StoreKeys } from '../../store.keys'
import { communitiesAdapter } from '../communities.adapter'
import { communitiesActions, communitiesReducer, CommunitiesState } from '../communities.slice'
import { type Store } from '../../store.types'

import { launchCommunitySaga } from './launchCommunity.saga'
import { setupCrypto } from '@quiet/identity'
import { type FactoryGirl } from 'factory-girl'
import { connectionReducer, ConnectionState } from '../../appConnection/connection.slice'
import { type InitCommunityPayload, JoinCommunityPayload, LaunchCommunityPayload, SocketActions } from '@quiet/types'
import { filesActions } from '../../files/files.slice'
import { networkActions } from '../../network/network.slice'
describe('launchCommunity', () => {
  let store: Store
  let factory: FactoryGirl
  let socket: MockedSocket

  beforeEach(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
    socket = new MockedSocket()
  })

  test('launch certain community instead of current community', async () => {
    const socketPayloadFactory = await getSocketFactory()
    const socket = new MockedSocket()

    const identities = await factory.createMany('Identity', 2)
    const targetCommmunityId = identities[1].communityId

    // the factory should have set the current community to the first community generated
    expect(store.getState().Communities.currentCommunity).not.toEqual(targetCommmunityId)

    const launchCommunityPayload: LaunchCommunityPayload = {
      id: targetCommmunityId,
    }

    await expectSaga(
      launchCommunitySaga,
      socket as unknown as Socket,
      communitiesActions.launchCommunity(launchCommunityPayload)
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState()) // Inject the current state of the store
      // .apply(socket, socket.emitWithAck, [SocketActions.LAUNCH_COMMUNITY, launchCommunityPayload])
      .put(filesActions.checkForMissingFiles(targetCommmunityId)) // Assert this action is dispatched
      .put(networkActions.addInitializedCommunity(targetCommmunityId)) // Assert this action is dispatched
      .put(communitiesActions.setCurrentCommunity(targetCommmunityId)) // Assert this action is dispatched
      .run()
  })

  test('launch current community', async () => {
    const socketPayloadFactory = await getSocketFactory()
    const socket = new MockedSocket()

    const identities = await factory.createMany('Identity', 2)
    const targetCommmunityId = store.getState().Communities.currentCommunity

    const launchCommunityPayload: LaunchCommunityPayload = {
      id: targetCommmunityId,
    }

    await expectSaga(
      launchCommunitySaga,
      socket as unknown as Socket,
      communitiesActions.launchCommunity(launchCommunityPayload)
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState()) // Inject the current state of the store
      // .apply(socket, socket.emitWithAck, [SocketActions.LAUNCH_COMMUNITY, launchCommunityPayload])
      .put(communitiesActions.setCurrentCommunity(targetCommmunityId)) // Assert this action is dispatched
      .put(filesActions.checkForMissingFiles(targetCommmunityId)) // Assert this action is dispatched
      .put(networkActions.addInitializedCommunity(targetCommmunityId)) // Assert this action is dispatched
      .run()
  })
})
