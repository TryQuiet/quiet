import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { messagesActions } from '../messages.slice'
import { MessageType, type WriteMessagePayload } from '@quiet/types'
import { loggingHandler, LoggerModuleName } from '../../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.MESSAGES, LoggerModuleName.SAGA, 'sendDeletionMessage'])

export function* sendDeletionMessageSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.sendDeletionMessage>['payload']>
): Generator {
  const { channelId } = action.payload
  LOGGER.info(`Deleting channel with ID ${channelId}`)
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  if (!generalChannel) {
    LOGGER.warn(`No general channel found, skipping delete`)
    return
  }

  const user = yield* select(identitySelectors.currentIdentity)

  const isGeneral = channelId === generalChannel.id

  const community = yield* select(communitiesSelectors.currentCommunity)

  const isOwner = Boolean(community?.CA)

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message: `@${user?.nickname} deleted #${channelId.slice(0, channelId.indexOf('_'))}`, // TEMPORARY
    channelId: generalChannel.id,
  }

  if (isOwner && !isGeneral) {
    yield* put(messagesActions.sendMessage(payload))
  }
}
