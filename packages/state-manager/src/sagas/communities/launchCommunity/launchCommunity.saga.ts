import { apply, select, put, call } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, type Socket } from '../../../types'
import { identitySelectors } from '../../identity/identity.selectors'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { connectionActions } from '../../appConnection/connection.slice'
import { getCurrentTime } from '../../messages/utils/message.utils'
import { networkSelectors } from '../../network/network.selectors'
import { type InitCommunityPayload, LaunchCommunityPayload, SocketActions } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { filesActions } from '../../files/files.slice'
import { networkActions } from '../../network/network.slice'

const logger = createLogger('launchCommunitySaga')

export function* initCommunities(): Generator {
  logger.info('Initializing communities')
  const joinedCommunities = yield* select(identitySelectors.joinedCommunities)

  const initializedCommunities = yield* select(networkSelectors.initializedCommunities)
  for (const community of joinedCommunities) {
    if (!initializedCommunities[community.id]) {
      yield* put(communitiesActions.launchCommunity({ id: community.id }))
    }
  }

  const currentTime = yield* call(getCurrentTime)
  yield* put(connectionActions.setLastConnectedTime(currentTime))
}

export function* launchCommunitySaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.launchCommunity>['payload']>
): Generator {
  logger.info('Launching community')

  const { id } = action.payload

  if (!id) {
    logger.error('Could not launch community, missing community ID')
    return
  }

  const community = yield* select(communitiesSelectors.selectById(id))
  const identity = yield* select(identitySelectors.selectById(id))

  if (!identity) {
    logger.error('Could not launch community - identity missing')
    return
  }

  if (!community) {
    logger.error('Could not launch community, missing community')
    return
  }

  const payload: LaunchCommunityPayload = {
    id: community.id,
  }
  // logger.info(`Launching community ${id} with payload`, payload)
  // yield* apply(socket, socket.emitWithAck, applyEmitParams(SocketActions.LAUNCH_COMMUNITY, payload))

  logger.info('Setting current community')
  yield* put(communitiesActions.setCurrentCommunity(id))
  logger.info('Checking for missing files')
  yield* put(filesActions.checkForMissingFiles(id))
  logger.info('Adding initialized community')
  yield* put(networkActions.addInitializedCommunity(id))
}
