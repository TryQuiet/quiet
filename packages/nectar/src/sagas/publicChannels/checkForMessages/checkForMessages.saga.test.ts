import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import {
  publicChannelsActions,
  publicChannelsReducer,
  PublicChannelsState,
} from '../publicChannels.slice';
import { checkForMessagesSaga } from './checkForMessages.saga';

describe('checkForMessagesSaga', () => {
  test('ask for missing messages', () => {
    expectSaga(checkForMessagesSaga)
      .withReducer(
        combineReducers({
          [StoreKeys.PublicChannels]: publicChannelsReducer,
        }),
        {
          [StoreKeys.PublicChannels]: {
            ...new PublicChannelsState(),
            channelMessages: {
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
            },
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
      .run();
  });
});
