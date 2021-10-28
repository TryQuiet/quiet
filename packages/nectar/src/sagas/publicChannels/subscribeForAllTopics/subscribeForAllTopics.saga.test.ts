import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import {
  publicChannelsActions,
  publicChannelsReducer,
  CommunityChannels,
} from '../publicChannels.slice';
import { subscribeForAllTopicsSaga } from './subscribeForAllTopics.saga';
import { channelsByCommunityAdapter } from '../publicChannels.adapter';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../../communities/communities.slice';
import { Identity } from '../../identity/identity.slice';
import { communitiesAdapter } from '../../communities/communities.adapter';
import { identityAdapter } from '../../identity/identity.adapter';
import { identityReducer, IdentityState } from '../../identity/identity.slice';
import { IChannelInfo } from '../publicChannels.types';

describe('subscribeForAllTopicsSaga', () => {
  let communityChannels = new CommunityChannels('id');
  const community = new Community({
    name: '',
    id: 'id',
    registrarUrl: 'registrarUrl',
    CA: {},
  });
  const identity = new Identity({
    id: 'id',
    hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
  });

  const channelOne: IChannelInfo = {
    name: 'channelOne',
    description: 'channelOne description',
    owner: 'master',
    timestamp: 12341234,
    address: 'channelOneAddress',
  };
  const channelTwo: IChannelInfo = {
    name: 'channelTwo',
    description: 'channelTwo description',
    owner: 'master',
    timestamp: 12341234,
    address: 'channelTwoAddress',
  };

  communityChannels.currentChannel = 'channelOne';
  communityChannels.channels = {
    ids: [channelOne.name, channelTwo.name],
    entities: {
      channelOne,
      channelTwo,
    },
  };
  communityChannels.id = 'id';

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
            ...channelsByCommunityAdapter.setAll(
              channelsByCommunityAdapter.getInitialState(),
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
