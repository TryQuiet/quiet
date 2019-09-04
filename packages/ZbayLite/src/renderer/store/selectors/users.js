import { createSelector } from 'reselect'
const store = s => s

const users = createSelector(
  store,
  state => state.get('users')
)

const registeredUser = signerPubKey =>
  createSelector(
    users,
    users => users.get(signerPubKey)
  )

export default {
  users,
  registeredUser
}
