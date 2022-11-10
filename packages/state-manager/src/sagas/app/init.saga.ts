import { put, select } from 'typed-redux-saga'
import { connectionSelectors } from '../appConnection/connection.selectors'
import { connectionActions } from '../appConnection/connection.slice'

export function* initSaga(): Generator {
        const isAppRefresh = yield* select(connectionSelectors.appRefresh)
        if (!isAppRefresh) {
                yield* put(connectionActions.pruneConnectedPeers())
                yield* put(connectionActions.removeInitializedCommunities())
                yield* put(connectionActions.removeInitializedRegistrars())
        } else {
                yield* put(connectionActions.setAppRefresh(false))
        }
}
