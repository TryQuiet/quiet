import { put, select, call, take } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { WriteMessagePayload, MessageType, PublicChannel, PublicChannelStorage } from '@quiet/types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../../identity/identity.selectors'
import { userJoinedMessage } from '@quiet/common'
import { publicChannelsActions } from '../publicChannels.slice'

export function* sendUnregisteredInfoMessage(): Generator {
  const community = yield* select(communitiesSelectors.currentCommunity)
  if (community?.CA) return

  const identity = yield* select(identitySelectors.currentIdentity)

  let generalChannel: PublicChannelStorage | PublicChannel | undefined = yield* select(
    publicChannelsSelectors.generalChannel
  )

  while (!generalChannel) {
    const action = yield* take(publicChannelsActions.channelsReplicated)
    const { channels: _channels } = action.payload
    const channels = Object.values(_channels)
    generalChannel = channels.find(channel => channel?.name === 'general')
    if (generalChannel) {
      break
    }
  }

  if (!identity) return

  const message = yield* call(userJoinedMessage, identity.nickname)

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelId: generalChannel.id,
  }

  yield* put(messagesActions.sendMessage(payload))
}
