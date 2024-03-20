import { delay, put } from 'typed-redux-saga'
import { loggingHandler, LoggerModuleName } from '../../../utils/logger'
import { connectionActions } from '../connection.slice'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.APP_CONNECTION, LoggerModuleName.SAGA, 'uptime'])

export function* uptimeSaga(): Generator {
  // There is no point in updating this more often as we don't need precise data here, but we want to avoid spamming redux with excess actions
  const interval = 10000
  while (true) {
    LOGGER.debug(`Updating uptime on interval ${interval}ms`)
    yield* put(connectionActions.updateUptime(interval))
    yield* delay(interval)
  }
}
