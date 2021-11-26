import { Socket } from 'socket.io-client';
import { expectSaga } from 'redux-saga-test-plan';
import { combineReducers } from '@reduxjs/toolkit';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { StoreKeys } from '../../store.keys';
import { publicChannelsActions } from '../publicChannels.slice';
import { subscribeForTopicSaga } from './subscribeForTopic.saga';
import { Identity } from '../../identity/identity.slice';
import { identityAdapter } from '../../identity/identity.adapter';
import { identityReducer, IdentityState } from '../../identity/identity.slice';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../../communities/communities.slice';
import { communitiesAdapter } from '../../communities/communities.adapter';

describe('subscribeForTopicSaga', () => {
  const socket = { emit: jest.fn() } as unknown as Socket;

  const channel = {
    name: 'general',
    description: 'stuff',
    owner: 'nobody',
    timestamp: 666999666,
    address: 'hell on the shore of the baltic sea',
  };
  const community: Community = {
    name: '',
    id: 'id',
    CA: null,
    rootCa: '',
    peerList: [],
    registrarUrl: 'registrarUrl',
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

  test('subscribe for topic', () => {
    expectSaga(
      subscribeForTopicSaga,
      socket,
      publicChannelsActions.subscribeForTopic({
        peerId: 'peerId',
        channelData: channel,
      })
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Communities]: communitiesReducer,
        }),
        {
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identity]
            ),
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
        publicChannelsActions.addChannel({
          communityId: 'id',
          channel: channel,
        })
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.SUBSCRIBE_FOR_TOPIC,
        'peerId',
        channel,
      ])
      .run();
  });
});
