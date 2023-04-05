import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { IdentityState } from './identity.slice'

export const IdentityTransform = createTransform(
  (inboundState: IdentityState, _key) => {
    return { ...inboundState }
  },
  (outboundState: IdentityState, _key) => {
    return {
      ...outboundState,
      isRegisterButtonClicked: false
    }
  },
  { whitelist: [StoreKeys.Identity] }
)
