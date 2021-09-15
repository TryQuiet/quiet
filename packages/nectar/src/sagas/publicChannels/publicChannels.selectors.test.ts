import { combineReducers, createStore, Store } from '@reduxjs/toolkit';
import { mainChannelName } from '../config';
import { StoreKeys } from '../store.keys';
import { publicChannelsAdapter } from './publicChannels.adapter';
import { publicChannelsSelectors } from './publicChannels.selectors';
import {
  publicChannelsReducer,
  PublicChannelsState,
} from './publicChannels.slice';

describe('publicChannelsSelectors', () => {
  let store: Store;
  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.PublicChannels]: publicChannelsReducer,
      }),
      {
        [StoreKeys.PublicChannels]: {
          ...new PublicChannelsState(),
          channels: publicChannelsAdapter.setAll(
            publicChannelsAdapter.getInitialState(),
            [
              {
                name: 'Zbay',
                description: '',
                owner: '',
                timestamp: 123,
                address: mainChannelName,
              },
            ]
          ),
          currentChannel: 'currentChannel',
          channelMessages: {
            currentChannel: {
              ids: ['1', '0', '2', '4'],
              messages: {
                '0': {
                  id: '0',
                  type: 1,
                  message: 'message0',
                  createdAt: 0,
                  channelId: '',
                  signature: '',
                  pubKey: 'sdf',
                },
              },
            },
          },
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
          "id": "0",
          "message": "message0",
          "pubKey": "sdf",
          "signature": "",
          "type": 1,
        },
      ]
    `);
  });

  it('get zbay channel', () => {
    const ZbayChannel = publicChannelsSelectors.ZbayChannel(store.getState());
    expect(ZbayChannel).toMatchInlineSnapshot(`
      Object {
        "address": "general",
        "description": "",
        "name": "Zbay",
        "owner": "",
        "timestamp": 123,
      }
    `);
  });
});
