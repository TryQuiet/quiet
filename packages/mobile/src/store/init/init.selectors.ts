import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'
import { initChecksAdapter } from './init.adapter'

const initSlice: CreatedSelectors[StoreKeys.Init] = (state: StoreState) => state[StoreKeys.Init]

export const isCryptoEngineInitialized = createSelector(
  initSlice,
  reducerState => reducerState.isCryptoEngineInitialized
)

export const isWebsocketConnected = createSelector(initSlice, reducerState => reducerState.isWebsocketConnected)

export const lastKnownSocketIOData = createSelector(initSlice, reducerState => reducerState.lastKnownSocketIOData)

export const initDescription = createSelector(initSlice, reducerState => reducerState.initDescription)

export const initChecks = createSelector(initSlice, reducerState =>
  initChecksAdapter.getSelectors().selectAll(reducerState.initChecks)
)

export const deepLinking = createSelector(initSlice, reducerState => reducerState.deepLinking)

export const ready = createSelector(initSlice, reducerState => reducerState.ready)

export const initSelectors = {
  isCryptoEngineInitialized,
  isWebsocketConnected,
  lastKnownSocketIOData,
  initDescription,
  initChecks,
  deepLinking,
  ready,
}
