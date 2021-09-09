import { put, apply, call } from 'typed-redux-saga';
import { communitiesActions } from '../communities.slice';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { generateId } from '../../../utils/cryptography/cryptography';

export function* joinCommunitySaga(socket: Socket, action: any): Generator {
  const id = yield call(generateId);
  const payload = { id: id, registrarUrl: action.payload };
  yield* put(communitiesActions.addNewCommunity(payload));
  yield* put(communitiesActions.setCurrentCommunity(id));
  yield* apply(socket, socket.emit, [
    SocketActionTypes.CREATE_COMMUNITY,
    { id },
  ]);
}
