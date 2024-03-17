import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { type Socket } from '../../../types'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { LoggerModuleName, loggingHandler } from 'packages/state-manager/src/utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.COMMUNITIES, LoggerModuleName.SAGA, 'saveCommunityMetadata'])

export function* saveCommunityMetadataSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.saveCommunityMetadata>['payload']>
): Generator {
  const communityId = yield* select(communitiesSelectors.currentCommunityId)
  LOGGER.info(`Saving community metadata for ID ${communityId} with payload: ${JSON.stringify(action.payload)}`)
  yield* put(
    communitiesActions.updateCommunity({
      id: communityId,
      rootCa: action.payload.rootCa,
      ownerOrbitDbIdentity: action.payload.ownerOrbitDbIdentity,
      ownerCertificate: action.payload.ownerCertificate,
    })
  )
}
