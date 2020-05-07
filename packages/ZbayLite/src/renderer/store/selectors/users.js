import { createSelector } from 'reselect'
import identitySelectors from './identity'
const store = s => s

const users = createSelector(store, state => {
  return state.get('users')
})

const registeredUser = signerPubKey =>
  createSelector(users, users => users.get(signerPubKey))

const myUser = createSelector(
  users,
  identitySelectors.signerPubKey,
  (users, signerPubKey) => {
    console.log(signerPubKey)
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
  registeredUser
}
