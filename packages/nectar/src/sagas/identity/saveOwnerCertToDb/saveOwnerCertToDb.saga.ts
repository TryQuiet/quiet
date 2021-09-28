import { Socket } from 'socket.io-client';
import { apply, select } from 'typed-redux-saga';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { communitiesSelectors } from '../../communities/communities.selectors';
import { identitySelectors } from '../identity.selectors';

export function* saveOwnerCertToDbSaga(socket: Socket): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity);
  const identity = yield* select(identitySelectors.currentIdentity);

  yield* apply(socket, socket.emit, [
    SocketActionTypes.SAVE_OWNER_CERTIFICATE,
    currentCommunity.id,
    identity.peerId.id,
    identity.userCertificate,
    {
      certificate: currentCommunity.CA.rootCertString,
      privKey: currentCommunity.CA.rootKeyString,
    },
  ]);
}
