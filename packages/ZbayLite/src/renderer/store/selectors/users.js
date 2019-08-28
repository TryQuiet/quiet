import { createSelector } from 'reselect'
const store = s => s

const users = createSelector(
  store,
  state => state.get('users')
)

export default {
  users
}
