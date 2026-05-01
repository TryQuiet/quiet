import { select, putResolve } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { createLogger } from '../../../utils/logger'
import { userProfileSelectors } from '../../users/userProfile/userProfile.selectors'
import { ChannelType } from '@quiet/types'

const logger = createLogger('syncChannelDisplayNamesSaga')

export function* syncChannelDisplayNamesSaga(): Generator {
  logger.info(`Syncing channel display names`)

  const locallyStoredChannels = yield* select(publicChannelsSelectors.publicChannels)
  const userProfiles = yield* select(userProfileSelectors.userProfiles)
  const me = yield* select(userProfileSelectors.myUserProfile)

  logger.info({ locallyStoredChannels })

  const _generateDmChannelName = (memberIds: string[] | undefined): string => {
    if (memberIds == null) return 'Empty DM Channel Name'
    if (memberIds.length === 1) {
      return me?.nickname ?? 'Me'
    }
    return memberIds
      .filter(id => id !== me?.userId)
      .map(id => userProfiles[id]?.nickname ?? id)
      .join(', ')
  }

  // Upserting channels to local storage
  for (const channel of locallyStoredChannels) {
    const displayedName =
      channel.type === ChannelType.CHANNEL ? channel.name : _generateDmChannelName(channel.memberIds)
    if (channel && channel.displayedName !== displayedName) {
      yield* putResolve(publicChannelsActions.setDisplayedName({ channelId: channel.id, displayedName }))
    }
  }

  logger.info('Channel display name sync saga finished')
}
