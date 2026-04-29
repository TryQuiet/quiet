import { put, call } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { generateChannelId } from '@quiet/common'
import { createLogger } from '../../../utils/logger'
import { ChannelType, CreateChannelPayload } from '@quiet/types'

const logger = createLogger('createGeneralChannelSaga')

export function* createGeneralChannelSaga(): Generator {
  const id = yield* call(generateChannelId, 'general')

  yield* put(
    publicChannelsActions.createChannel({
      id: id,
      name: 'general',
      description: 'Welcome to #general',
      type: ChannelType.CHANNEL,
    } as CreateChannelPayload)
  )

  yield* put(
    publicChannelsActions.setCurrentChannel({
      channelId: id,
    })
  )
}
