import { createSelector } from 'reselect'

const store = s => s

export const fees = createSelector(store, state => state.get('fees'))

const userFee = createSelector(fees, a => a.user)
const publicChannelfee = createSelector(fees, a => a.publicChannel)

export default {
  userFee,
  publicChannelfee
}
