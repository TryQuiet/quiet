import { createSelector } from 'reselect'

const store = s => s

export const directMessageChannel = createSelector(store, state => state.get('directMessageChannel'))

export default {
  directMessageChannel
}
