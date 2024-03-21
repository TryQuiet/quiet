import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { Time } from 'pkijs'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { communitiesActions } from '../communities.slice'
import { createRootCA, setupCrypto } from '@quiet/identity'
import { reducers } from '../../reducers'
import { addCommunitySaga } from './addCommunity.saga'
import { generateId } from '../../../utils/cryptography/cryptography'
import { type Community, CommunityOwnership } from '@quiet/types'
import { Socket } from '../../../types'

describe('addCommunity', () => {
  it('add community for joining user', async () => {
    setupCrypto()

    const socket = {
      emit: jest.fn(),
      emitWithAck: jest.fn(() => {
        return {}
      }),
      on: jest.fn(),
    } as unknown as Socket

    const store = prepareStore().store

    const peers = [{ peerId: 'peerId', onionAddress: 'address' }]
    const psk = '12345'

    const community: Community = {
      id: '1',
      name: undefined,
      CA: null,
      rootCa: undefined,
      psk,
      ownerOrbitDbIdentity: undefined,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      addCommunitySaga,
      socket,
      communitiesActions.addCommunity({
        ownership: CommunityOwnership.User,
        peers,
        psk,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(generateId), community.id]])
      .not.call(createRootCA)
      .call(generateId)
      .put(communitiesActions.addNewCommunity(community))
      .put(communitiesActions.setCurrentCommunity(community.id))
      .put(communitiesActions.setInvitationCodes(peers))
      .run()
  })

  it('add community for owner', async () => {
    setupCrypto()

    const socket = {
      emit: jest.fn(),
      emitWithAck: jest.fn(() => {
        return {}
      }),
      on: jest.fn(),
    } as unknown as Socket

    const store = prepareStore().store

    const CA = {
      rootCertString: 'rootCertString',
      rootKeyString: 'rootKeyString',
    }

    const community: Community = {
      id: '1',
      name: 'rockets',
      CA,
      rootCa: CA.rootCertString,
      psk: undefined,
      ownerOrbitDbIdentity: undefined,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      addCommunitySaga,
      socket,
      communitiesActions.addCommunity({
        ownership: CommunityOwnership.Owner,
        name: community.name,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(createRootCA), CA],
        [call.fn(generateId), community.id],
      ])
      .call(
        createRootCA,
        new Time({ type: 0, value: new Date(Date.UTC(2010, 11, 28, 10, 10, 10)) }),
        new Time({ type: 0, value: new Date(Date.UTC(2030, 11, 28, 10, 10, 10)) }),
        community.name
      )
      .call(generateId)
      .put(communitiesActions.addNewCommunity(community))
      .put(communitiesActions.setCurrentCommunity(community.id))
      .run()
  })
})
