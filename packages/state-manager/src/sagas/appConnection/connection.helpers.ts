import { TOR_BOOTSTRAP_COMPLETE } from './connection.types'

export function resetStateAndSaveTorConnectionData() {
  const torBootstrapProcess = TOR_BOOTSTRAP_COMPLETE

  const torConnectionProcess = {
    number: 5,
    text: 'Connecting process started'
  }

  const freshState = {
    Connection: {
      torBootstrapProcess,
      torConnectionProcess
    }
  }

  return freshState
}
