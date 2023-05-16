import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import { identityAdapter } from '../../identity/identity.adapter'
import { identityReducer, IdentityState, identityActions } from '../../identity/identity.slice'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { StoreKeys } from '../../store.keys'
import { communitiesAdapter } from '../communities.adapter'
import {
  communitiesActions,
  communitiesReducer, CommunitiesState
} from '../communities.slice'
import { launchRegistrarSaga } from './launchRegistrar.saga'
import { Store } from '../../store.types'
import { FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { LaunchRegistrarPayload } from '@quiet/types'

describe('launchRegistrar', () => {
  let store: Store
  let factory: FactoryGirl

  beforeAll(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getFactory(store)
  })

  test("launch certain registrar instead of current community's registrar", async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    const identity = await factory.create<
    ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'john' })
    expect(community.CA).not.toBeNull()
    expect(community.CA).toBeDefined()
    const launchRegistrarPayload: LaunchRegistrarPayload = {
        id: community.id,
        peerId: identity.peerId.id,
        rootCertString: community.CA?.rootCertString || '',
        rootKeyString: community.CA?.rootKeyString || '',
        privateKey: ''
    }

    await expectSaga(launchRegistrarSaga, socket, communitiesActions.launchCommunity(community.id))
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id-0',
            communities: communitiesAdapter.setAll(communitiesAdapter.getInitialState(), [
              community
            ])
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(identityAdapter.getInitialState(), [identity])
          }
        }
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        launchRegistrarPayload
      ])
      .run()
  })

  test("launch registrar if user is current community's owner", async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    const identity = await factory.create<
    ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'john' })
    expect(community.CA).not.toBeNull()
    expect(community.CA).toBeDefined()
    const launchRegistrarPayload: LaunchRegistrarPayload = {
      id: community.id,
      peerId: identity.peerId.id,
      rootCertString: community.CA?.rootCertString || '',
      rootKeyString: community.CA?.rootKeyString || '',
      privateKey: ''
  }

    await expectSaga(launchRegistrarSaga, socket, communitiesActions.launchCommunity())
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: community.id,
            communities: communitiesAdapter.setAll(communitiesAdapter.getInitialState(), [
              community
            ])
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(identityAdapter.getInitialState(), [identity])
          }
        }
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        launchRegistrarPayload
      ])
      .run()
  })

  test("do not attempt to launch registrar if user is not current community's owner", async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    let community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    const identity = await factory.create<
    ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'john' })
    expect(community.CA).not.toBeNull()
    expect(community.CA).toBeDefined()
    const launchRegistrarPayload: LaunchRegistrarPayload = {
      id: community.id,
      peerId: identity.peerId.id,
      rootCertString: community.CA?.rootCertString || '',
      rootKeyString: community.CA?.rootKeyString || '',
      privateKey: ''
  }

    community = {
      ...community, CA: null
    }

    await expectSaga(launchRegistrarSaga, socket, communitiesActions.launchCommunity())
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: community.id,
            communities: communitiesAdapter.setAll(communitiesAdapter.getInitialState(), [
              community
            ])
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(identityAdapter.getInitialState(), [identity])
          }
        }
      )
      .not.apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        launchRegistrarPayload
      ])
      .run()
  })
})
