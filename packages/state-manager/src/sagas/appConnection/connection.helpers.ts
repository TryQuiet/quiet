export function resetStateAndSaveTorConnectionData(state) {
  const torBootstrapProcess = state.Connection.torBootstrapProcess

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
