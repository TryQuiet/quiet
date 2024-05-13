import { delay, put } from 'typed-redux-saga'
import { connectionActions } from '../connection.slice'

export function* uptimeSaga(): Generator {
  // There is no point in updating this more often as we don't need precise data here, but we want to avoid spamming redux with excess actions
  const interval = 10000
  console.info(`Updating uptime on interval ${interval}ms`)
  while (true) {
    yield* put(connectionActions.updateUptime(interval))
    yield* delay(interval)
  }
}
