import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'

const keysSlice: CreatedSelectors[StoreKeys.Keys] = (state: StoreState) => state[StoreKeys.Keys]

export const keysSelectors = {}
