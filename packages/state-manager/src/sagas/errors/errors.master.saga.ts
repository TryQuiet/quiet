import { all, takeEvery } from 'typed-redux-saga'
import { errorsActions } from './errors.slice'
import { handleErrorsSaga } from './handleErrors/handleErrors.saga'

export function* errorsMasterSaga(): Generator {
    yield all([takeEvery(errorsActions.handleError.type, handleErrorsSaga)])
}
