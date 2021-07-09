import { createSelector } from 'reselect'
import usersSelectors from './users'
import { Store } from '../reducers'

const directMessages = (s: Store) => s.directMessages

export const users = createSelector(directMessages, usersSelectors.users, (d, users) => {
  const usrs: typeof d.users = {}
  Object.entries(d.users).map((user) => {
    const [publicKey, userData] = user
    usrs[publicKey] =
    {
      publicKey,
      halfKey: userData.halfKey,
      nickname: users[publicKey]?.nickname || userData.nickname

    }
  })
  return usrs
})

export const user = (publicKey) => createSelector(users, d => d[publicKey])

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
  conversationsList
}
