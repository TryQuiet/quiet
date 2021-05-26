import {PayloadAction} from '@reduxjs/toolkit';
import {Socket} from 'socket.io-client';
import {apply} from 'typed-redux-saga';
import {SocketActionTypes} from '../../socket/const/actionTypes';
import {publicChannelsActions} from '../publicChannels.slice';

export function* fetchAllMessagesSaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof publicChannelsActions.fetchAllMessages>['payload']
  >,
): Generator {
  yield* apply(socket, socket.emit, [
    SocketActionTypes.FETCH_ALL_MESSAGES,
    action.payload,
  ]);
}
