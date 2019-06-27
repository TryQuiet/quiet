import { createSelector } from 'reselect'

const store = s => s

const channels = createSelector(store, state => state.get('channels'))
const data = createSelector(channels, ch => ch.data)
const loader = createSelector(channels, ch => ch.loader)
const errors = createSelector(channels, c => c.get('errors'))

export default {
  channels,
  loader,
  data,
  errors
}
