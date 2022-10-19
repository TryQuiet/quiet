import { put, spawn } from 'typed-redux-saga'
import { connectionActions } from '../appConnection/connection.slice'
import { restoreVerificationStatusesSaga } from '../messages/restoreVerificationStatuses/restoreVerificationStatuses.saga'

export function* initSaga(): Generator {
        yield* put(connectionActions.pruneConnectedPeers())
        yield* put(connectionActions.removeInitializedCommunities())
        yield* put(connectionActions.removeInitializedRegistrars())
        yield* spawn(restoreVerificationStatusesSaga)
}
