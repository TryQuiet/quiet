import { createSelector } from 'reselect'

const store = s => s

const data = createSelector(store, s => s.get('notifications'))

export default {
  data
}
