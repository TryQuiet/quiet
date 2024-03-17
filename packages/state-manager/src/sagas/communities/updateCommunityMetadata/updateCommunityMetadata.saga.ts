import { CommunityMetadata, SocketActionTypes } from '@quiet/types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, select, put, take } from 'typed-redux-saga'
import { applyEmitParams, type Socket } from '../../../types'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { LoggerModuleName, loggingHandler } from 'packages/state-manager/src/utils/logger'

const LOGGER = loggingHandler.initLogger([
  LoggerModuleName.COMMUNITIES,
  LoggerModuleName.SAGA,
  'updateCommunityMetadata',
])

export function* sendCommunityMetadataSaga(
  socket: Socket,
  _action: PayloadAction<ReturnType<typeof communitiesActions.sendCommunityMetadata>['payload']>
): Generator {
  LOGGER.info(`Sending community metadata with payload: ${JSON.stringify(_action.payload)}`)
  const identity = yield* select(identitySelectors.currentIdentity)
  const community = yield* select(communitiesSelectors.currentCommunity)

  if (!identity?.userCertificate) {
    LOGGER.error('Cannot send community metadata, no owner certificate')
    return
  }

  if (!community) {
    LOGGER.error('Cannot send community metadata, no community')
    return
  }

  if (!community.rootCa || !community.CA) {
    LOGGER.error('Cannot send community metadata, no rootCa or CA in community')
    return
  }

  const communityMetadataPayload: CommunityMetadata = {
    id: community.id,
    ownerCertificate: identity.userCertificate,
    rootCa: community.rootCa,
  }

  const meta = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.SET_COMMUNITY_METADATA, communityMetadataPayload)
  )

  if (meta) {
    yield* put(communitiesActions.saveCommunityMetadata(meta))
  }
}
