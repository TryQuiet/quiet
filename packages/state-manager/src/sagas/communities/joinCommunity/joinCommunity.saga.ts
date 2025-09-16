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

  logger.info('Waiting for user to register username')
  const registerAction: ReturnType<typeof identityActions.registerUsername> = yield* take(
    identityActions.registerUsername
  )

  let acceptTerms = { payload: { accepted: false } } as ReturnType<typeof communitiesActions.setTermsOfServiceAccepted>
  if (inviteData?.version === InvitationDataVersion.v3 && (inviteData?.qssEnabled || inviteData?.qssEndpoint)) {
    yield* put(communitiesActions.requestQssOptIn())
    acceptTerms = yield* take(communitiesActions.setTermsOfServiceAccepted)
    if (acceptTerms.payload.accepted) {
      logger.info('User opted in to QSS')
      communityCandidate.qssEnabled = true
      communityCandidate.qssEndpoint = inviteData.qssEndpoint
      communityCandidate.tosAccepted = true
    } else {
      logger.info('User opted out of QSS')
      yield* put(communitiesActions.clearInvitationCodes())
      return
    }
  }

  const payload: InitCommunityPayload = {
    id: communityId,
    name: '',
    inviteData,
    username: registerAction.payload.nickname,
    tosAccepted: acceptTerms.payload.accepted,
  }

  logger.info('Updating backend with community data')

  const response: ResponseJoinCommunityPayload | undefined = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.JOIN_COMMUNITY, payload)
  )
  logger.debug('Response from backend', response)
  if (!response) {
    logger.error('Failed to join community - invalid response from backend')
    yield* put(communitiesActions.clearInvitationCodes())
    return
  }
  yield* put(communitiesActions.addNewCommunity(response.community))
  yield* put(identityActions.addNewIdentity(response.identity))
  yield* put(usersActions.setUserProfile(response.profile))
  yield* put(communitiesActions.clearInvitationCodes())
  yield* put(communitiesActions.launchCommunity(response.community))
  // clearing invitation codes to mark that we are done with joining a community
}
