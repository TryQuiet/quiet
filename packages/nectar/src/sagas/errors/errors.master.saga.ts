import { all, takeEvery } from 'typed-redux-saga';
import { errorsActions } from './errors.slice';
import { handleErrorSaga } from './handleErrors/handleErrors.saga';

export function* errorsMasterSaga(): Generator {
  yield all([takeEvery(errorsActions.addError.type, handleErrorSaga)]);
}
