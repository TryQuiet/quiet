import { Socket } from 'socket.io-client';
import { all, fork, takeEvery } from 'typed-redux-saga';
import { communitiesActions } from './communities.slice';
import { createCommunitySaga } from './createCommunity/createCommunity.saga';
import { joinCommunitySaga } from './joinCommunity/joinCommunity.saga';
import {
  initCommunities,
  launchCommunitySaga,
} from './launchCommunity/launchCommunity.saga';
import { launchRegistrarSaga } from './launchRegistrar/launchRegistrar.saga';
import { responseCreateCommunitySaga } from './responseCreateCommunity/responseCreateCommunity.saga';

export function* communitiesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(
      communitiesActions.responseCreateCommunity.type,
      responseCreateCommunitySaga
    ),
    takeEvery(
      communitiesActions.createNewCommunity.type,
      createCommunitySaga,
      socket
    ),
    takeEvery(communitiesActions.joinCommunity.type, joinCommunitySaga, socket),
    fork(initCommunities),
    takeEvery(
      communitiesActions.launchCommunity.type,
      launchCommunitySaga,
      socket
    ),
    takeEvery(
      communitiesActions.launchRegistrar.type,
      launchRegistrarSaga,
      socket
    ),
    // takeEvery(communitiesActions.community.type, launchRegistrarSaga, socket),
  ]);
}
