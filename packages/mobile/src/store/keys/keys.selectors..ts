import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'

const keysSlice: CreatedSelectors[StoreKeys.Keys] = (state: StoreState) => state[StoreKeys.Keys]

export const allKeys = createSelector(keysSlice, state => ({
  secretKeys: state.secretKeys,
  userPublicKeys: state.userPublicKeys,
  sigKeys: state.sigKeys,
}))

export const keysSelectors = {
  allKeys,
}
