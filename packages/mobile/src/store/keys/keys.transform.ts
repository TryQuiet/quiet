import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { KeysState } from './keys.slice'

export const KeysTransform = createTransform(
  (inboundState: KeysState, _key: any) => {
    return inboundState
  },
  (outboundState: KeysState, _key: any) => {
    // TODO: determine if we still need this transform
    return outboundState
  },
  { whitelist: [StoreKeys.Keys] }
)
