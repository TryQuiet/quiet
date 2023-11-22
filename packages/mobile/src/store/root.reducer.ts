import { combineReducers, AnyAction } from '@reduxjs/toolkit'
import stateManagerReducers, { resetStateAndSaveTorConnectionData } from '@quiet/state-manager'
import { StoreKeys } from './store.keys'
import { initReducer } from './init/init.slice'
import { navigationReducer } from './navigation/navigation.slice'
import { nativeServicesReducer, nativeServicesActions } from './nativeServices/nativeServices.slice'

export const reducers = {
    ...stateManagerReducers.reducers,
    [StoreKeys.Init]: initReducer,
    [StoreKeys.Navigation]: navigationReducer,
    [StoreKeys.NativeServices]: nativeServicesReducer,
}

export const allReducers = combineReducers(reducers)

export const rootReducer = (state: any, action: AnyAction) => {
    if (action.type === nativeServicesActions.resetApp.type) {
        state = resetStateAndSaveTorConnectionData()
    }

    return allReducers(state, action)
}
