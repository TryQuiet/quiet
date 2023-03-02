import { configureStore, combineReducers, getDefaultMiddleware } from '@reduxjs/toolkit'
import { reducers } from './prepareStore'
import createSagaMiddleware from 'redux-saga'

const rootReducer = combineReducers(reducers)
const sagaMiddleware = createSagaMiddleware()

const store = configureStore({
  reducer: rootReducer,
  middleware: [
    ...getDefaultMiddleware({ immutableCheck: false, serializableCheck: false, thunk: false }),
    sagaMiddleware
  ]
})

export type TestStore = typeof store
export type TestStoreState = ReturnType<typeof rootReducer>
