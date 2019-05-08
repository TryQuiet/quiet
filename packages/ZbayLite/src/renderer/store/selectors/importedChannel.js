import { createSelector } from 'reselect'

const store = s => s

const channel = createSelector(store, state => state.get('importedChannel'))

const data = createSelector(channel, c => c.data)
const decoding = createSelector(channel, c => c.decoding)
const errors = createSelector(channel, c => c.errors)

export default {
  data,
  decoding,
  errors
}
