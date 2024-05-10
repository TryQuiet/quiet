import { all, takeEvery, cancelled } from 'typed-redux-saga'
import { errorsActions } from './errors.slice'
import { handleErrorsSaga } from './handleErrors/handleErrors.saga'

export function* errorsMasterSaga(): Generator {
  console.log('errorsMasterSaga starting')
  try {
    yield all([takeEvery(errorsActions.handleError.type, handleErrorsSaga)])
  } finally {
    console.log('errorsMasterSaga stopping')
    if (yield cancelled()) {
      console.log('errorsMasterSaga cancelled')
    }
  }
}
