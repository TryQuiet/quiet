import { type Socket, applyEmitParams } from '../../../types'
import { select, apply, put, take } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import {
  CaptchaContexts,
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
  yield* put(networkActions.setLoadingPanelType(LoadingPanelType.Creating))

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
    if (process.env.NODE_ENV !== 'test') {
      yield* put(captchaActions.presentChallenge({ context: CaptchaContexts.CREATE_COMMUNITY }))
      while (true) {
        const challengeResultAction: ReturnType<typeof captchaActions.setChallengeResult> = yield* take(
          captchaActions.setChallengeResult
        )
        if (challengeResultAction.payload.cancelled === true) {
          logger.info('Captcha challenge was cancelled, aborting community creation')
          yield* put(networkActions.setLoadingPanelType(LoadingPanelType.Failed))
          return
        } else if (challengeResultAction.payload.success) {
          logger.info('Captcha challenge succeeded')
          break
        } else {
          logger.info('Captcha challenge failed, presenting challenge again')
          yield* put(captchaActions.presentChallenge({ context: CaptchaContexts.CREATE_COMMUNITY }))
        }
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
  const createCommunityResponse: ResponseCreateCommunityPayload = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.CREATE_COMMUNITY, payload)
  )

  logger.debug('Response from backend', createCommunityResponse)
  if (!createCommunityResponse || !createCommunityResponse.community || !createCommunityResponse.identity) {
    logger.error('Failed to create community - invalid response from backend')
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
