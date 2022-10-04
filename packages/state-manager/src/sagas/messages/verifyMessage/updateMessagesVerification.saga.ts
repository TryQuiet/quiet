import { select, spawn } from 'typed-redux-saga'
import { ChannelMessage } from '../../publicChannels/publicChannels.types'
import { messagesSelectors } from '../messages.selectors'
import { verifyMessage } from './verifyMessages.saga'
import { getCrypto } from 'pkijs'

export function* updateMessagesVerificationSaga(): Generator {
  const crypto = getCrypto()
  const statuses = yield* select(messagesSelectors.messagesVerificationStatus)
  console.log('statuses', statuses)

  const allMessages = yield* select(messagesSelectors.currentPublicChannelMessagesBase)

  const unverificatedMessages = allMessages.messages.ids.filter((id)=>{
    const messageSignature= allMessages.messages.entities[id].signature
    return !statuses[messageSignature]
  })

  let messages: ChannelMessage[] = unverificatedMessages.map((id)=>{
    return allMessages.messages.entities[id]
  })

  for (const message of messages) {
    yield* spawn(verifyMessage, message, crypto)
  }
}