import { startServicesSaga } from '../nativeServices/startServices/startServices.saga';
import { checkLibsVersionSaga } from './checkLibsVersion/checkLibsVersion.saga';
import { checkWaggleVersionSaga } from './checkWaggleVersion/checkWaggleVersion.saga';

export function* assetsMasterSaga(): Generator {
  yield* checkLibsVersionSaga();
  yield* checkWaggleVersionSaga();
  yield* startServicesSaga();
}
