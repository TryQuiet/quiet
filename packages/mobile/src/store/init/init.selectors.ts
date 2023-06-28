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

export const lastKnownDataPort = createSelector(initSlice, reducerState => reducerState.lastKnownDataPort)

export const initDescription = createSelector(initSlice, reducerState => reducerState.initDescription)

export const initChecks = createSelector(initSlice, reducerState =>
  initChecksAdapter.getSelectors().selectAll(reducerState.initChecks)
)

export const deepLinking = createSelector(initSlice, reducerState => reducerState.deepLinking)

export const initSelectors = {
  isCryptoEngineInitialized,
  isWebsocketConnected,
  lastKnownDataPort,
  initDescription,
  initChecks,
  deepLinking,
}
