import {fork} from 'typed-redux-saga';
import {startConnectionSaga} from './startConnection/startConnection.saga';

export function* socketMasterSaga(): Generator {
  yield* fork(startConnectionSaga);
}
