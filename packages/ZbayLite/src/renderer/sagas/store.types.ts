import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../store/reducers'
const rootReducer = combineReducers(reducers)
const store = configureStore({ reducer: rootReducer })

export type StoreState = ReturnType<typeof rootReducer>
export type StoreDispatch = typeof store.dispatch

export type CreatedSelectors = {
  [Key in keyof StoreState]: (state: StoreState) => StoreState[Key];
}

export type StoreModuleStateClass = new() => object
