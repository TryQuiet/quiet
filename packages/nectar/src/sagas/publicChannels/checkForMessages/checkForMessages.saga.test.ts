import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { mainChannelName } from '../../config';
import { StoreKeys } from '../../store.keys';
import {
  publicChannelsActions,
  publicChannelsReducer,
  PublicChannelsState,
} from '../publicChannels.slice';
import { checkForMessagesSaga } from './checkForMessages.saga';

describe('checkForMessagesSaga', () => {
  test.skip('ask for missing messages', () => {
    expectSaga(checkForMessagesSaga)
      .withReducer(
        combineReducers({ [StoreKeys.PublicChannels]: publicChannelsReducer }),
        {
          [StoreKeys.PublicChannels]: {
            ...new PublicChannelsState(),
            channelMessages: {
              [mainChannelName]: {
                ids: ['1', '2', '3'],
                messages: {
                  id: {
                    id: '1',
                    type: 0,
                    pubKey: 'asdf',
                    message: 'message',
                    createdAt: 0,
                    channelId: '',
                    signature: '',
                  },
                },
              },
            },
          },
        }
      )
      .put(
        publicChannelsActions.askForMessages({
          channelAddress: mainChannelName,
          ids: ['2', '3'],
        })
      )
      .run();
  });
});
