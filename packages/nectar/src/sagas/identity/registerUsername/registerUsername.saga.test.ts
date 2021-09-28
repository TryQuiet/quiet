import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import { identityActions, identityReducer, Identity } from '../identity.slice';
import { identityAdapter } from '../identity.adapter';
import { registerUsernameSaga } from './registerUsername.saga';
import { config } from '../../users/const/certFieldTypes';
import {
  errorsActions,
  errorsReducer,
  ErrorsState,
} from '../../errors/errors.slice';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../../communities/communities.slice';
import { communitiesAdapter } from '../../communities/communities.adapter';

describe('registerUsernameSaga', () => {
  const identity = new Identity({
    id: 'id',
    hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
  });
  const identityWithoutPeerId = new Identity({
    id: 'id',
    hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: '', pubKey: 'pubKey', privKey: 'privKey' },
  });
  const community = new Community({
    name: '',
    id: 'id',
    registrarUrl: 'registrarUrl',
    CA: {},
  });
  const username = 'username';

  test('create user csr', () => {
    expectSaga(registerUsernameSaga, identityActions.registerUsername(username))
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Communities]: communitiesReducer,
        }),
        {
          [StoreKeys.Identity]: {
            ...identityAdapter.setAll(identityAdapter.getInitialState(), [
              identity,
            ]),
          },
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
        }
      )
      .put(
        identityActions.updateUsername({
          communityId: identity.id,
          nickname: username,
        })
      )
      .put(
        identityActions.createUserCsr({
          zbayNickname: username,
          commonName: 'onionAddress.onion',
          peerId: 'peerId',
          dmPublicKey: 'publicKey',
          signAlg: config.signAlg,
          hashAlg: config.hashAlg,
        })
      )
      .run();
  });
  test('throw error if missing data', () => {
    expectSaga(
      registerUsernameSaga,
      identityActions.registerUsername('username')
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Errors]: errorsReducer,
        }),
        {
          [StoreKeys.Identity]: {
            ...identityAdapter.setAll(identityAdapter.getInitialState(), [
              identityWithoutPeerId,
            ]),
          },
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
          [StoreKeys.Errors]: {
            ...new ErrorsState(),
          },
        }
      )
      .put(
        errorsActions.certificateRegistration(
          "You're not connected with other peers."
        )
      )
      .hasFinalState({
        [StoreKeys.Identity]: {
          ...identityAdapter.setAll(identityAdapter.getInitialState(), [
            identityWithoutPeerId,
          ]),
        },
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'id',
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [community]
          ),
        },
        [StoreKeys.Errors]: {
          ...new ErrorsState(),
          certificateRegistration: "You're not connected with other peers.",
        },
      })
      .run();
  });
});
