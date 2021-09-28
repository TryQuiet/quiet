import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { identityAdapter } from '../../identity/identity.adapter';
import { launchCommunitySaga } from './launchCommunity.saga';
import { combineReducers } from '@reduxjs/toolkit';
import { StoreKeys } from '../../store.keys';
import {
  communitiesActions,
  communitiesReducer,
  Community,
  CommunitiesState,
} from '../communities.slice';
import { communitiesAdapter } from '../communities.adapter';
import { Identity, identityReducer } from '../../identity/identity.slice';

describe('launchCommunity', () => {
  test('launch community', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const launchCommunityPayload = {
      id: 'id',
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      peerList: [],
      certs: { cert: 'userCert', key: 'userKey', ca: 'rootCert' },
    };
    const community = new Community({
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: {},
    });
    community.rootCa = 'rootCert';
    const identity = new Identity({
      id: 'id',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
    });
    const userCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: {
        publicKey: jest.fn() as unknown,
        privateKey: jest.fn() as unknown,
        pkcs10: 'pkcs10',
      },
    };

    identity.userCsr = userCsr;
    identity.userCertificate = 'userCert';

    await expectSaga(
      launchCommunitySaga,
      socket,
      communitiesActions.launchCommunity()
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
          [StoreKeys.Identity]: {
            ...identityAdapter.setAll(identityAdapter.getInitialState(), [
              identity,
            ]),
          },
        }
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_COMMUNITY,
        launchCommunityPayload.id,
        launchCommunityPayload.peerId,
        launchCommunityPayload.hiddenService,
        launchCommunityPayload.peerList,
        launchCommunityPayload.certs,
      ])
      .run();
  });
});
