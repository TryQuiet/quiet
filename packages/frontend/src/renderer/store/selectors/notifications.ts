import { createSelector } from 'reselect'

import { Store } from '../reducers'

const notifications = (s: Store) => s.notifications

const data = createSelector(notifications, s => s)

export default {
  data
}
