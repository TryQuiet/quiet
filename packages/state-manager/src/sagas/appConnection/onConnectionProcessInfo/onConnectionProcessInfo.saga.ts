import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { connectionActions } from '../connection.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { SetConnectionProcessInfoPayload } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('onConnectionProcessInfo')

export function* onConnectionProcessInfo(
  action: PayloadAction<ReturnType<typeof connectionActions.onConnectionProcessInfo>['payload']>
): Generator {
  const info = action.payload
  const isOwner = yield* select(communitiesSelectors.isOwner)

  const connectionProcessInfo: SetConnectionProcessInfoPayload = {
    info,
    isOwner,
  }
  yield* put(connectionActions.setConnectionProcess(connectionProcessInfo))
}
