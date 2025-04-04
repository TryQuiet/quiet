import { put, select, call } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { WriteMessagePayload, MessageType, PublicChannel, PublicChannelStorage, CommunityOwnership } from '@quiet/types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../../identity/identity.selectors'
import { identityActions } from '../../identity/identity.slice'
import { userJoinedMessage } from '@quiet/common'
import { userProfileSelectors } from '../../users/userProfile/userProfile.selectors'

export function* sendIntroductionMessageSaga(): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  const isOwner = yield* select(communitiesSelectors.isOwner)
  const userProfile = yield* select(userProfileSelectors.myUserProfile)

  if (isOwner || !identity || identity.introMessageSent || !generalChannel || !userProfile) {
    return
  }

  const message = yield* call(userJoinedMessage, userProfile.nickname)
  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelId: generalChannel.id,
  }

  yield* put(messagesActions.sendMessage(payload))
  yield* put(identityActions.updateIdentity({ ...identity, introMessageSent: true }))
}
