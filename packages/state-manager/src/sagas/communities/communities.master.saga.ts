import { type Socket } from '../../types'
import { all, takeEvery } from 'typed-redux-saga'
import { communitiesActions } from './communities.slice'
import { connectionActions } from '../appConnection/connection.slice'
import { updateCommunitySaga } from './updateCommunity/updateCommunity.saga'
import { initCommunities, launchCommunitySaga } from './launchCommunity/launchCommunity.saga'
import { createNetworkSaga } from './createNetwork/createNetwork.saga'
import { responseCreateNetworkSaga } from './responseCreateNetwork/responseCreateNetwork.saga'
import { saveCommunityMetadataSaga } from './saveCommunityMetadata/saveCommunityMetadata.saga'
import { sendCommunityMetadataSaga } from './updateCommunityMetadata/updateCommunityMetadata.saga'

export function* communitiesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(communitiesActions.createNetwork.type, createNetworkSaga),
    takeEvery(communitiesActions.responseCreateNetwork.type, responseCreateNetworkSaga),
    takeEvery(communitiesActions.updateCommunity.type, updateCommunitySaga),
    takeEvery(connectionActions.torBootstrapped.type, initCommunities),
    takeEvery(communitiesActions.launchCommunity.type, launchCommunitySaga, socket),
    takeEvery(communitiesActions.saveCommunityMetadata.type, saveCommunityMetadataSaga, socket),
    takeEvery(communitiesActions.sendCommunityMetadata.type, sendCommunityMetadataSaga, socket),
  ])
}
