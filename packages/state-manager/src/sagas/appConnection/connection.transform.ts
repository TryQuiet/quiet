import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { ConnectionState } from './connection.slice'

export const ConnectionTransform = createTransform(
  (inboundState: ConnectionState, _key) => {
    return { ...inboundState }
  },
  (outboundState: ConnectionState, _key) => {
    return {
      ...outboundState,
      torBootstrapProcess: 'Bootstrapped 5% (conn)',
      torConnectionProcess: {
        number: 5,
        text: 'Connecting process started'
      }
    }
  },
  { whitelist: [StoreKeys.Connection] }
)
