import { combineReducers, createStore, Store } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { publicChannelsSelectors } from './publicChannels.selectors';
import {
  channelsByCommunityAdapter,
} from './publicChannels.adapter'
import {
  publicChannelsReducer,
  CommunityChannels
} from './publicChannels.slice';

import { communitiesReducer,CommunitiesState, Community } from '../communities/communities.slice';

import { communitiesAdapter } from '../communities/communities.adapter';

describe('publicChannelsSelectors', () => {
  let store: Store;

  const communityId = new Community({
    name: 'communityId',
    id: 'communityId',
    CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    registrarUrl: '',
  });

  let communityChannels =  new CommunityChannels('communityId')

  communityChannels.currentChannel = 'currentChannel'
  communityChannels.channelMessages = {
    currentChannel: {
      ids: ['1', '0', '2', '4'],
      messages: {
        '0': {
          id: '0',
          message: 'message0',
          createdAt: 0,
          channelId: '',
          pubKey: '12',
          signature: '',
          type: 1
        },
        '2': {
          id: '2',
          message: 'message2',
          createdAt: 0,
          channelId: '',
          pubKey: '12',
          signature: '',
          type: 1
        },
        '4': {
          id: '4',
          message: 'message4',
          createdAt: 0,
          channelId: '',
          pubKey: '12',
          signature: '',
          type: 1
        },
        '1': {
          id: '1',
          message: 'message1',
          createdAt: 0,
          channelId: '',
          pubKey: '12',
          signature: '',
          type: 1
        },
      },
    },
  },

  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.PublicChannels]: publicChannelsReducer,  [StoreKeys.Communities]: communitiesReducer
      }),
      {
        [StoreKeys.PublicChannels]: {
          ...channelsByCommunityAdapter.setAll(channelsByCommunityAdapter.getInitialState(), [communityChannels]),
        },
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'communityId',
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [communityId]
          ),
        },
      }
    );
  });

  it('get messages in proper order', () => {
    const messages = publicChannelsSelectors.orderedChannelMessages(
      store.getState()
    );
    expect(messages).toMatchInlineSnapshot(`
      Array [
        Object {
          "channelId": "",
          "createdAt": 0,
          "id": "1",
          "message": "message1",
          "pubKey": "12",
          "signature": "",
          "type": 1,
        },
        Object {
          "channelId": "",
          "createdAt": 0,
          "id": "0",
          "message": "message0",
          "pubKey": "12",
          "signature": "",
          "type": 1,
        },
        Object {
          "channelId": "",
          "createdAt": 0,
          "id": "2",
          "message": "message2",
          "pubKey": "12",
          "signature": "",
          "type": 1,
        },
        Object {
          "channelId": "",
          "createdAt": 0,
          "id": "4",
          "message": "message4",
          "pubKey": "12",
          "signature": "",
          "type": 1,
        },
      ]
    `);
  });
});

export {};
