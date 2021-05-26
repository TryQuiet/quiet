import {PayloadAction} from '@reduxjs/toolkit';
import {Socket} from 'socket.io-client';
import {apply} from 'typed-redux-saga';
import {SocketActionTypes} from '../../socket/const/actionTypes';
import {publicChannelsActions} from '../publicChannels.slice';

export function* subscribeForTopicSaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof publicChannelsActions.subscribeForTopic>['payload']
  >,
): Generator {
  yield* apply(socket, socket.emit, [
    SocketActionTypes.SUBSCRIBE_FOR_TOPIC,
    action.payload,
  ]);
}
