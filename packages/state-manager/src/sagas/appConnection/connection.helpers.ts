import { ConnectionProcessInfo, TOR_BOOTSTRAP_COMPLETE } from '@quiet/types'

export function resetStateAndSaveTorConnectionData() {
  const torBootstrapProcess = TOR_BOOTSTRAP_COMPLETE

  const connectionProcess = {
    number: 5,
    text: ConnectionProcessInfo.CONNECTION_STARTED,
  }

  const freshState = {
    Connection: {
      torBootstrapProcess,
      connectionProcess,
      peerStats: { ids: [], entities: {} },
    },
  }

  return freshState
}
