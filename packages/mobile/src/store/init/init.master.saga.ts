import { all, takeEvery, takeLatest, takeLeading } from 'typed-redux-saga'
import { initActions } from './init.slice'
import { blindConnectionSaga } from './blindConnection/blindConnection.saga'
import { startConnectionSaga } from './startConnection/startConnection.saga'
import { deepLinkSaga } from './deepLink/deepLink.saga'

export function* initMasterSaga(): Generator {
    yield all([
        takeEvery(initActions.blindWebsocketConnection.type, blindConnectionSaga),
        takeLatest(initActions.startWebsocketConnection.type, startConnectionSaga),
        takeLeading(initActions.deepLink.type, deepLinkSaga),
    ])
}
