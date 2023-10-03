import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select, call } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { generalChannel, publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { WriteMessagePayload, MessageType } from '@quiet/types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../../identity/identity.selectors'
import { usersSelectors } from '../../users/users.selectors'

export function* sendUnregisteredInfoMessage(): Generator {
  //   action: PayloadAction<ReturnType<typeof publicChannelsActions.sendUnregisteredInfoMessage>['payload']>
  //   const { username } = action.payload

  const community = yield* select(communitiesSelectors.currentCommunity)
  const identity = yield* select(identitySelectors.currentIdentity)

  console.log({ community, identity })
  if (!community?.name || !identity) return

  const nickname = identity.nickname
  const communityName = community.name

  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  console.log({ generalChannel })
  if (!generalChannel) return

  const ownerData = yield* select(usersSelectors.ownerData)
  const ownerNickname = ownerData.username

  const message = `@${nickname} has joined ${communityName}! 🎉

  Note: @${nickname} is not yet registered, so they'll have the "unregistered" badge until the community creator (@${ownerNickname}) registers them, which will happen automatically when @${ownerNickname} next appears online. [Learn more]`

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelId: generalChannel.id,
  }
  console.log('endddd')
  yield* put(messagesActions.sendMessage(payload))
}
