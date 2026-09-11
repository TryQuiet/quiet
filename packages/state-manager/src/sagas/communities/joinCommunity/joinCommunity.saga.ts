import { apply, put, call, take, select, cancelled } from 'typed-redux-saga'
import { applyEmitParams, type Socket } from '../../../types'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions } from '../communities.slice'
import { communitiesSelectors } from '../communities.selectors'
import {
  type InitCommunityPayload,
  InvitationDataVersion,
  LoadingPanelType,
  ResponseJoinCommunityPayload,
  SocketActions,
} from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { generateId } from '../../../utils/cryptography/cryptography'
import { usersActions } from '../../users/users.slice'
import { networkActions } from '../../network/network.slice'

const logger = createLogger('joinCommunitySaga')

export function* joinCommunitySaga(socket: Socket): Generator {
  const initialJoin = yield* select(communitiesSelectors.pendingJoin)
  if (!initialJoin || initialJoin.status !== 'draft') return
  const { attempt, inviteData } = initialJoin
  const communityId = initialJoin.communityId ?? (yield* call(generateId))
  const needsTerms =
    inviteData.version === InvitationDataVersion.v5 && Boolean(inviteData.qssEnabled || inviteData.qssEndpoint)

  yield* put(communitiesActions.setPendingJoinId({ attempt, communityId }))
  yield* put(networkActions.setLoadingPanelType(LoadingPanelType.Joining))

  try {
    while (true) {
      const pendingJoin = yield* select(communitiesSelectors.pendingJoin)
      if (pendingJoin?.attempt !== attempt || pendingJoin.status !== 'draft') return
      if (needsTerms && pendingJoin.tosAccepted === false) {
        yield* put(communitiesActions.clearInvitationCodes())
        return
      }
      if (pendingJoin.username && (!needsTerms || pendingJoin.tosAccepted === true)) {
        // Mark submission before touching the socket. A lost acknowledgement must
        // never replay a join, because the backend operation erases previous state.
        yield* put(communitiesActions.submitPendingJoin(attempt))
        const payload: InitCommunityPayload = {
          id: communityId,
          name: inviteData.authData.communityName,
          inviteData,
          username: pendingJoin.username,
          tosAccepted: pendingJoin.tosAccepted === true,
        }
        logger.info('Updating backend with community data')
        const response: ResponseJoinCommunityPayload | undefined = yield* apply(
          socket,
          socket.emitWithAck,
          applyEmitParams(SocketActions.JOIN_COMMUNITY, payload)
        )
        if (!response) {
          // An explicit negative acknowledgement is different from losing the
          // acknowledgement altogether. Keep the existing failed-join handling.
          yield* put(communitiesActions.clearInvitationCodes())
          yield* put(networkActions.setLoadingPanelType(LoadingPanelType.Failed))
          return
        }
        if (!response.community || !response.identity || !response.profile) {
          throw new Error('Invalid join response from backend')
        }
        yield* put(communitiesActions.addNewCommunity(response.community))
        yield* put(communitiesActions.setCurrentCommunity(response.community.id))
        yield* put(identityActions.addNewIdentity(response.identity))
        yield* put(usersActions.setUserProfile(response.profile))
        yield* put(communitiesActions.launchCommunity(response.community))
        yield* put(communitiesActions.clearInvitationCodes())
        return
      }
      if (pendingJoin.username && needsTerms) {
        yield* put(communitiesActions.requestTermsOfService())
      }
      yield* take([
        identityActions.registerUsername.type,
        communitiesActions.setTermsOfServiceAccepted.type,
        communitiesActions.clearInvitationCodes.type,
      ])
    }
  } catch (error) {
    // An acknowledgement failure does not prove the backend rejected the request.
    logger.error('Joining was interrupted before acknowledgement', error)
    yield* put(communitiesActions.interruptPendingJoin(attempt))
  } finally {
    if (yield* cancelled()) {
      yield* put(communitiesActions.interruptPendingJoin(attempt))
    }
  }
}
