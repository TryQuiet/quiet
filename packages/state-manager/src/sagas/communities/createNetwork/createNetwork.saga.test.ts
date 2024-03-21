import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { Time } from 'pkijs'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { communitiesActions } from '../communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { createRootCA, setupCrypto } from '@quiet/identity'
import { reducers } from '../../reducers'
import { createNetworkSaga } from './createNetwork.saga'
import { generateDmKeyPair } from '../../../utils/cryptography/cryptography'
import { type Community, CommunityOwnership, SocketActionTypes } from '@quiet/types'
import { Socket, applyEmitParams } from '../../../types'

describe('createNetwork', () => {
  it('creates network', async () => {
    setupCrypto()

    const hiddenService = {
      onionAddress: 'testOnionAddress',
      privateKey: 'testPrivateKey',
    }

    const peerId = {
      id: 'testPeerId',
    }

    const network = {
      hiddenService,
      peerId,
    }

    const socket = {
      emit: jest.fn(),
      emitWithAck: jest.fn(() => {
        return network
      }),
      on: jest.fn(),
    } as unknown as Socket

    const store = prepareStore().store

    const community: Community = {
      id: '1',
      name: 'test',
      CA: null,
      rootCa: undefined,
    }

    store.dispatch(communitiesActions.addNewCommunity(community))
    store.dispatch(communitiesActions.setCurrentCommunity(community.id))

    const dmKeys = {
      publicKey: 'testPublicKey',
      privateKey: 'testPrivateKey',
    }

    const identity = {
      id: community.id,
      nickname: '',
      hiddenService: network.hiddenService,
      peerId: network.peerId,
      dmKeys,
      userCsr: null,
      userCertificate: null,
      joinTimestamp: null,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(createNetworkSaga, socket, communitiesActions.createNetwork())
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, applyEmitParams(SocketActionTypes.CREATE_NETWORK, community.id))
      .provide([[call.fn(generateDmKeyPair), dmKeys]])
      .put(identityActions.addNewIdentity(identity))
      .run()
  })
})
