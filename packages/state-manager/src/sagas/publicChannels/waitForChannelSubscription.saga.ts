import { select, take } from 'typed-redux-saga'
import { createLogger } from '../../utils/logger'
import { publicChannelsSelectors } from './publicChannels.selectors'
import { publicChannelsActions } from './publicChannels.slice'

const logger = createLogger('waitForChannelSubscriptionSaga')

export function* waitForChannelSubscriptionSaga(channelId: string): Generator {
  logger.info('Checking channel subscription', channelId)
  const targetChannelSubscribed = publicChannelsSelectors.isChannelSubscribed(channelId)

  while (!(yield* select(targetChannelSubscribed))) {
    logger.info(`Waiting for channel ${channelId} subscription`)
    const action: ReturnType<typeof publicChannelsActions.setChannelSubscribed> = yield* take(
      publicChannelsActions.setChannelSubscribed
    )
    if (action.payload.channelId !== channelId) {
      logger.info(`Ignoring subscription for channel ${action.payload.channelId} while waiting for ${channelId}`)
    }
  }

  logger.info(`Channel ${channelId} subscribed`)
}
