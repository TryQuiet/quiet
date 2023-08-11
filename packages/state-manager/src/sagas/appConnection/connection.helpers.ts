import { TOR_BOOTSTRAP_COMPLETE } from '@quiet/types'
import { peersStatsAdapter } from './connection.adapter'

export function resetStateAndSaveTorConnectionData() {
  const torBootstrapProcess = TOR_BOOTSTRAP_COMPLETE

  const torConnectionProcess = {
    number: 5,
    text: 'Connecting process started',
  }

  const freshState = {
    Connection: {
      torBootstrapProcess,
      torConnectionProcess,
      peersStats: peersStatsAdapter.getInitialState(),
    },
  }

  return freshState
}
