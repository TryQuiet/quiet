import { combineReducers } from 'redux';
import { expectSaga } from 'redux-saga-test-plan';
import { errorsActions } from '../errors.slice';
import { handleErrorsSaga } from './handleErrors.saga';
import { StoreKeys } from '../../store.keys';
import {
  communitiesReducer,
  Community,
  CommunitiesState,
} from '../../communities/communities.slice';
import { communitiesAdapter } from '../../communities/communities.adapter';
import {
  Identity,
  identityActions,
  identityReducer,
  IdentityState,
} from '../../identity/identity.slice';
import { identityAdapter } from '../../identity/identity.adapter';

describe('handle errors', () => {
  test('registrar error', async () => {
    const community: Community = {
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0,
    };
    const identity: Identity = {
      id: 'id',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      zbayNickname: '',
      userCsr: undefined,
      userCertificate: '',
    };
    await expectSaga(
      handleErrorsSaga,
      errorsActions.addError({
        type: 'registrar',
        message: 'Registering username failed.',
        communityId: 'id',
        code: 500,
      })
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id-0',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identity]
            ),
          },
        }
      )
      .put(
        identityActions.storeUserCsr({
          communityId: community.id,
          userCsr: identity.userCsr,
          registrarAddress: community.registrarUrl,
        })
      )
      .put({ type: 'id.registrar.error' })
      .run();
  });
  test('general error', async () => {
    const community: Community = {
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0,
    };
    const identity: Identity = {
      id: 'id',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      zbayNickname: '',
      userCsr: undefined,
      userCertificate: '',
    };
    await expectSaga(
      handleErrorsSaga,
      errorsActions.addError({
        type: 'sockets',
        message: 'Registering username failed.',
        communityId: 'general',
        code: 500,
      })
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
        })
      )
      .put({ type: 'general.sockets.error' })
      .run();
  });
});
