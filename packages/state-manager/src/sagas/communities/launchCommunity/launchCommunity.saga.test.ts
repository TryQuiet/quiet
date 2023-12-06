import { combineReducers } from '@reduxjs/toolkit'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from 'socket.io-client'
import { identityActions, identityReducer, IdentityState } from '../../identity/identity.slice'
import { StoreKeys } from '../../store.keys'
import { communitiesActions, communitiesReducer, CommunitiesState } from '../communities.slice'
import { type Store } from '../../store.types'

import { initCommunities, launchCommunitySaga } from './launchCommunity.saga'
import { setupCrypto } from '@quiet/identity'
import { type FactoryGirl } from 'factory-girl'
import { connectionReducer, ConnectionState } from '../../appConnection/connection.slice'
import { type InitCommunityPayload, SocketActionTypes } from '@quiet/types'

describe('launchCommunity', () => {
  let store: Store
  let factory: FactoryGirl

  beforeAll(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getFactory(store)
  })

  test('launch current community', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const community =
      await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')
    const communityWithRootCa = {
      ...community,
      rootCa: 'rootCA',
    }
    const identity = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    const launchCommunityPayload: InitCommunityPayload = {
      id: community.id,
      peerId: identity.peerId,
      hiddenService: identity.hiddenService,
      certs: {
        // @ts-expect-error
        certificate: identity.userCertificate,
        // @ts-expect-error
        key: identity.userCsr.userKey,
        CA: [communityWithRootCa.rootCa],
      },
      peers: community.peerList,
    }

    await expectSaga(launchCommunitySaga, socket)
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Connection]: connectionReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            community: communityWithRootCa
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identity: identity,
          },
          [StoreKeys.Connection]: {
            ...new ConnectionState(),
          },
        }
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_COMMUNITY,
        {
          id: launchCommunityPayload.id,
          peerId: launchCommunityPayload.peerId,
          hiddenService: launchCommunityPayload.hiddenService,
          peers: launchCommunityPayload.peers,
        },
      ])
      .run()
  })

  test('do not launch current community if it does not have rootCa', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const community =
      await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')
    expect(community.rootCa).toBeUndefined()
    const identity = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    const launchCommunityPayload: InitCommunityPayload = {
      id: community.id,
      peerId: identity.peerId,
      hiddenService: identity.hiddenService,
      certs: {
        // @ts-expect-error
        certificate: identity.userCertificate,
        // @ts-expect-error
        key: identity.userCsr.userKey,
        // @ts-expect-error
        CA: [community.rootCa],
      },
      peers: community.peerList,
    }

    await expectSaga(launchCommunitySaga, socket)
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Connection]: connectionReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            community: community
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identity: identity,
          },
          [StoreKeys.Connection]: {
            ...new ConnectionState(),
          },
        }
      )
      .not.apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_COMMUNITY,
        {
          id: launchCommunityPayload.id,
          peerId: launchCommunityPayload.peerId,
          hiddenService: launchCommunityPayload.hiddenService,
          certs: launchCommunityPayload.certs,
          peers: launchCommunityPayload.peers,
        },
      ])
      .run()
  })
})
