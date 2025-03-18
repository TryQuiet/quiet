import { apply, select, put, call, take } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, type Socket } from '../../../types'
import { identityActions } from '../../identity/identity.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { connectionActions } from '../../appConnection/connection.slice'
import { getCurrentTime } from '../../messages/utils/message.utils'
import { connectionSelectors } from '../../appConnection/connection.selectors'
import { networkSelectors } from '../../network/network.selectors'
import { pairsToP2pAddresses } from '@quiet/common'
import {
  type Community,
  CommunityOwnership,
  type InitCommunityPayload,
  JoinCommunityPayload,
  SocketActionTypes,
} from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { generateId } from 'packages/state-manager/src/utils/cryptography/cryptography'

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
    inviteData,
    username: username,
  }

  const createdCommunity: Community | undefined = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.JOIN_COMMUNITY, payload)
  )
  if (!createdCommunity) {
    logger.error('Failed to join community - invalid response from backend')
    return
  }
  yield* put(communitiesActions.updateCommunityData(createdCommunity))
}
