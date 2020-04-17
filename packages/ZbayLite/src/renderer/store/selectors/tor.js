import { createSelector } from 'reselect'
const store = s => s

const tor = createSelector(
  store,
  state => state.get('tor')
)
const torEnabled = createSelector(
  tor,
  tor => tor.enabled
)

export default {
  tor,
  torEnabled
}
