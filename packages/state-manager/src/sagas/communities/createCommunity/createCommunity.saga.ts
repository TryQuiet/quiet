import { type Socket, applyEmitParams } from '../../../types'
import { select, apply, put, take } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import {
  CaptchaContexts,
  type Community,
  CommunityOwnership,
  type InitCommunityPayload,
  LoadingPanelType,
  ResponseCreateCommunityPayload,
  SocketActions,
} from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { generateId } from '../../../utils/cryptography/cryptography'
import { identityActions } from '../../identity/identity.slice'
import { usersActions } from '../../users/users.slice'
import { connectionActions } from '../../appConnection/connection.slice'
import { networkActions } from '../../network/network.slice'
import { captchaActions } from '../../captcha/captcha.slice'

const logger = createLogger('createCommunitySaga')

export function* createCommunitySaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createCommunity>['payload']>
): Generator {
  logger.info('Creating community')

  const communityId = generateId()

  logger.info('Community ID:', communityId)
  logger.info('Use server:', action.payload.useServer)

  const community = yield* select(communitiesSelectors.selectById(communityId))

  if (community) {
    logger.error('Community already exists')
    return
  }

  logger.info('Waiting for username registration')

  const registerAction: ReturnType<typeof identityActions.registerUsername> = yield* take(
    identityActions.registerUsername
  )
  const username = registerAction.payload.nickname

  let acceptTerms = { payload: { accepted: false } } as ReturnType<typeof communitiesActions.setTermsOfServiceAccepted>
  if (action.payload.useServer) {
    yield* put(communitiesActions.requestTermsOfService())
    acceptTerms = yield* take(communitiesActions.setTermsOfServiceAccepted)
    if (!acceptTerms.payload.accepted) {
      logger.info('User did not accept terms of service, aborting community creation')
      return
    }
    yield* put(captchaActions.presentChallenge({ context: CaptchaContexts.CREATE_COMMUNITY }))
    while (true) {
      const captchaVerified = yield* take(captchaActions.setCaptchaVerified)
      if (captchaVerified.payload) {
        logger.info('Captcha verified')
        break
      } else {
        logger.info('Captcha verification failed or was cancelled, retrying')
        yield* put(captchaActions.presentChallenge({ context: CaptchaContexts.RETRY }))
      }
    }
  }

  const payload: InitCommunityPayload = {
    id: communityId,
    name: action.payload.name,
    username,
    useServer: action.payload.useServer,
    tosAccepted: acceptTerms.payload.accepted,
  }
  logger.info('Set loading panel type', LoadingPanelType.Joining)
  yield* put(networkActions.setLoadingPanelType(LoadingPanelType.Joining))
  const createCommunityResponse: ResponseCreateCommunityPayload = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.CREATE_COMMUNITY, payload)
  )

  logger.debug('Response from backend', createCommunityResponse)
  if (!createCommunityResponse || !createCommunityResponse.community || !createCommunityResponse.identity) {
    logger.error('Failed to create community - invalid response from backend')
    yield* put(communitiesActions.setCurrentCommunity(''))
    yield* put(communitiesActions.deleteCommunity(communityId))
    yield* put(networkActions.setLoadingPanelType(LoadingPanelType.Failed))
    return
  }

  yield* put(communitiesActions.addNewCommunity(createCommunityResponse.community))
  yield* put(communitiesActions.setCurrentCommunity(createCommunityResponse.community.id))
  yield* put(identityActions.addNewIdentity(createCommunityResponse.identity))
  yield* put(usersActions.setUserProfile(createCommunityResponse.profile))
  yield* put(publicChannelsActions.createGeneralChannel())
  yield* put(communitiesActions.launchCommunity({ id: communityId }))
  yield* put(connectionActions.createInvite({}))
}
