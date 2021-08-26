import { PayloadAction } from '@reduxjs/toolkit';
import { NativeModules } from 'react-native';
import { put, call, select, all, takeEvery } from 'typed-redux-saga';
import { identityActions } from '../identity/identity.slice';
import { startConnectionSaga } from '../socket/startConnection/startConnection.saga';
import { doOnRestoreSaga } from './doOnRestore/doOnRestore.saga';
import { initActions } from './init.slice';

import FindFreePort from 'react-native-find-free-port';
import { identitySelectors } from '../identity/identity.selectors';

export function* initMasterSaga(): Generator {
  yield all([
    takeEvery(initActions.doOnRestore.type, doOnRestoreSaga),
    takeEvery(
      initActions.onTorInit.type,
      function* (
        _action: PayloadAction<
          ReturnType<typeof initActions.onTorInit>['payload']
        >,
      ): Generator {
        const port = yield* call(FindFreePort.getFirstStartingFrom, 9010);
        const key = yield* select(identitySelectors.commonKey);
        yield* call(NativeModules.TorModule.startHiddenService, port, key);
      },
    ),
    takeEvery(
      initActions.onOnionAdded.type,
      function* (
        action: PayloadAction<
          ReturnType<typeof initActions.onOnionAdded>['payload']
        >,
      ): Generator {
        yield* put(identityActions.storeCommonData(action.payload));
      },
    ),
    takeEvery(initActions.onWaggleStarted.type, startConnectionSaga),
  ]);
}
