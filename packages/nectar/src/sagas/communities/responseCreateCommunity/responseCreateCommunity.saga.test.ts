import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { generateDmKeyPair } from '../../../utils/cryptography/cryptography';
import { call } from 'redux-saga-test-plan/matchers';
import { StoreKeys } from '../../store.keys';
import { communitiesActions } from '../communities.slice';
import { responseCreateCommunitySaga } from './responseCreateCommunity.saga';
import { identityAdapter } from '../../identity/identity.adapter';
import { identityReducer, IdentityState } from '../../identity/identity.slice';
import { Identity } from '../../identity/identity.slice';

describe('responseCreateCommunity', () => {
  test('response create community', async () => {
    const responseCreateCommunityPayload = {
      id: 'id',
      payload: {
        hiddenService: {
          onionAddress: 'onionAddress',
          privateKey: 'privateKey',
        },
        peerId: { id: 'id', pubKey: 'pubKey', privKey: 'privKey' },
      },
    };
    await expectSaga(
      responseCreateCommunitySaga,
      communitiesActions.responseCreateCommunity(responseCreateCommunityPayload)
    )
      .withReducer(combineReducers({ [StoreKeys.Identity]: identityReducer }), {
        [StoreKeys.Identity]: {...new IdentityState()},
      })
      .provide([
        [call.fn(generateDmKeyPair), { publicKey: 'pub', privateKey: 'priv' }],
        [call.fn(generateDmKeyPair), { publicKey: 'pub', privateKey: 'priv' }],
      ])
      .hasFinalState({
        [StoreKeys.Identity]: {
          identities: {
            ids: ['id'],
            entities: {
            id: new Identity({
              id: 'id',
              hiddenService: {
                onionAddress: 'onionAddress',
                privateKey: 'privateKey',
              },
              peerId: { id: 'id', pubKey: 'pubKey', privKey: 'privKey' },
              dmKeys: { publicKey: 'pub', privateKey: 'priv' },
            }),
          },
        },
      }
      })
      .run();
  });
});
