import { createSelector } from 'reselect'

import { Store } from '../reducers'

const channel = (s: Store) => s.importedChannel

const data = createSelector(channel, c => c.data)
const decoding = createSelector(channel, c => c.decoding)
const errors = createSelector(channel, c => c.errors)

export default {
  data,
  decoding,
  errors
}
