import { apply, select } from 'typed-redux-saga';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { identitySelectors } from '../../identity/identity.selectors';

import { communitiesSelectors } from '../communities.selectors';

export function* launchCommunitySaga(socket, _action): Generator {
  const identity = yield* select(identitySelectors.currentIdentity);
  const community = yield* select(communitiesSelectors.currentCommunity);

  const cert = identity.userCertificate;
  const key = identity.userCsr.userKey;
  const ca = community.rootCa;

  const certs = {
    cert,
    key,
    ca,
  };
  yield* apply(socket, socket.emit, [
    SocketActionTypes.LAUNCH_COMMUNITY,
    identity.id,
    identity.peerId,
    identity.hiddenService,
    community.peerList,
    certs,
  ]);
}
