import { createSelector } from 'reselect'
const store = s => s

const tor = createSelector(
  store,
  state => state.get('tor')
)

export default {
  tor
}
