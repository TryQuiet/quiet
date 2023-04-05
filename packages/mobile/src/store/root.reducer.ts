import { combineReducers } from '@reduxjs/toolkit'
import { StoreKeys } from './store.keys'
import { initReducer } from './init/init.slice'
import stateManagerReducers, { resetStateAndSaveTorConnectionData } from '@quiet/state-manager'
import { navigationReducer } from './navigation/navigation.slice'
import { nativeServicesActions } from './nativeServices/nativeServices.slice'

export const reducers = {
  ...stateManagerReducers.reducers,
  [StoreKeys.Init]: initReducer,
  [StoreKeys.Navigation]: navigationReducer
}

export const allReducers = combineReducers(reducers)

export const rootReducer = (state, action) => {
  if (action.type === nativeServicesActions.resetApp.type) {
    state = resetStateAndSaveTorConnectionData(state)
  }

  return allReducers(state, action)
}
