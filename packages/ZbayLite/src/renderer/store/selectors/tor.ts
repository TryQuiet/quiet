import { createSelector } from 'reselect'

import { Store } from '../reducers'

const tor = (s: Store) => s.tor

const torEnabled = createSelector(
  tor,
  tor => tor.enabled
)

export default {
  tor,
  torEnabled
}
