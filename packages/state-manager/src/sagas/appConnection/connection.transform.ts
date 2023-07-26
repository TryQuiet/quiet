import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { type ConnectionState } from './connection.slice'

export const ConnectionTransform = createTransform(
  (inboundState: ConnectionState, _key: any) => {
    return { ...inboundState }
  },
  (outboundState: ConnectionState, _key: any) => {
    return {
      ...outboundState,
      torBootstrapProcess: 'Bootstrapped 0% (starting)',
      torConnectionProcess: {
        number: 5,
        text: 'Connecting process started',
      },
      isConnectionManager: false,
    }
  },
  { whitelist: [StoreKeys.Connection] }
)
