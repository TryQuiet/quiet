import { createSelector } from 'reselect'

const store = s => s

const channels = createSelector(store, state => state.get('channels'))
const data = createSelector(channels, ch => ch.data)
const errors = createSelector(channels, c => c.get('errors'))

export default {
  channels,
  data,
  errors
}
