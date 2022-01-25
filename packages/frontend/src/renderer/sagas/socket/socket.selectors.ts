import { createSelector } from 'reselect'
import { StoreKeys } from '../../store/store.keys'
import { StoreState } from '../store.types'
import { selectReducer } from '../store.utils'

export const isConnected = createSelector(
  selectReducer(StoreKeys.Socket),
  (reducerState: StoreState[StoreKeys.Socket]) => reducerState.isConnected
)

export const socketSelectors = {
  isConnected
}
