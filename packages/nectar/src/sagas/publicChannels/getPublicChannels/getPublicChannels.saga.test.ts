import {TestApi, testSaga} from 'redux-saga-test-plan';
import {Socket} from 'socket.io-client';
import {SocketActionTypes} from '../../socket/const/actionTypes';

import {getPublicChannelsSaga} from './getPublicChannels.saga';

describe('getPublicChannelsSaga', () => {
  const socket = {emit: jest.fn()} as unknown as Socket;
  const saga: TestApi = testSaga(getPublicChannelsSaga, socket);

  beforeEach(() => {
    saga.restart();
  });

  test('should be defined', () => {
    saga
      .next()
      .apply(socket, socket.emit, [SocketActionTypes.GET_PUBLIC_CHANNELS])
      .next()
      .isDone();
  });
});
