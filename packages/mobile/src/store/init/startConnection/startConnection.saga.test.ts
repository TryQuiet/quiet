
import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga-test-plan/matchers';
import { Socket } from 'socket.io-client';
import { StoreKeys } from '../../store.keys';
import { initReducer, InitState } from '../init.slice';
import { connect, startConnectionSaga } from './startConnection.saga';

import { socket } from '@zbayapp/nectar';

describe('startConnectionSaga', () => {
  test('should be defined', async () => {
    const _socket = { on: jest.fn() } as unknown as Socket
    await expectSaga(startConnectionSaga)
      .withReducer(combineReducers({ [StoreKeys.Init]: initReducer }), {
        [StoreKeys.Init]: {
          ...new InitState(),
        },
      })
      .provide([
        [call.fn(connect), _socket]
      ])
      .fork(socket.useIO, _socket)
      .run();
  });
});
