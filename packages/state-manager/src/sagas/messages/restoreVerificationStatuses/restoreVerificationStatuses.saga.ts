import { select, put } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'

export function* restoreVerificationStatusesSaga(): Generator {
  const verificationStatuses = yield* select(messagesSelectors.messagesVerificationStatus)
  const unverificatdStatueses = Object.values(verificationStatuses).filter((status) => {
    return typeof status?.isVerified !== 'boolean'
  })
  const channelsMessages = yield* select(messagesSelectors.publicChannelsMessagesBase)

  const messagesToRemove: Array<{id: string; address: string}> = []
  unverificatdStatueses.forEach((item) => {
    Object.values(channelsMessages).forEach((channelMessages) => {
      Object.values(channelMessages.messages.entities).forEach((message) => {
        if (message.signature === item.signature) {
            messagesToRemove.push({ id: message.id, address: channelMessages.channelAddress })
        }
      })
    })
  })

  for (const message of messagesToRemove) {
      yield* put(messagesActions.removeMessageVerificationStatus(message.id))
      yield* put(messagesActions.removePublicChannelMessage(message))
  }
}
