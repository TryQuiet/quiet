import { Socket } from 'socket.io-client'
import { all, fork, takeEvery } from 'typed-redux-saga'
import { communitiesActions } from './communities.slice'
import { createCommunitySaga } from './createCommunity/createCommunity.saga'
import { joinCommunitySaga } from './joinCommunity/joinCommunity.saga'
import { updateCommunitySaga } from './updateCommunity/updateCommunity.saga'
import {
  initCommunities,
  launchCommunitySaga
} from './launchCommunity/launchCommunity.saga'
import { launchRegistrarSaga } from './launchRegistrar/launchRegistrar.saga'
import { responseCreateCommunitySaga } from './responseCreateCommunity/responseCreateCommunity.saga'
import { checkInterruptedRegistrationsSaga } from './checkInterruptedRegistrations/checkInterruptedRegistrations.saga'

export function* communitiesMasterSaga(socket: Socket): Generator {
  yield all([
    fork(checkInterruptedRegistrationsSaga),
    takeEvery(
      communitiesActions.responseCreateCommunity.type,
      responseCreateCommunitySaga
    ),
    takeEvery(
      communitiesActions.createNewCommunity.type,
      createCommunitySaga,
      socket
    ),
    takeEvery(
      communitiesActions.updateCommunity.type,
      updateCommunitySaga
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
    )
  ])
}
