import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import {
  publicChannelsActions,
  publicChannelsReducer,
  CommunityChannels,
  PublicChannelsState,
} from '../publicChannels.slice';
import { subscribeForAllTopicsSaga } from './subscribeForAllTopics.saga';
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
import { Identity } from '../../identity/identity.slice';
import { communitiesAdapter } from '../../communities/communities.adapter';
import { identityAdapter } from '../../identity/identity.adapter';
import { identityReducer, IdentityState } from '../../identity/identity.slice';
import { PublicChannel } from '../publicChannels.types';

describe('subscribeForAllTopicsSaga', () => {
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

  const channelOne: PublicChannel = {
    name: 'channelOne',
    description: 'channelOne description',
    owner: 'master',
    timestamp: 12341234,
    address: 'channelOneAddress',
  };

  const channelTwo: PublicChannel = {
    name: 'channelTwo',
    description: 'channelTwo description',
    owner: 'master',
    timestamp: 12341234,
    address: 'channelTwoAddress',
  };

  let communityChannels: CommunityChannels = {
    id: 'id',
    currentChannel: 'channelOne',
    channels: publicChannelsAdapter.setAll(
      publicChannelsAdapter.getInitialState(),
      [channelOne, channelTwo]
    ),
    channelMessages: channelMessagesAdapter.getInitialState(),
  };

  test('ask for missing messages', () => {
    expectSaga(
      subscribeForAllTopicsSaga,
      publicChannelsActions.subscribeForAllTopics('id')
    )
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
        publicChannelsActions.subscribeForTopic({
          channelData: channelOne,
          peerId: 'peerId',
        })
      )
      .put(
        publicChannelsActions.subscribeForTopic({
          channelData: channelTwo,
          peerId: 'peerId',
        })
      )
      .run();
  });
});
