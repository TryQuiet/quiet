import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { identityAdapter } from '../../identity/identity.adapter';
import { initCommunities, launchCommunitySaga } from './launchCommunity.saga';
import { combineReducers } from '@reduxjs/toolkit';
import { StoreKeys } from '../../store.keys';
import {
  communitiesActions,
  communitiesReducer,
  Community,
  CommunitiesState,
} from '../communities.slice';
import { communitiesAdapter } from '../communities.adapter';
import { Identity, identityReducer, IdentityState } from '../../identity/identity.slice';

describe('launchCommunity', () => {
  test('launch all remembered communities', async () => {
    const community1 = new Community({
      name: '',
      id: 'id-1',
      registrarUrl: 'registrarUrl',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    });

    const community2 = new Community({
      name: '',
      id: 'id-2',
      registrarUrl: 'registrarUrl',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    });

    const community3 = new Community({
      name: '',
      id: 'id-3',
      registrarUrl: 'registrarUrl',
      CA: undefined,
    });

    await expectSaga(initCommunities)
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community1, community2, community3]
            ),
          },
        }
      )
      .put(communitiesActions.launchCommunity(community1.id))
      .put(communitiesActions.launchCommunity(community2.id))
      .put(communitiesActions.launchCommunity(community3.id))
      .run();
  });
  test('launch certain community instead of current community', async () => {
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
      communitiesActions.launchCommunity(community.id)
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
  test('launch current community', async () => {
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
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identity]
            ),
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
