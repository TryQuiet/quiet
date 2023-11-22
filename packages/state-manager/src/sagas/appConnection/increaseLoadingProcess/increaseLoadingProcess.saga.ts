import { delay, put, select } from 'typed-redux-saga'
import { connectionActions } from '../connection.slice'
import { connectionSelectors } from '../connection.selectors'
import { ConnectionProcessInfo } from '@quiet/types'

export function* increaseLoadingProcess(): Generator {
  let torConnectionProcess = yield* select(connectionSelectors.torConnectionProcess)
  const interval = 5000

  while (torConnectionProcess.text === ConnectionProcessInfo.CONNECTING_TO_COMMUNITY) {
    if (torConnectionProcess.number > 89) break
    yield* put(connectionActions.increaseConnectionToCommunityStep())
    yield* delay(interval)

    torConnectionProcess = yield* select(connectionSelectors.torConnectionProcess)
  }
}
