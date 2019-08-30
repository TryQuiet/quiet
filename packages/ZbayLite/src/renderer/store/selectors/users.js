import { createSelector } from 'reselect'
const store = s => s

const users = createSelector(
  store,
  state => state.get('users')
)

const registeredUsername = (signerPubKey) => createSelector(
  users,
  users => users
    .get(signerPubKey)
    .get('nickname')
)

export default {
  users,
  registeredUsername
}
