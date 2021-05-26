import {TestApi, testSaga} from 'redux-saga-test-plan';
import {socketActions} from '../socket.slice';

import {connect, startConnectionSaga, useIO} from './startConnection.saga';

describe('startConnectionSaga', () => {
  const saga: TestApi = testSaga(startConnectionSaga);

  beforeEach(() => {
    saga.restart();
  });

  test('should connect with websocket', () => {
    const socket = jest.fn();
    saga
      .next()
      .call(connect)
      .next(socket)
      .put(socketActions.setConnected(true))
      .next()
      .fork(useIO, socket)
      .next()
      .isDone();
  });
});
