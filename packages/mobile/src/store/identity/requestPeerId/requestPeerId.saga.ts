import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { apply } from 'typed-redux-saga';

export function* requestPeerIdSaga(socket: Socket): Generator {
  yield* apply(socket, socket.emit, [SocketActionTypes.REQUEST_PEER_ID]);
}
