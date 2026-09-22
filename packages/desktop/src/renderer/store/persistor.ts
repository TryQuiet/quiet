import { persistStore } from 'redux-persist'
import store from './index'

export const persistor = persistStore(store)
