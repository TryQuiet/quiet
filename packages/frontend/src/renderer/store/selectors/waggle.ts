import { createSelector } from 'reselect'

import { Store } from '../reducers'

const waggle = (s: Store) => s.waggle

const isConnected = createSelector(waggle, w => w.isWaggleConnected)

export default {
  isConnected
}
