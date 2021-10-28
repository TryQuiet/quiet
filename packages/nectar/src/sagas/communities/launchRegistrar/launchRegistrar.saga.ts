import { apply, select} from 'typed-redux-saga';
import { PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { identitySelectors } from '../../identity/identity.selectors';

import { communitiesSelectors } from '../communities.selectors';
import { communitiesActions } from '../communities.slice';

export function* launchRegistrarSaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof communitiesActions.launchRegistrar>['payload']
  >
): Generator {
  let communityId: string = action.payload;

  if (!communityId) {
    communityId = yield* select(communitiesSelectors.currentCommunityId);
  }

  const community = yield* select(communitiesSelectors.selectById(communityId));

  if (community.CA.rootCertString) {
    const identity = yield* select(identitySelectors.selectById(communityId));
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
