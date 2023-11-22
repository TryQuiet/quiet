import { configureStore, combineReducers, getDefaultMiddleware } from '@reduxjs/toolkit'
import { reducers } from './reducers'
import createSagaMiddleware from 'redux-saga'
const rootReducer = combineReducers(reducers)
const sagaMiddleware = createSagaMiddleware()
const store = configureStore({
    reducer: rootReducer,
    middleware: [
        ...getDefaultMiddleware({ immutableCheck: false, serializableCheck: false, thunk: false }),
        sagaMiddleware,
    ],
})

export type Store = typeof store
export type StoreState = ReturnType<typeof rootReducer>
export type StoreDispatch = typeof store.dispatch

export type CreatedSelectors = {
    [Key in keyof StoreState]: (state: StoreState) => StoreState[Key]
}

export type StoreModuleStateClass = new () => object
