import { rootReducer } from './root.reducer'
import { store } from './store'

export type Store = typeof store
export type StoreState = ReturnType<typeof rootReducer>
export type StoreDispatch = typeof store.dispatch

export type CreatedSelectors = {
    [Key in keyof StoreState]: (state: StoreState) => StoreState[Key]
}

export type StoreModuleStateClass = new () => object // eslint-disable-line @typescript-eslint/ban-types
