import { type Socket } from '../../types'
import { all, takeEvery } from 'typed-redux-saga'
import { communitiesActions } from './communities.slice'
import { connectionActions } from '../appConnection/connection.slice'
import { updateCommunitySaga } from './updateCommunity/updateCommunity.saga'
import { createCommunitySaga } from './createCommunity/createCommunity.saga'
import { initCommunities, launchCommunitySaga } from './launchCommunity/launchCommunity.saga'
import { createNetworkSaga } from './createNetwork/createNetwork.saga'
import { saveCommunityMetadataSaga } from './saveCommunityMetadata/saveCommunityMetadata.saga'
import { sendCommunityMetadataSaga } from './updateCommunityMetadata/updateCommunityMetadata.saga'
import { sendCommunityCaDataSaga } from './sendCommunityCaData/sendCommunityCaData.saga'

export function* communitiesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(communitiesActions.createNetwork.type, createNetworkSaga, socket),
    takeEvery(communitiesActions.updateCommunity.type, updateCommunitySaga),
    takeEvery(connectionActions.torBootstrapped.type, initCommunities),
    takeEvery(communitiesActions.createCommunity.type, createCommunitySaga, socket),
    takeEvery(communitiesActions.launchCommunity.type, launchCommunitySaga, socket),
    takeEvery(communitiesActions.saveCommunityMetadata.type, saveCommunityMetadataSaga, socket),
    takeEvery(communitiesActions.sendCommunityMetadata.type, sendCommunityMetadataSaga, socket),
    takeEvery(communitiesActions.sendCommunityCaData.type, sendCommunityCaDataSaga, socket),
  ])
}
