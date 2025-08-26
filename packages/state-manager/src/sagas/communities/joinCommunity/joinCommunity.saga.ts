import { apply, select, put, call, take } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, type Socket } from '../../../types'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions } from '../communities.slice'
import {
  type Community,
  CommunityOwnership,
  type InitCommunityPayload,
  InvitationDataVersion,
  JoinCommunityPayload,
  ResponseJoinCommunityPayload,
  SocketActions,
} from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { generateId } from '../../../utils/cryptography/cryptography'
import { usersActions } from '../../users/users.slice'

const logger = createLogger('joinCommunitySaga')

export function* joinCommunitySaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.joinCommunity>['payload']>
): Generator {
  logger.info('Starting joinCommunitySaga')

  const { inviteData } = action.payload as JoinCommunityPayload

  const communityId = yield* call(generateId)
  // Setting invitationCodes to mark that we are in the process of joining a community
  yield* put(communitiesActions.setInvitationCodes(inviteData))

  const communityCandidate: Community = {
    id: communityId,
    ownership: CommunityOwnership.User,
    inviteData: inviteData,
  }

  if (inviteData?.version === InvitationDataVersion.v3 && (inviteData?.qssEnabled || inviteData?.qssEndpoint)) {
    yield* put(communitiesActions.requestQssOptIn())
    const qssOptInResponseAction: ReturnType<typeof communitiesActions.setQssOptInResponse> = yield* take(
      communitiesActions.setQssOptInResponse
    )
    if (qssOptInResponseAction.payload) {
      logger.info('User opted in to QSS')
      communityCandidate.qssEnabled = true
      communityCandidate.qssEndpoint = inviteData.qssEndpoint
    } else {
      logger.info('User opted out of QSS')
      yield* put(communitiesActions.clearInvitationCodes())
      return
    }
  }

  yield* put(communitiesActions.addNewCommunity(communityCandidate))
  yield* put(communitiesActions.setCurrentCommunity(communityId))

  logger.info('Waiting for user to register username')
  const registerAction: ReturnType<typeof identityActions.registerUsername> = yield* take(
    identityActions.registerUsername
  )
  const username = registerAction.payload.nickname

  const payload: InitCommunityPayload = {
    id: communityId,
    name: '',
    inviteData,
    username: username,
  }

  const response: ResponseJoinCommunityPayload | undefined = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.JOIN_COMMUNITY, payload)
  )
  logger.info('Response from backend', response)
  if (!response) {
    // TODO: We need to properly handle this case
    logger.error('Failed to join community - invalid response from backend')
    yield* put(communitiesActions.clearInvitationCodes())
    yield* put(communitiesActions.deleteCommunity(communityId))
    return
  }
  yield* put(communitiesActions.updateCommunityData(response.community))
  yield* put(identityActions.addNewIdentity(response.identity))
  yield* put(usersActions.setUserProfile(response.profile))
  yield* put(communitiesActions.launchCommunity(response.community))
  // clearing invitation codes to mark that we are done with joining a community
  yield* put(communitiesActions.clearInvitationCodes())
}
