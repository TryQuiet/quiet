import { Socket } from 'socket.io-client';
import { all, takeEvery } from 'typed-redux-saga';
import { communitiesActions } from './communities.slice';
import { createCommunitySaga } from './createCommunity/createCommunity.saga';
import { joinCommunitySaga } from './joinCommunity/joinCommunity.saga';
import { responseCreateCommunitySaga } from './responseCreateCommunity/responseCreateCommunity.saga';

export function* communitiesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(communitiesActions.responseCreateCommunity.type, responseCreateCommunitySaga),
    takeEvery(communitiesActions.createNewCommunity.type, createCommunitySaga, socket),
    takeEvery(communitiesActions.joinCommunity.type, joinCommunitySaga, socket),
  ]);
}
