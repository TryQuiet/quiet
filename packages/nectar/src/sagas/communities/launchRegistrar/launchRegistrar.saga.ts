import { apply, select } from 'typed-redux-saga';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { identitySelectors } from '../../identity/identity.selectors';
import { communitiesSelectors } from '../communities.selectors';
import { Socket } from 'socket.io-client';

export function* launchRegistrarSaga(socket: Socket, _action): Generator {
  const community = yield* select(communitiesSelectors.currentCommunity);
  if (community.CA.rootCertString) {
    const identity = yield* select(identitySelectors.currentIdentity);
    yield* apply(socket, socket.emit, [
      SocketActionTypes.LAUNCH_REGISTRAR,
      identity.id,
      identity.peerId.id,
      community.CA.rootCertString,
      community.CA.rootKeyString,
      community.privateKey,
    ]);
  }
}
