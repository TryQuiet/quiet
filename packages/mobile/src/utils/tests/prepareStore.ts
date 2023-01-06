import { combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { StoreKeys } from '../../store/store.keys'
import { reducers } from '../../store/root.reducer'

export const prepareStore = (mockedState?: { [key in StoreKeys]?: any }) => {
  const combinedReducers = combineReducers(reducers)
  const sagaMiddleware = createSagaMiddleware()
  const store = configureStore({
    middleware: [
      ...getDefaultMiddleware({ immutableCheck: false, serializableCheck: false, thunk: false }),
      sagaMiddleware
    ],
    reducer: combinedReducers,
    preloadedState: mockedState
  })

  return {
    store,
    runSaga: sagaMiddleware.run
  }
}
