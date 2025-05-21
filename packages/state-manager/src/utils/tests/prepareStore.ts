import { combineReducers, createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'
import { StoreKeys } from '../../sagas/store.keys'
import { lastActionReducer } from './helpers'
import { reducers } from '../../sagas/reducers'

export const testReducers = {
  ...reducers,
  [StoreKeys.LastAction]: lastActionReducer,
}

export const prepareStore = (mockedState?: { [key in StoreKeys]?: any }) => {
  const combinedReducers = combineReducers(testReducers)
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(combinedReducers, mockedState, applyMiddleware(...[sagaMiddleware, thunk]))

  return {
    store,
    runSaga: sagaMiddleware.run,
  }
}
