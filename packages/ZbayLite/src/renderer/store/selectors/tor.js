import { createSelector } from 'reselect'
const store = s => s

const tor = createSelector(
  store,
  state => state.tor
)
const torEnabled = createSelector(
  tor,
  tor => tor.enabled
)

export default {
  tor,
  torEnabled
}
