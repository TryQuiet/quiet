import { type Socket, applyEmitParams } from '../../../types'
import { select, apply, put, take } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { type Community, CommunityOwnership, type InitCommunityPayload, SocketActionTypes } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { generateId } from 'packages/state-manager/src/utils/cryptography/cryptography'
import { identityActions } from '../../identity/identity.slice'

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
  }

  const createdCommunity: Community | undefined = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.CREATE_COMMUNITY, payload)
  )

  if (!createdCommunity) {
    logger.error('Failed to create community - invalid response from backend')
    return
  }

  logger.info('Community created:', createdCommunity)
  yield* put(communitiesActions.updateCommunityData(createdCommunity))

  yield* put(publicChannelsActions.createGeneralChannel())
  logger.info('Community created')
}
