import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { generateDmKeyPair } from '../../../utils/cryptography/cryptography';
import { call } from 'redux-saga-test-plan/matchers';
import { StoreKeys } from '../../store.keys';
import { communitiesActions } from '../communities.slice';
import { responseCreateCommunitySaga } from './responseCreateCommunity.saga';
import { identityAdapter } from '../../identity/identity.adapter';
import { identityReducer } from '../../identity/identity.slice';
import { Identity } from '../../identity/identity.slice';

describe('joinCommunity', () => {
  test.skip('join the existing community', async () => {
    // const identity = new Identity({id: 'id', hiddenService:'HS', hiddenServicePrivateKey:'HSP', peerId:{id:'id'}, peerIdPrivateKey:'peerIdPK'})

    const responseCreateCommunityPayload = {
      id: 'id',
      payload: { hiddenService: 'HS', peerId: 'HSP' },
    };
    await expectSaga(
      responseCreateCommunitySaga,
      communitiesActions.responseCreateCommunity(responseCreateCommunityPayload)
    )
      .withReducer(combineReducers({ [StoreKeys.Identity]: identityReducer }), {
        [StoreKeys.Identity]: identityAdapter.getInitialState(),
      })
      .provide([
        [call.fn(generateDmKeyPair), 'id'],
        [call.fn(generateDmKeyPair), 'id'],
      ])
      .hasFinalState({
        [StoreKeys.Identity]: {
          ids: ['id'],
          entities: {
            id: new Identity({
              id: 'id',
              hiddenService: {
                onionAddress: 'onionAddress',
                privateKey: 'privateKey',
              },
              peerId: { id: 'id', pubKey: 'pubKey', privKey: 'privKey' },
            }),
          },
        },
      })
      .silentRun();
  });
});
