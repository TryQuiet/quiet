import { delay, put } from 'typed-redux-saga'
import { connectionActions } from '../connection.slice'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('uptimeSaga')

export function* uptimeSaga(): Generator {
  // There is no point in updating this more often as we don't need precise data here, but we want to avoid spamming redux with excess actions
  const interval = 10000
  while (true) {
    yield* put(connectionActions.updateUptime(interval))
    yield* delay(interval)
  }
}
