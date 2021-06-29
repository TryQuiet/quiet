import { TestApi, testSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import {
  AskForMessagesPayload,
  publicChannelsActions,
} from '../publicChannels.slice';

import { askForMessagesSaga } from './askForMessages.saga';

describe('askForMessagesSaga', () => {
  const socket = { emit: jest.fn() } as unknown as Socket;
  const saga: TestApi = testSaga(
    askForMessagesSaga,
    socket,
    publicChannelsActions.askForMessages(<AskForMessagesPayload>{}),
  );

  beforeEach(() => {
    saga.restart();
  });

  test('should be defined', () => {
    saga
      .next()
      .apply(socket, socket.emit, [SocketActionTypes.ASK_FOR_MESSAGES, {}])
      .next()
      .isDone();
  });
});
