import { StoreKeys } from '@quiet/state-manager'
import { createTransform } from 'redux-persist'
import { InitState } from './init.slice'

export const InitTransform = createTransform(
  (inboundState: InitState, _key) => {
    return { ...inboundState }
  },
  (outboundState: InitState, _key) => {
    return {
      ...new InitState(),
      lastKnownDataPort: outboundState.lastKnownDataPort,
    }
  },
  { whitelist: [StoreKeys.Init] }
)
