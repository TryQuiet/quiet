import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { communitiesActions } from '../communities.slice'
import { reducers } from '../../reducers'
import { generateDmKeyPair } from '../../../utils/cryptography/cryptography'
import { responseCreateNetworkSaga } from './responseCreateNetwork.saga'
import { identityActions } from '../../identity/identity.slice'
import { type Community, type DmKeys, type Identity, type NetworkData } from '@quiet/types'

describe('responseCreateNetwork', () => {
  it('create network for joining user', async () => {
    setupCrypto()
    const store = prepareStore().store

    const community: Community = {
      id: '1',
      name: undefined,
      CA: null,
      rootCa: undefined,
    }

    const dmKeys: DmKeys = {
      publicKey: 'publicKey',
      privateKey: 'privateKey',
    }

    const network: NetworkData = {
      hiddenService: {
        onionAddress: 'onionAddress',
        privateKey: 'privateKey',
      },
      peerId: {
        id: 'peerId',
      },
    }

    const identity: Identity = {
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
    await expectSaga(
      responseCreateNetworkSaga,
      communitiesActions.responseCreateNetwork({
        community,
        network,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(generateDmKeyPair), dmKeys]])
      .call(generateDmKeyPair)
      .put(communitiesActions.updateCommunityData(community))
      .put(identityActions.addNewIdentity(identity))
      .run()
  })
})
