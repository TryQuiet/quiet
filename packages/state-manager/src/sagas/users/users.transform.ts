import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { UsersState } from './users.slice'

export const UsersTransform = createTransform(
  (inboundState: UsersState, _key: any) => {
    return { ...inboundState }
  },
  (outboundState: UsersState, _key: any) => {
    // TODO: determine if we still need this transform
    // Maybe we should just not save the state at all
    // and fetch user profiles from orbitdb on app start
    // or we might want to remove user profiles that are not in the sigchain
    return {
      ...outboundState,
    }
  },
  { whitelist: [StoreKeys.Users] }
)
