import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { type ConnectionState } from './connection.slice'
import { ConnectionProcessInfo } from '@quiet/types'

export const ConnectionTransform = createTransform<ConnectionState, ConnectionState>(
  (inboundState: ConnectionState, _key: any) => {
    return {
      ...inboundState,
      deviceLinkInvite: undefined,
      deviceLinkCreationFailed: false,
      linkedDevices: undefined,
    }
  },
  (outboundState: ConnectionState, _key: any) => {
    return {
      ...outboundState,
      torBootstrapProcess: 'Bootstrapped 0% (starting)',
      connectionProcess: {
        number: 5,
        text: ConnectionProcessInfo.CONNECTION_STARTED,
      },
      isTorInitialized: false,
      socketIOSecret: null,
      deviceLinkInvite: undefined,
      deviceLinkCreationFailed: false,
      linkedDevices: undefined,
      networkEndpoints: {},
      p2pEnabled: true,
    }
  },
  { whitelist: [StoreKeys.Connection] }
)
