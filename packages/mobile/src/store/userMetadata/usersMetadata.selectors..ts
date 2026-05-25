import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'

const usersMetadataSlice: CreatedSelectors[StoreKeys.UsersMetadata] = (state: StoreState) =>
  state[StoreKeys.UsersMetadata]

export const usersMetadataSelectors = {}
