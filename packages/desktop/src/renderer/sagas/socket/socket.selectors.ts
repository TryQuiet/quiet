import { createSelector } from 'reselect'
import { StoreKeys } from '../../store/store.keys'
import { StoreState } from '../store.types'
import { selectReducer } from '../store.utils'

const reducer = selectReducer(StoreKeys.Socket)

export const isConnected = createSelector(
    reducer,
    (reducerState: StoreState[StoreKeys.Socket]) => reducerState.isConnected
)

export const socketSelectors = {
    isConnected,
}
