import Config from 'react-native-config';
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
        combineReducers({ [StoreKeys.PublicChannels]: publicChannelsReducer }),
        {
          [StoreKeys.PublicChannels]: {
            ...new PublicChannelsState(),
            channelMessages: {
              [Config.PUBLIC_CHANNEL_ADDRESS]: {
                ids: ['1', '2', '3'],
                messages: {
                  id: {
                    id: '1',
                    type: 0,
                    typeIndicator: 0,
                    message: 'message',
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
      )
      .put(
        publicChannelsActions.askForMessages({
          channelAddress: Config.PUBLIC_CHANNEL_ADDRESS,
          ids: ['2', '3'],
        }),
      )
      .run();
  });
});
