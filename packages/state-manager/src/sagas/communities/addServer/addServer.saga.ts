import { select, put } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { communitiesActions } from '../communities.slice'
import { type UpdateCommunityPayload } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { communitiesSelectors } from '../communities.selectors'

const logger = createLogger('addServerSaga')

export function* addServerSaga(
  action: PayloadAction<ReturnType<typeof communitiesActions.addServer>['payload']>
): Generator {
  logger.info('Starting addServerSaga')

  const { id, serverHosts } = action.payload
  const community = yield* select(communitiesSelectors.selectById(id))
  if (!community) {
    logger.warn('No community found with id', id, 'when handling addServerSaga')
    return
  }
  const updatedServerHosts = [...(community.serverHosts || [])]
  const existingHosts = new Set(community.serverHosts?.map(sh => sh.hostUrl) || [])
  for (const hostUrl of serverHosts) {
    if (!existingHosts.has(hostUrl)) {
      updatedServerHosts.push({ hostUrl, accepted: false })
    }
  }
  yield* put(
    communitiesActions.updateCommunityData({
      id,
      updates: {
        serverHosts: updatedServerHosts,
      },
    } as UpdateCommunityPayload)
  )
}
