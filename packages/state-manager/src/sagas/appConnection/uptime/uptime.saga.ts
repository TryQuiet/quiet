import { delay, put } from 'typed-redux-saga'
import logger from '../../../utils/logger'
import { connectionActions } from '../connection.slice'

const log = logger('connection')

export function* uptimeSaga(): Generator {
    // There is no point in updating this more often as we don't need precise data here, but we want to avoid spamming redux with excess actions
    const interval = 10000
    while (true) {
        yield* put(connectionActions.updateUptime(interval))
        yield* delay(interval)
    }
}
