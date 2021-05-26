import {TestApi, testSaga} from 'redux-saga-test-plan';
import {Socket} from 'socket.io-client';
import {SocketActionTypes} from '../../socket/const/actionTypes';
import {publicChannelsActions} from '../publicChannels.slice';

import {fetchAllMessagesSaga} from './fetchAllMessages.saga';

describe('fetchAllMessagesSaga', () => {
  const socket = {emit: jest.fn()} as unknown as Socket;
  const saga: TestApi = testSaga(
    fetchAllMessagesSaga,
    socket,
    publicChannelsActions.fetchAllMessages('someAddress'),
  );

  beforeEach(() => {
    saga.restart();
  });

  test('should be defined', () => {
    saga
      .next()
      .apply(socket, socket.emit, [
        SocketActionTypes.FETCH_ALL_MESSAGES,
        'someAddress',
      ])
      .next()
      .isDone();
  });
});
