import {fork} from 'typed-redux-saga';
import {startServicesSaga} from './startServices/startServices.saga';

export function* nativeServicesMasterSaga(): Generator {
  yield* fork(startServicesSaga);
}
