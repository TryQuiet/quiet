import { createSelector } from 'reselect'

import { Store } from '../reducers'

const fees = (s: Store) => s.fees

const userFee = createSelector(fees, a => a.user)
const publicChannelfee = createSelector(fees, a => a.publicChannel)

export default {
  userFee,
  publicChannelfee
}
