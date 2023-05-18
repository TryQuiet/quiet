import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { Time } from 'pkijs'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { Socket } from 'socket.io-client'
import { communitiesActions } from '../communities.slice'
import { createRootCA, setupCrypto } from '@quiet/identity'
import { reducers } from '../../reducers'
import { createNetworkSaga } from './createNetwork.saga'
import { generateId } from '../../../utils/cryptography/cryptography'
import { Community, CommunityOwnership, SocketActionTypes } from '@quiet/types'

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
      rootCa: undefined
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
      name: 'rockets',
      registrarUrl: undefined,
      CA: CA,
      rootCa: CA.rootCertString
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
      .call(
        createRootCA,
        new Time({ type: 0, value: new Date(Date.UTC(2010, 11, 28, 10, 10, 10)) }),
        new Time({ type: 0, value: new Date(Date.UTC(2030, 11, 28, 10, 10, 10)) }),
        'rockets'
      )
      .call(generateId)
      .apply(socket, socket.emit, [SocketActionTypes.CREATE_NETWORK, community])
      .run()
  })
})
