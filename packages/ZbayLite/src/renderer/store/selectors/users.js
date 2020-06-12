import { createSelector } from 'reselect'
import identitySelectors from './identity'
const store = s => s

const users = createSelector(store, state => {
  return state.get('users')
})

const isRegisteredUsername = nickname => createSelector(users, (users) => {
  return users.toList().map(user => user.get('nickname')).includes(nickname)
})

const registeredUser = signerPubKey =>
  createSelector(users, users => users.get(signerPubKey))

const myUser = createSelector(
  users,
  identitySelectors.signerPubKey,
  (users, signerPubKey) => {
    return (
      users.get(signerPubKey) || {
        firstName: '',
        lastName: '',
        nickname: 'Anon' + signerPubKey.substring(0, 15),
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
