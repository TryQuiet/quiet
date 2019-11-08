import { createSelector } from 'reselect'
import directMssagesQueueSelectors from './directMessagesQueue'
import operationsSelectors from './operations'
import zbayMessages from '../../zbay/messages'
import identitySelectors from './identity'
import usersSelectors from './users'
import { mergeIntoOne } from './channel'
const store = s => s

const offers = createSelector(
  store,
  s => s.get('offers')
)

const offer = id =>
  createSelector(
    offers,
    a => a.get(id)
  )

export const queuedMessages = id =>
  createSelector(
    directMssagesQueueSelectors.queue,
    queue =>
      queue.filter(
        m => m.offerId === id.substring(0, 64) && m.recipientUsername === id.substring(64)
      )
  )

export const pendingMessages = id =>
  createSelector(
    operationsSelectors.operations,
    operations =>
      operations.filter(
        o => o.meta.offerId === id.substring(0, 64) && o.meta.recipientUsername === id.substring(64)
      )
  )
const offerMessages = (id, signerPubKey) =>
  createSelector(
    identitySelectors.data,
    usersSelectors.registeredUser(signerPubKey),
    offers,
    pendingMessages(id),
    queuedMessages(id),
    (identity, registeredUser, a, pendingMessages, queuedMessages) => {
      const userData = registeredUser ? registeredUser.toJS() : null
      const identityAddress = identity.address
      const identityName = userData ? userData.nickname : identity.name
      const displayablePending = pendingMessages.map(operation => {
        return zbayMessages.operationToDisplayableMessage({
          operation: operation.updateIn(['meta', 'message', 'message'], msg => msg.get('text')),
          tag: operation.getIn(['meta', 'message', 'message', 'tag']),
          offerOwner: operation.getIn(['meta', 'message', 'message', 'offerOwner']),
          identityAddress,
          identityName,
          receiver: {
            replyTo: operation.meta.recipientAddress,
            username: operation.meta.recipientUsername
          }
        })
      })
      const displayableQueued = queuedMessages.map((queuedMessage, messageKey) => {
        return zbayMessages.queuedToDisplayableMessage({
          queuedMessage: queuedMessage.updateIn(['message', 'message'], msg => msg.get('text')),
          tag: queuedMessage.getIn(['message', 'message', 'tag']),
          offerOwner: queuedMessage.getIn(['message', 'message', 'offerOwner']),
          messageKey,
          identityAddress,
          identityName
        })
      })
      const vaultMessages = a.get(id).messages
      const concatedMessages = vaultMessages
        .concat(displayableQueued.values(), displayablePending.values())
        .sortBy(m => m.get('createdAt'))
      const merged = mergeIntoOne(concatedMessages)
      return merged
    }
  )
const lastSeen = id =>
  createSelector(
    offer(id),
    ch => ch.get('lastSeen')
  )
export default {
  offers,
  offer,
  offerMessages,
  lastSeen
}
