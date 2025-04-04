import { apply, select, put, call, take } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, type Socket } from '../../../types'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions } from '../communities.slice'
import {
  type Community,
  CommunityOwnership,
  type InitCommunityPayload,
  JoinCommunityPayload,
  SocketActions,
} from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { generateId } from '../../../utils/cryptography/cryptography'
import { networkActions } from '../../network/network.slice'

const logger = createLogger('joinCommunitySaga')

export function* joinCommunitySaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.joinCommunity>['payload']>
): Generator {
  logger.info('Joining community')

  const { inviteData } = action.payload as JoinCommunityPayload

  const communityId = yield* call(generateId)

  const registerAction: ReturnType<typeof identityActions.registerUsername> = yield* take(
    identityActions.registerUsername
  )
  const username = registerAction.payload.nickname

  yield* put(
    communitiesActions.addNewCommunity({
      id: communityId,
      ownership: CommunityOwnership.User,
    } as Community)
  )

  const payload: InitCommunityPayload = {
    id: communityId,
    name: '',
    inviteData,
    username: username,
  }

  const createdCommunity: Community | undefined = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.JOIN_COMMUNITY, payload)
  )
  if (!createdCommunity) {
    logger.error('Failed to join community - invalid response from backend')
    return
  }
  yield* put(communitiesActions.updateCommunityData(createdCommunity))
  yield* put(communitiesActions.setCurrentCommunity(createdCommunity.id))
}
