import { createSelector } from 'reselect'

const store = s => s

export const coordinator = createSelector(store, state => state.get('coordinator'))

const running = createSelector(coordinator, a => a.running)

export default {
  running
}
