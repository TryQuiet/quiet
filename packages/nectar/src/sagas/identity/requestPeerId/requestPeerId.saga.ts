import { Socket } from 'socket.io-client';
import { apply } from 'typed-redux-saga';
import { SocketActionTypes } from '../../socket/const/actionTypes';

export function* requestPeerIdSaga(socket: Socket): Generator {
  yield* apply(socket, socket.emit, [SocketActionTypes.REQUEST_PEER_ID]);
}
