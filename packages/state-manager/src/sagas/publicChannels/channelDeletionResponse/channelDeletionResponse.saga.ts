import { publicChannelsActions } from '../publicChannels.slice'
import { type PayloadAction } from '@reduxjs/toolkit'
import { put, delay, select } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { CommunityOwnership, type PublicChannelStorage } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { filesActions } from '../../files/files.slice'

const logger = createLogger('channelDeletionResponseSaga')

export function* channelDeletionResponseSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.channelDeletionResponse>['payload']>
): Generator {
  const { channelId, deleted } = action.payload
  logger.info(`Handling channel ${action.payload.channelId} deletion response '${deleted}'`)

  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  const isChannelExist = yield* select(publicChannelsSelectors.getChannelById(channelId))
  const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)

  if (!isChannelExist) {
    logger.warn(`Channel with id ${channelId} doesnt exist in store`)
    return
  }

  if (!generalChannel) {
    logger.warn('General Channel doesnt exist in store')
    return
  }

  if (!deleted) {
    logger.info('Failed to delete channel')
    return
  }

  const deletedGeneral = channelId === generalChannel.id
  if (deletedGeneral) {
    yield* put(publicChannelsActions.startGeneralRecreation())
  } else if (channelId === currentChannelId) {
    yield* put(publicChannelsActions.setCurrentChannel({ channelId: generalChannel.id }))
  }

  yield* put(publicChannelsActions.disableChannel({ channelId }))

  yield* put(filesActions.deleteFilesFromChannel({ channelId }))

  yield* put(publicChannelsActions.clearMessagesCache({ channelId }))

  yield* put(messagesActions.deleteChannelEntry({ channelId }))

  yield* put(publicChannelsActions.deleteChannelFromStore({ channelId }))

  yield* put(publicChannelsActions.completeChannelDeletion({}))

  if (deletedGeneral) {
    yield* put(publicChannelsActions.createGeneralChannel())
  } else {
    yield* put(messagesActions.sendDeletionMessage({ channelId }))
  }

  const isUserOnGeneral = currentChannelId === generalChannel.id
  if (deletedGeneral && isUserOnGeneral) {
    let newGeneralChannel: PublicChannelStorage | undefined = yield* select(publicChannelsSelectors.generalChannel)
    while (!newGeneralChannel) {
      logger.warn('General channel has not been replicated yet')
      yield* delay(1000)
      newGeneralChannel = yield* select(publicChannelsSelectors.generalChannel)
    }
    yield* put(publicChannelsActions.setCurrentChannel({ channelId: newGeneralChannel.id }))
  }
}
