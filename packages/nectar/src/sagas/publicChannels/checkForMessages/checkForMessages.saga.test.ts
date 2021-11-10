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
import { channelsByCommunityAdapter } from '../publicChannels.adapter';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../../communities/communities.slice';
import { communitiesAdapter } from '../../communities/communities.adapter';

describe('checkForMessagesSaga', () => {
  let communityChannels = new CommunityChannels('id');
  const community = new Community({
    name: '',
    id: 'id',
    registrarUrl: 'registrarUrl',
    CA: {},
  });

  communityChannels.currentChannel =
    'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00';
  (communityChannels.channelMessages = {
    zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00:
      {
        ids: ['1', '2', '3'],
        messages: {
          id: {
            id: '1',
            type: 0,
            message: 'message',
            createdAt: 0,
            channelId: '',
            signature: '',
            pubKey: '',
          },
        },
      },
  }),
    (communityChannels.id = 'id');

  test('ask for missing messages', () => {
    expectSaga(checkForMessagesSaga)
      .withReducer(
        combineReducers({
          [StoreKeys.PublicChannels]: publicChannelsReducer,
          [StoreKeys.Communities]: communitiesReducer,
        }),
        {
          [StoreKeys.PublicChannels]: {
            ...new PublicChannelsState(),
            channels: channelsByCommunityAdapter.setAll(
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
        }
      )
      .put(
        publicChannelsActions.askForMessages({
          channelAddress:
            'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00',
          ids: ['2', '3'],
        })
      )
      .silentRun();
  });
});
