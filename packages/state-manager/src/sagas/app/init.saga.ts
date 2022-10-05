import { put } from 'typed-redux-saga'
import { connectionActions } from '../appConnection/connection.slice'

export function* initSaga(): Generator {
        yield* put(connectionActions.pruneConnectedPeers()),
        yield* put(connectionActions.removeInitializedCommunities()),
        yield* put(connectionActions.removeInitializedRegistrars())
}
