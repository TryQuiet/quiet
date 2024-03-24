import { delay, put } from 'typed-redux-saga'
import createLogger from '../../../utils/logger'
import { connectionActions } from '../connection.slice'

const logger = createLogger('connection')

export function* uptimeSaga(): Generator {
  // There is no point in updating this more often as we don't need precise data here, but we want to avoid spamming redux with excess actions
  const interval = 10000
  logger.debug(`Updating uptime on interval ${interval}ms`)
  while (true) {
    yield* put(connectionActions.updateUptime(interval))
    yield* delay(interval)
  }
}
