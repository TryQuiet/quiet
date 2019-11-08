import { createSelector } from 'reselect'
const store = s => s

const tnxTimestamps = createSelector(
  store,
  state => state.get('txnTimestamps')
)

export default {
  tnxTimestamps
}
