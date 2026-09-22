import { put, select, call } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { WriteMessagePayload, MessageType } from '@quiet/types'
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

  if (isOwner || !identity || !generalChannel || !userProfile) {
    return
  }

  const previousTargets = identity.introMessageChannelIds ?? []
  if (identity.introMessageSent) {
    // Replication can initially expose a deleted general channel. Repair its
    // introduction when the replacement arrives, provided it already existed
    // at the first announcement. A later recreation must not reannounce every
    // existing member. Older persisted identities retain their one-shot behavior.
    if (
      identity.introMessageSentAt == null ||
      previousTargets.includes(generalChannel.id) ||
      !(generalChannel.timestamp <= identity.introMessageSentAt)
    ) {
      return
    }
  }

  const message = yield* call(userJoinedMessage, userProfile.nickname)
  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelId: generalChannel.id,
  }

  // Reserve the target before sending; a synchronous replication update caused
  // by the message must see that this channel has already been announced in.
  yield* put(
    identityActions.updateIdentity({
      ...identity,
      introMessageSent: true,
      introMessageSentAt: identity.introMessageSentAt ?? Date.now(),
      introMessageChannelIds: [...previousTargets, generalChannel.id],
    })
  )
  yield* put(messagesActions.sendMessage(payload))
}
