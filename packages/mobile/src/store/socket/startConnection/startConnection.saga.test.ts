import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { waitForConnectionSaga } from '../../init/waitForConnection/waitForConnection.saga';
import { StoreKeys } from '../../store.keys';
import { socketReducer, SocketState } from '../socket.slice';
import { startConnectionSaga } from './startConnection.saga';

describe('startConnectionSaga', () => {
  test.skip('should be defined', async () => {
    await expectSaga(startConnectionSaga)
      .withReducer(combineReducers({ [StoreKeys.Socket]: socketReducer }), {
        [StoreKeys.Socket]: {
          ...new SocketState(),
        },
      })
      .provide([[waitForConnectionSaga, null]])
      .run();
  });
});
