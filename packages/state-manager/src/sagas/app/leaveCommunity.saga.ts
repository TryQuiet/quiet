import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { apply, call, put, select } from 'typed-redux-saga'
import { appActions } from './app.slice'
import { SocketActionTypes } from '../socket/const/actionTypes'
import { identityActions } from '../identity/identity.slice'
import { communitiesActions } from '../communities/communities.slice'
import { communitiesSelectors } from '../communities/communities.selectors'
import { networkActions } from '../network/network.slice'
import { messagesActions } from '../messages/messages.slice'
import { filesActions } from '../files/files.slice'
import { publicChannelsActions } from '../publicChannels/publicChannels.slice'
import { usersActions } from '../users/users.slice'

export function* leaveCommunitySaga(
    socket: Socket,
    _action: PayloadAction<ReturnType<typeof appActions.leaveCommunity>['payload']>
): Generator {
    const communityId = yield* select(communitiesSelectors.currentCommunityId)

    yield* put(identityActions.removeIdentity(communityId))
    yield* put(communitiesActions.removeCommunity(communityId))
    yield* put(networkActions.removeInitializedCommunities(communityId))

    yield* put(messagesActions.removePublicChannelMessages())
    yield* put(messagesActions.removeVerificationStatuses())
    yield* put(filesActions.removeDownloadStatuses())
    yield* put(publicChannelsActions.removePublicChannelsData())
    yield* put(usersActions.removeUserCetrificates())

    yield* apply(socket, socket.emit, [SocketActionTypes.LEAVE_COMMUNITY])
}
