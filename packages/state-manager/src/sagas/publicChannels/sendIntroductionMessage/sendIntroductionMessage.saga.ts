import { put, select, call } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { WriteMessagePayload, MessageType } from '@quiet/types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../../identity/identity.selectors'
import { identityActions } from '../../identity/identity.slice'
import { userJoinedMessage } from '@quiet/common'
import { loggingHandler, LoggerModuleName } from '../../../utils/logger'

const LOGGER = loggingHandler.initLogger([
  LoggerModuleName.PUBLIC_CHANNELS,
  LoggerModuleName.SAGA,
  'sendIntroductionMessage',
])

export function* sendIntroductionMessageSaga(): Generator {
  LOGGER.info(`Sending introduction message`)
  const community = yield* select(communitiesSelectors.currentCommunity)
  const identity = yield* select(identitySelectors.currentIdentity)
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  if (community?.CA || !identity || identity.introMessageSent || !generalChannel) {
    LOGGER.warn(`Must have valid community CA, identity and general channel to send introduction message`)
    return
  }

  const message = yield* call(userJoinedMessage, identity.nickname)
  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelId: generalChannel.id,
  }

  yield* put(messagesActions.sendMessage(payload))
  yield* put(identityActions.updateIdentity({ ...identity, introMessageSent: true }))
}
