import { type Socket, applyEmitParams } from '../../../types'
import { select, apply, put, take } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import {
  type Community,
  CommunityOwnership,
  type InitCommunityPayload,
  ResponseCreateCommunityPayload,
  SocketActions,
} from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { generateId } from '../../../utils/cryptography/cryptography'
import { identityActions } from '../../identity/identity.slice'
import { usersActions } from '../../users/users.slice'
import { connectionActions } from '../../appConnection/connection.slice'

const logger = createLogger('createCommunitySaga')

export function* createCommunitySaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createCommunity>['payload']>
): Generator {
  logger.info('Creating community')

  const communityId = generateId()

  logger.info('Community ID:', communityId)

  const community = yield* select(communitiesSelectors.selectById(communityId))

  if (community) {
    logger.error('Community already exists')
    return
  }

  yield* put(
    communitiesActions.addNewCommunity({
      id: communityId,
      name: action.payload.name,
      ownership: CommunityOwnership.Owner,
      qssEnabled: action.payload.useServer,
      qssEndpoint: 'ws://localhost:3000',
    } as Community)
  )
  yield* put(communitiesActions.setCurrentCommunity(communityId))

  logger.info('Waiting for username registration')

  const registerAction: ReturnType<typeof identityActions.registerUsername> = yield* take(
    identityActions.registerUsername
  )
  const username = registerAction.payload.nickname

  const payload: InitCommunityPayload = {
    id: communityId,
    name: action.payload.name,
    username,
    useServer: action.payload.useServer,
  }

  const createCommunityResponse: ResponseCreateCommunityPayload = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.CREATE_COMMUNITY, payload)
  )

  if (!createCommunityResponse || !createCommunityResponse.community || !createCommunityResponse.identity) {
    logger.error('Failed to create community - invalid response from backend')
    yield* put(communitiesActions.setCurrentCommunity(''))
    yield* put(communitiesActions.deleteCommunity(communityId))
    return
  }

  yield* put(communitiesActions.updateCommunityData(createCommunityResponse.community))
  yield* put(identityActions.addNewIdentity(createCommunityResponse.identity))
  yield* put(usersActions.setUserProfile(createCommunityResponse.profile))
  yield* put(publicChannelsActions.createGeneralChannel())
  yield* put(communitiesActions.launchCommunity({ id: communityId }))
  yield* put(connectionActions.createInvite({}))
}
