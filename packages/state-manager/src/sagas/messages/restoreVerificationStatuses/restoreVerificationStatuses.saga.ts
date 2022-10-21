import { select, put } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'
import { filesSelectors } from '../../files/files.selectors'
import { ChannelMessage } from '../../publicChannels/publicChannels.types'
import { filesActions } from '../../files/files.slice'

export function* restoreVerificationStatusesSaga(): Generator {
  const verificationStatuses = yield* select(messagesSelectors.messagesVerificationStatus)
  const filesStatuses = yield* select(filesSelectors.downloadStatuses)
  const channelsMessages = yield* select(messagesSelectors.publicChannelsMessagesBase)

  const unverificatedStatueses = Object.values(verificationStatuses).filter((status) => {
      return typeof status?.isVerified !== 'boolean'
    })

  const messagesToRemove: ChannelMessage[] = []
  const filesToRemove: ChannelMessage[] = []
  unverificatedStatueses.forEach((item) => {
    Object.values(channelsMessages).forEach((channelMessages) => {
      Object.values(channelMessages.messages.entities).forEach((message) => {
        if (message.signature === item.signature) {
            messagesToRemove.push(message)
            if (message.media && message.type === 2) {
                filesToRemove.push(message)
            }
        }
      })
    })
  })

  for (const message of filesToRemove) {
    yield* put(filesActions.removeDownloadStatus({ cid: message.media.message.id }))
  }
  for (const message of messagesToRemove) {
    yield* put(messagesActions.removeMessageVerificationStatus(message.id))
    yield* put(messagesActions.removePublicChannelMessage({ address: message.channelAddress, id: message.id }))
  }

  const filesToUpdate: ChannelMessage[] = []
  Object.values(channelsMessages).forEach((channelMessages) => {
    Object.values(channelMessages.messages.entities).forEach((message) => {
      if (message.media && message.type === 2) {
          if (!message.media.path) {
            filesToUpdate.push(message)
          }
      }
    })
  })
  for (const message of filesToUpdate) {
    if (filesStatuses[message.media.message.id]) {
        yield* put(filesActions.removeDownloadStatus({ cid: message.media.message.id }))
    }
    yield* put(messagesActions.removeMessageVerificationStatus(message.id))
    yield* put(messagesActions.removePublicChannelMessage({ address: message.channelAddress, id: message.id }))
}
}
