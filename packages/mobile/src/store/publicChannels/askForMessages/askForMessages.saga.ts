import { PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';
import { apply } from 'typed-redux-saga';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { publicChannelsActions } from '../publicChannels.slice';

export function* askForMessagesSaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof publicChannelsActions.askForMessages>['payload']
  >,
): Generator {
  yield* apply(socket, socket.emit, [
    SocketActionTypes.ASK_FOR_MESSAGES,
    action.payload,
  ]);
}
