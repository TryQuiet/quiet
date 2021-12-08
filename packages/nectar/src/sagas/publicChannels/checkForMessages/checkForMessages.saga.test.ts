import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import {
  publicChannelsActions,
  publicChannelsReducer,
  CommunityChannels,
  PublicChannelsState,
} from '../publicChannels.slice';
import { checkForMessagesSaga } from './checkForMessages.saga';
import {
  channelMessagesAdapter,
  communityChannelsAdapter,
  publicChannelsAdapter,
} from '../publicChannels.adapter';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../../communities/communities.slice';
import {
  identityReducer,
  IdentityState,
  Identity,
} from '../../identity/identity.slice';
import { identityAdapter } from '../../identity/identity.adapter';
import { communitiesAdapter } from '../../communities/communities.adapter';

describe('checkForMessagesSaga', () => {
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

  const messages = [
    {
      id: '1',
      type: 0,
      message: 'message',
      createdAt: 0,
      channelId: '',
      signature: '',
      pubKey: '',
    },
  ];

  const communityChannels: CommunityChannels = {
    id: 'id',
    currentChannel:
      'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00',
    channels: publicChannelsAdapter.getInitialState(),
    channelMessages: channelMessagesAdapter.setAll(
      channelMessagesAdapter.getInitialState(),
      messages
    ),
    channelLoadingSlice: 0,
  };

  const identity: Identity = {
    id: 'id',
    hiddenService: {
      onionAddress: 'onionAddress.onion',
      privateKey: 'privateKey',
    },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
    zbayNickname: '',
    userCsr: undefined,
    userCertificate: '',
  };

  test('ask for missing messages', () => {
    expectSaga(checkForMessagesSaga)
      .withReducer(
        combineReducers({
          [StoreKeys.PublicChannels]: publicChannelsReducer,
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.PublicChannels]: {
            ...new PublicChannelsState(),
            channels: communityChannelsAdapter.setAll(
              communityChannelsAdapter.getInitialState(),
              [communityChannels]
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
        publicChannelsActions.askForMessages({
          peerId: 'peerId',
          channelAddress:
            'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00',
          ids: ['2', '3'],
          communityId: 'id',
        })
      )
      .run();
  });
});
