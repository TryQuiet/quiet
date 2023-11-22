import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../store/reducers'

const rootReducer = combineReducers(reducers)
const store = configureStore({ reducer: rootReducer })
export type Store = typeof store
export type StoreState = ReturnType<typeof rootReducer>
export type StoreDispatch = typeof store.dispatch

export type CreatedSelectors<SelectedState> = {
    [Key in keyof SelectedState]: (state: SelectedState) => SelectedState[Key]
}

export type StoreModuleStateClass = new () => object
