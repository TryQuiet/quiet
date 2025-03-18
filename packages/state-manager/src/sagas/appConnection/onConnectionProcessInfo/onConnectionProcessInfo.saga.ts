import { type PayloadAction } from '@reduxjs/toolkit'
import { select, putResolve } from 'typed-redux-saga'
import { connectionActions } from '../connection.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { CommunityOwnership } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('onConnectionProcessInfo')

export function* onConnectionProcessInfo(
  action: PayloadAction<ReturnType<typeof connectionActions.onConnectionProcessInfo>['payload']>
): Generator {
  const info = action.payload
  const community = yield* select(communitiesSelectors.currentCommunity)
  const isOwner = yield* select(communitiesSelectors.isOwner)

  logger.info('onConnectionProcessInfo', { info, isOwner })
  yield* putResolve(connectionActions.setConnectionProcess({ info, isOwner }))
}
