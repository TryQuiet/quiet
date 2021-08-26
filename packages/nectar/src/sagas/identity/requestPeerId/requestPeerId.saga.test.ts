import { TestApi, testSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';

import { requestPeerIdSaga } from './requestPeerId.saga';

describe('requestPeerIdSaga', () => {
  const socket = { emit: jest.fn() } as unknown as Socket;
  const saga: TestApi = testSaga(requestPeerIdSaga, socket);

  beforeEach(() => {
    saga.restart();
  });

  test('should be defined', () => {
    saga
      .next()
      .apply(socket, socket.emit, [SocketActionTypes.REQUEST_PEER_ID])
      .next()
      .isDone();
  });
});
