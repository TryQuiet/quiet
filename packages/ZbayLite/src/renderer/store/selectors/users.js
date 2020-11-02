import { createSelector } from 'reselect'
import identitySelectors from './identity'
const store = s => s

const users = createSelector(store, state => {
  return state.users
})

const isRegisteredUsername = nickname => createSelector(users, (users) => {
  return Array.from(Object.values(users)).map(user => user.nickname).includes(nickname)
})

const registeredUser = signerPubKey =>
  createSelector(users, users => users[signerPubKey])

const myUser = createSelector(
  users,
  identitySelectors.signerPubKey,
  (users, signerPubKey) => {
    return (
      users[signerPubKey] || {
        firstName: '',
        lastName: '',
        nickname: 'anon' + signerPubKey.substring(0, 16),
        address: '',
        createdAt: 0
      }
    )
  }
)

export default {
  users,
  myUser,
  registeredUser,
  isRegisteredUsername
}
