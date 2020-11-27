import { createSelector } from 'reselect'

import { Store } from '../reducers'

const coordinator = (s: Store) => s.coordinator

const running = createSelector(coordinator, a => a.running)

export default {
  running
}
