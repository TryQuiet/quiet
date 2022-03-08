import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { Socket } from 'socket.io-client'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { communitiesActions, Community } from '../communities.slice'
import { CommunityOwnership } from '../communities.types'
import { createRootCA, setupCrypto } from '@quiet/identity'
import { reducers } from '../../reducers'
import { createNetworkSaga } from './createNetwork.saga'
import { generateId } from '../../../utils/cryptography/cryptography'

describe('createNetwork', () => {
  it('create network for joining user', async () => {
    setupCrypto()
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
    const store = prepareStore().store

    const community: Community = {
      id: '1',
      name: undefined,
      registrarUrl: 'http://registrarUrl.onion',
      CA: null,
      rootCa: undefined,
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      createNetworkSaga,
      socket,
      communitiesActions.createNetwork({
        ownership: CommunityOwnership.User,
        registrar: 'registrarUrl'
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(generateId), community.id]])
      .not.call(createRootCA)
      .call(generateId)
      .apply(socket, socket.emit, [SocketActionTypes.CREATE_NETWORK, community])
      .run()
  })

  it('create network for owner', async () => {
    setupCrypto()
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
    const store = prepareStore().store

    const CA = {
      rootCertString: 'rootCertString',
      rootKeyString: 'rootKeyString'
    }

    const community: Community = {
      id: '1',
      name: undefined,
      registrarUrl: undefined,
      CA: CA,
      rootCa: CA.rootCertString,
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      createNetworkSaga,
      socket,
      communitiesActions.createNetwork({
        ownership: CommunityOwnership.Owner,
        name: 'rockets'
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(createRootCA), CA], 
        [call.fn(generateId), community.id]
      ])
      .call(createRootCA)
      .call(generateId)
      .apply(socket, socket.emit, [SocketActionTypes.CREATE_NETWORK, community])
      .run()
  })
})
