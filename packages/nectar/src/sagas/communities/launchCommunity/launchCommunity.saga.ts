import { apply, select, all, put } from 'typed-redux-saga';
import { PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { identitySelectors } from '../../identity/identity.selectors';

import { communitiesSelectors } from '../communities.selectors';
import { communitiesActions } from '../communities.slice';

export function* initCommunities(): Generator {
  const communities = yield* select(communitiesSelectors.allCommunities);
  for (const community of communities) {
    yield* put(communitiesActions.launchCommunity(community.id));
  }
}

export function* launchCommunitySaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof communitiesActions.launchCommunity>['payload']
  >
): Generator {
  let communityId: string = action.payload;

  if (!communityId) {
    communityId = yield* select(communitiesSelectors.currentCommunityId);
  }

  const community = yield* select(communitiesSelectors.selectById(communityId));
  const identity = yield* select(identitySelectors.selectById(communityId));

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
