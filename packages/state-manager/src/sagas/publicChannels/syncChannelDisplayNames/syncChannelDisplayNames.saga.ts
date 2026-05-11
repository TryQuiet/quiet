import { select, putResolve } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { createLogger } from '../../../utils/logger'
import { userProfileSelectors } from '../../users/userProfile/userProfile.selectors'
import { ChannelType } from '@quiet/types'
import { generateDmChannelName } from '@quiet/common'

const logger = createLogger('syncChannelDisplayNamesSaga')

export function* syncChannelDisplayNamesSaga(): Generator {
  logger.info(`Syncing channel display names`)

  const locallyStoredChannels = yield* select(publicChannelsSelectors.publicChannels)
  const userProfiles = yield* select(userProfileSelectors.userProfiles)
  const me = yield* select(userProfileSelectors.myUserProfile)

  // Upserting channels to local storage
  for (const channel of locallyStoredChannels) {
    const displayedName =
      channel.type === ChannelType.CHANNEL ? channel.name : generateDmChannelName(channel.memberIds, userProfiles, me)
    if (channel && channel.displayedName !== displayedName) {
      logger.warn('Setting display name', channel.id, displayedName)
      yield* putResolve(publicChannelsActions.setDisplayedName({ channelId: channel.id, displayedName }))
    }
  }

  logger.info('Channel display name sync saga finished')
}
