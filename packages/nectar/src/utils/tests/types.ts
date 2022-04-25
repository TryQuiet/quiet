import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { reducers } from './prepareStore'
const rootReducer = combineReducers(reducers)
const store = configureStore({ reducer: rootReducer })

export type TestStore = typeof store
export type TestStoreState = ReturnType<typeof rootReducer>