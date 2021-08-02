import { createSelector } from 'reselect'
import { Store } from '../reducers'

const directMessages = (s: Store) => s.directMessages

export const users = createSelector(directMessages, (d) => {
  return d.users
})

export const user = (publicKey) => createSelector(users, (d) => {
  return d[publicKey]
})
export const userByPublicKey = (publicKey) => createSelector(users, (d) => {
  return Array.from(Object.values(d)).find(u => u.publicKey === publicKey)
})

export const publicKey = createSelector(directMessages, d => d.publicKey)
export const privateKey = createSelector(directMessages, d => d.privateKey)
export const conversations = createSelector(directMessages, d => d.conversations)
export const conversationsList = createSelector(directMessages, d => d.conversationsList)

export default {
  users,
  user,
  publicKey,
  privateKey,
  conversations,
  conversationsList,
  userByPublicKey
}
