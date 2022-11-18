import { combineReducers } from '@reduxjs/toolkit'
import { StoreKeys } from './store.keys'
import { initReducer } from './init/init.slice'
import stateManagerReducers from '@quiet/state-manager'
import { navigationReducer } from './navigation/navigation.slice'

export const reducers = {
  ...stateManagerReducers.reducers,
  [StoreKeys.Init]: initReducer,
  [StoreKeys.Navigation]: navigationReducer
}

export const rootReducer = combineReducers(reducers)
