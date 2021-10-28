import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { combineReducers } from '@reduxjs/toolkit';
import { StoreKeys } from '../../store.keys';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../../communities/communities.slice';
import { identityAdapter } from '../identity.adapter';
import { identityReducer, Identity, IdentityState } from '../identity.slice';
import { saveOwnerCertToDbSaga } from './saveOwnerCertToDb.saga';

describe('saveOwnerCertificateToDb', () => {
  test('save owner certificate to database', async () => {
    const community = new Community({
      name: 'communityName',
      id: 'id',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      registrarUrl: '',
    });
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const identity = new Identity({
      id: 'id',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
    });
    const communityId = 'id';
    await expectSaga(saveOwnerCertToDbSaga, socket)
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: {
              ids: ['id'],
              entities: {
                id: community,
              },
            },
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
      .apply(socket, socket.emit, [
        SocketActionTypes.SAVE_OWNER_CERTIFICATE,
        communityId,
        identity.peerId.id,
        identity.userCertificate,
        {
          certificate: community.CA.rootCertString,
          privKey: community.CA.rootKeyString,
        },
      ])
      .run();
  });
});
