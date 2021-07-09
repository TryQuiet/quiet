import { combineReducers, createStore, Store } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
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
          currentChannel: 'currentChannel',
          channelMessages: {
            currentChannel: {
              ids: ['1', '0', '2', '4'],
              messages: {
                '0': {
                  id: '0',
                  message: 'message0',
                  createdAt: 0,
                  r: 0,
                  channelId: '',
                  signature: '',
                },
                '2': {
                  id: '2',
                  message: 'message2',
                  createdAt: 0,
                  r: 0,
                  channelId: '',
                  signature: '',
                },
                '4': {
                  id: '4',
                  message: 'message4',
                  createdAt: 0,
                  r: 0,
                  channelId: '',
                  signature: '',
                },
                '1': {
                  id: '1',
                  message: 'message1',
                  createdAt: 0,
                  r: 0,
                  channelId: '',
                  signature: '',
                },
              },
            },
          },
        },
      },
    );
  });

  it('get messages in proper order', () => {
    const messages = publicChannelsSelectors.orderedChannelMessages(
      store.getState(),
    );
    expect(messages).toMatchInlineSnapshot(`
      Array [
        Object {
          "channelId": "",
          "createdAt": 0,
          "id": "1",
          "message": "message1",
          "r": 0,
          "signature": "",
        },
        Object {
          "channelId": "",
          "createdAt": 0,
          "id": "0",
          "message": "message0",
          "r": 0,
          "signature": "",
        },
        Object {
          "channelId": "",
          "createdAt": 0,
          "id": "2",
          "message": "message2",
          "r": 0,
          "signature": "",
        },
        Object {
          "channelId": "",
          "createdAt": 0,
          "id": "4",
          "message": "message4",
          "r": 0,
          "signature": "",
        },
      ]
    `);
  });
});
