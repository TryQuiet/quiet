import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { Time } from 'pkijs'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { communitiesActions } from '../communities.slice'
import { createRootCA, setupCrypto } from '@quiet/identity'
import { reducers } from '../../reducers'
import { createNetworkSaga } from './createNetwork.saga'
import { generateID } from '../../../utils/cryptography/cryptography'
import { type Community, CommunityOwnership } from '@quiet/types'

describe('createNetwork', () => {
  const socket = {
    on: jest.fn(),
    emit: jest.fn(),
  }

  it('create network for joining user', async () => {
    setupCrypto()
    const store = prepareStore().store

    const community: Community = {
      id: '1',
      name: undefined,
      registrarUrl: 'http://registrarUrl.onion',
      CA: null,
      rootCa: undefined,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      createNetworkSaga,
      // @ts-expect-error
      socket,
      communitiesActions.createNetwork({
        ownership: CommunityOwnership.User,
        peers: [{ peerId: 'peerId', onionAddress: 'address' }],
        psk: '12345',
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(generateID), community.id]])
      .not.call(createRootCA)
      .call(generateID)
      .run()
  })

  it('create network for owner', async () => {
    setupCrypto()

    const store = prepareStore().store

    const CA = {
      rootCertString: 'rootCertString',
      rootKeyString: 'rootKeyString',
    }

    const community: Community = {
      id: '1',
      name: 'rockets',
      registrarUrl: undefined,
      CA,
      rootCa: CA.rootCertString,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      createNetworkSaga,
      // @ts-expect-error
      socket,
      communitiesActions.createNetwork({
        ownership: CommunityOwnership.Owner,
        name: 'rockets',
        psk: '12345',
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(createRootCA), CA],
        [call.fn(generateID), community.id],
      ])
      .call(
        createRootCA,
        new Time({ type: 0, value: new Date(Date.UTC(2010, 11, 28, 10, 10, 10)) }),
        new Time({ type: 0, value: new Date(Date.UTC(2030, 11, 28, 10, 10, 10)) }),
        'rockets'
      )
      .call(generateID)
      .run()
  })
})
