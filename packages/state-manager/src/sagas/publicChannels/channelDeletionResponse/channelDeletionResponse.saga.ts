import { publicChannelsActions } from '../publicChannels.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import logger from '../../../utils/logger'
import { put, delay, select } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { PublicChannelStorage } from '@quiet/types'

const log = logger('publicChannels')

export function* channelDeletionResponseSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.channelDeletionResponse>['payload']>
): Generator {
  log(`Deleted channel ${action.payload.channelId} saga`)

  const { channelId } = action.payload
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  const publicChannelsSelector = yield* select(publicChannelsSelectors.publicChannels)

  const isChannelExist = publicChannelsSelector.find(channel => channel.id === channelId)
  if (!isChannelExist) {
    log(`Channel with id ${channelId} doesnt exist in store`)
    return
  }

  if (!generalChannel) {
    log('General Channel doesnt exist in store')
    return
  }

  const isGeneral = channelId === generalChannel.id

  if (isGeneral) {
    yield* put(publicChannelsActions.startGeneralRecreation())
  }

  yield* put(publicChannelsActions.clearMessagesCache({ channelId }))

  yield* put(messagesActions.deleteChannelEntry({ channelId }))

  yield* put(publicChannelsActions.deleteChannelFromStore({ channelId }))

  yield* put(publicChannelsActions.completeChannelDeletion({}))

  const community = yield* select(communitiesSelectors.currentCommunity)

  const isOwner = Boolean(community?.CA)

  if (isOwner) {
    if (isGeneral) {
      yield* put(publicChannelsActions.createGeneralChannel())
    } else {
      yield* put(messagesActions.sendDeletionMessage({ channelId }))
    }
  } else {
    if (isGeneral) {
      let generalChannel: PublicChannelStorage | undefined = yield* select(
        publicChannelsSelectors.generalChannel
      )
      while (!generalChannel) {
        log('General channel has not been replicated yet')
        yield* delay(500)
        generalChannel = yield* select(publicChannelsSelectors.generalChannel)
      }
      yield* put(publicChannelsActions.setCurrentChannel({ channelId: generalChannel.id }))
    }
  }
}
