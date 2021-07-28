import { PayloadAction } from '@reduxjs/toolkit';
import { put, all, takeEvery } from 'typed-redux-saga';
import { identityActions } from '../identity/identity.slice';
import { nativeServicesActions } from '../nativeServices/nativeServices.slice';
import { startConnectionSaga } from '../socket/startConnection/startConnection.saga';
import { doOnRestoreSaga } from './doOnRestore/doOnRestore.saga';
import { initActions } from './init.slice';

export function* initMasterSaga(): Generator {
  yield all([
    takeEvery(initActions.onWaggleStarted.type, startConnectionSaga),
    takeEvery(initActions.doOnRestore.type, doOnRestoreSaga),
    /* Hidden services management will be handled from waggle directly
    information about common name should be passed through websocket */
    takeEvery(
      initActions.onOnionAdded.type,
      function* (
        action: PayloadAction<
          ReturnType<typeof initActions.onOnionAdded>['payload']
        >,
      ): Generator {
        yield* put(identityActions.storeCommonName(action.payload));
        /* By default, waggle should be started after Tor initializes.
        Then, hidden services should be managed from inside it */
        yield* put(nativeServicesActions.startWaggle(action.payload));
      },
    ),
  ]);
}
