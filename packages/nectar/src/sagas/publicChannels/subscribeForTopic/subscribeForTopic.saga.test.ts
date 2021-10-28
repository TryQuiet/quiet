import { TestApi, testSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { publicChannelsActions } from '../publicChannels.slice';
import { IChannelInfo } from '../publicChannels.types';

import { subscribeForTopicSaga } from './subscribeForTopic.saga';

describe('subscribeForTopicSaga', () => {
  const socket = { emit: jest.fn() } as unknown as Socket;

  const channel = {
    name: 'general',
    description: 'stuff',
    owner: 'nobody',
    timestamp: 666999666,
    address: 'hell on the shore of the baltic sea',
  };

  const saga: TestApi = testSaga(
    subscribeForTopicSaga,
    socket,
    publicChannelsActions.subscribeForTopic({
      peerId: 'peerId',
      channelData: channel,
    })
  );

  beforeEach(() => {
    saga.restart();
  });

  test('should be defined', () => {
    saga
      .next()
      .apply(socket, socket.emit, [
        SocketActionTypes.SUBSCRIBE_FOR_TOPIC,
        'peerId',
        channel,
      ])
      .next()
      .isDone();
  });
});
